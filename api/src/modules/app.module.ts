import { Types } from "mongoose";
import * as winston from "winston";

import { Module } from "@nestjs/common";
import { APP_INTERCEPTOR } from "@nestjs/core";
import { WinstonModule } from "nest-winston";
import { ConfigModule } from "@nestjs/config";
import { GraphQLModule } from "@nestjs/graphql";
import { MongooseModule } from "@nestjs/mongoose";
import { ApolloDriver, ApolloDriverConfig } from "@nestjs/apollo";
import { ScheduleModule } from "@nestjs/schedule";

import "../enums/graphql-enums";
import { env } from "../config";
import { AuthModule } from "./auth";
import { UserModule } from "./user";
import { FileModule } from "./file";
import { CourseModule } from "./course";
import { HealthModule } from "./health";
import { DatabaseModule } from "./database";
import { AppSettingsModule } from "./app-settings";
import { PaymentCouponModule } from "./payment-coupon";
import { EmailModule } from "./email";
import { TicketModule } from "./ticket";
import { UserRole, NodeEnv } from "../enums";
import {
  AuditInterceptor,
  LoggingInterceptor,
  TransformInterceptor,
} from "../interceptors";
import { ExceptionRegistry } from "../exceptions/exception.registry";
import { EXCEPTION_CONSTANT } from "../constants/exception.constant";
import { GraphQLError } from "graphql";

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ".env",
    }),

    // Database
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async () => ({
        uri: env.MONGODB_URI,
        dbName: env.MONGODB_DATABASE,
      }),
      inject: [],
    }),

    // GraphQL
    GraphQLModule.forRootAsync<ApolloDriverConfig>({
      driver: ApolloDriver,
      imports: [ConfigModule],
      useFactory: async () => ({
        autoSchemaFile: true, // Generate schema in memory, no file output
        sortSchema: true,
        path: "/graphql",
        playground: env.GRAPHQL_PLAYGROUND ? { endpoint: "/graphql" } : false,
        introspection: env.GRAPHQL_INTROSPECTION !== false, // Always enable in development
        csrfPrevention: false, // Disable CSRF protection for development
        allowBatchedHttpRequests: true,
        formatError: (error: GraphQLError) => {
          const exceptionName =
            error.extensions?.stacktrace?.[0]?.match(/^(\w+Exception):/)?.[1];

          const isDevelopment = env.NODE_ENV === NodeEnv.DEVELOPMENT;

          // Check if error code is UNAUTHENTICATED from extensions
          const extensions = error.extensions as
            | { code?: string; exception?: { code?: string } }
            | undefined;
          const errorCode = extensions?.code || extensions?.exception?.code;

          if (exceptionName) {
            const exception = ExceptionRegistry.createException(
              exceptionName,
              error.message,
            );
            if (exception) {
              return {
                message: exception.getMessage(),
                code: exception.getCode(),
                name: exception.name,
                payload: exception.payload,
                ...(isDevelopment && { extensions: error.extensions }),
              };
            }
          }

          // Extract message from "Unexpected error value: \"...\"" format
          const message =
            error.message.match(/Unexpected error value:\s*"([^"]+)"/)?.[1] ||
            error.message;

          return {
            message,
            code:
              errorCode === "UNAUTHENTICATED"
                ? EXCEPTION_CONSTANT.UNAUTHENTICATED.code
                : EXCEPTION_CONSTANT.INTERNAL_SERVER_ERROR.code,
            ...(isDevelopment && { extensions: error.extensions }),
          };
        },
        context: ({ req }) => ({
          req,
          user: (
            req as {
              user?: {
                userId: Types.ObjectId;
                username: string;
                roles: UserRole[];
                sessionId: string;
              };
            }
          ).user,
        }),
      }),
      inject: [],
    }),

    // Logging
    WinstonModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: () => ({
        level: env.LOG_LEVEL,
        format: winston.format.combine(
          winston.format.timestamp(),
          winston.format.errors({ stack: true }),
          winston.format.json(),
        ),
        transports: [
          new winston.transports.Console({
            format: winston.format.combine(
              winston.format.colorize(),
              winston.format.simple(),
            ),
          }),
          new winston.transports.File({
            filename: env.LOG_FILE,
          }),
        ],
      }),
      inject: [],
    }),

    // Scheduler (for cron jobs)
    ScheduleModule.forRoot(),

    // Feature modules
    DatabaseModule,
    AuthModule,
    HealthModule,
    FileModule,
    AppSettingsModule,
    PaymentCouponModule,
    EmailModule,
    TicketModule,
    CourseModule,
    UserModule,
  ],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: AuditInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: TransformInterceptor,
    },
  ],
})
export class AppModule {}
