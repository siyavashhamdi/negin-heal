import helmet from "helmet";
import mongoose, { Schema } from "mongoose";
import * as compression from "compression";

import { NestFactory } from "@nestjs/core";
import { NestExpressApplication } from "@nestjs/platform-express";
import {
  Logger,
  ValidationPipe,
  ArgumentMetadata,
  BadRequestException,
  Logger as NestLogger,
} from "@nestjs/common";

import { NodeEnv } from "./enums";
import { env, setupSwagger } from "./config";
import { HttpExceptionFilter } from "./filters";
import { AppModule } from "./modules/app.module";
import { SecurityConfig } from "./config/security.config";
import { EXCEPTION_CONSTANT } from "./constants/exception.constant";

function hideVersionKeyPlugin(schema: Schema) {
  // Stop writing __v for new/updated docs
  schema.options.versionKey = false;
}

export async function bootstrap() {
  // Apply global plugin to disable version key (__v) for ALL schemas
  // This applies automatically to all schemas created in the application
  mongoose.plugin(hideVersionKeyPlugin);

  const maxRequestSizeBytes = SecurityConfig.getMaxRequestSize();

  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bodyParser: false,
  });
  app.useBodyParser("json", { limit: maxRequestSizeBytes });
  app.useBodyParser("urlencoded", {
    limit: maxRequestSizeBytes,
    extended: true,
  });
  const logger = new Logger("Bootstrap");
  const validationLogger = new NestLogger("ValidationPipe");

  // Security middleware - High Security Mode
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: [
            "'self'",
            "'unsafe-inline'",
            "https://fonts.googleapis.com",
            "https://cdn.jsdelivr.net",
            "http://cdn.jsdelivr.net",
          ],
          fontSrc: [
            "'self'",
            "https://fonts.gstatic.com",
            "https://cdn.jsdelivr.net",
            "http://cdn.jsdelivr.net",
          ],
          scriptSrc: [
            "'self'",
            "'unsafe-inline'",
            "'unsafe-eval'",
            "https://cdn.jsdelivr.net",
            "http://cdn.jsdelivr.net",
            "https://unpkg.com",
            "http://unpkg.com",
          ],
          imgSrc: [
            "'self'",
            "data:",
            "https://cdn.jsdelivr.net",
            "http://cdn.jsdelivr.net",
          ],
          connectSrc: [
            "'self'",
            "https://cdn.jsdelivr.net",
            "http://cdn.jsdelivr.net",
          ],
        },
      },
      crossOriginEmbedderPolicy: false,
      // Additional security headers
      hsts: {
        maxAge: 31536000, // 1 year
        includeSubDomains: true,
        preload: true,
      },
      noSniff: true, // Prevent MIME type sniffing
      xssFilter: true, // XSS protection
      referrerPolicy: { policy: "no-referrer" }, // Don't leak referrer info
    }),
  );
  app.use(compression());

  // Request size limits to prevent DoS attacks
  app.use((req, res, next) => {
    const maxSize = SecurityConfig.getMaxRequestSize();
    const contentLength = req.headers["content-length"];
    if (contentLength && parseInt(contentLength, 10) > maxSize) {
      return res.status(413).json({
        success: false,
        error: {
          statusCode: 413,
          message: ["Request entity too large"],
          error: "PayloadTooLarge",
          timestamp: new Date().toISOString(),
          path: req.url || req.path,
        },
      });
    }
    next();
  });

  // CORS configuration - restrict to allowed origins
  app.enableCors({
    origin: true, // TODO: Allowed all origins, change it to be `allowedOrigins` later.
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "X-File-Name",
      "X-Upload-Policy",
      "X-Apollo-Operation-Name",
      "apollo-require-preflight",
    ],
    maxAge: 86400, // Cache preflight requests for 24 hours
  });

  // Swagger documentation - Setup BEFORE global prefix so it's accessible at /api/docs
  // Note: Swagger may fail with tsx due to missing TypeScript metadata
  // We catch errors to allow the app to start even if Swagger fails
  if (env.NODE_ENV !== NodeEnv.PRODUCTION) {
    try {
      setupSwagger(app);
    } catch (error) {
      logger.warn(
        "Swagger setup failed (this is expected when using tsx). Swagger will be disabled.",
      );
      logger.debug(
        `Swagger error: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  // Global prefix
  app.setGlobalPrefix(env.API_PREFIX);

  // Handle Chrome DevTools well-known requests (optional, reduces console noise)
  app.use((req, res, next) => {
    if (req.path.startsWith("/.well-known/")) {
      return res.status(404).json({ message: "Not found" });
    }
    next();
  });

  // Global pipes
  // Custom ValidationPipe that handles both REST and GraphQL
  // GraphQL inputs can use class-validator decorators for validation
  class SmartValidationPipe extends ValidationPipe {
    async transform(
      value: unknown,
      metadata: ArgumentMetadata,
    ): Promise<unknown> {
      // Try normal validation first (this will work if class-validator decorators exist)
      try {
        return await super.transform(value, metadata);
      } catch (error) {
        // If validation fails with "should not exist" for Input classes,
        // it means the Input class has NO validators (pure GraphQL @Field only)
        // In that case, skip ValidationPipe (GraphQL schema validates it)
        // But if validators exist (like @IsEmail), this error means validation actually failed
        // and we should return the validation error
        if (
          (error as { message?: string })?.message?.includes(
            "should not exist",
          ) &&
          metadata?.metatype?.name?.endsWith("Input")
        ) {
          // This is a pure GraphQL input without validators - skip ValidationPipe
          return value;
        }
        // For other errors (including validation failures from @IsEmail, etc.), throw them
        throw error;
      }
    }
  }

  app.useGlobalPipes(
    new SmartValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
      exceptionFactory: (errors) => {
        const details = errors.map((error) => ({
          property: error.property,
          constraints: error.constraints,
          children: error.children?.length ?? 0,
        }));
        validationLogger.warn(`Validation failed: ${JSON.stringify(details)}`);

        return new BadRequestException(EXCEPTION_CONSTANT.VALIDATION_FAILED);
      },
    }),
  );

  // Global filters
  // HTTP exception filter for REST endpoints (GraphQL has its own error handler)
  app.useGlobalFilters(new HttpExceptionFilter());

  // Interceptors are registered as APP_INTERCEPTOR providers in AppModule
  // This allows proper dependency injection

  await app.listen(env.PORT);

  // Use BASE_URL from env or construct from current host and port
  const baseUrl = env.BASE_URL || `http://localhost:${env.PORT}`;
  const apiUrl = `${baseUrl}/${env.API_PREFIX}`;
  const graphqlUrl = `${baseUrl}/graphql`;
  const docsUrl = `${baseUrl}/api/docs`;

  logger.log(`🚀 Application is running on: ${apiUrl}`);
  logger.log(`📊 GraphQL Playground: ${graphqlUrl}`);
  if (env.NODE_ENV !== NodeEnv.PRODUCTION) {
    logger.log(`📚 API Documentation: ${docsUrl}`);
  }
}
