import { randomUUID } from "crypto";
import * as winston from "winston";

import { Module, Logger } from "@nestjs/common";
import { APP_INTERCEPTOR } from "@nestjs/core";
import { WinstonModule } from "nest-winston";
import { ConfigModule } from "@nestjs/config";
import { GraphQLModule } from "@nestjs/graphql";
import { MongooseModule } from "@nestjs/mongoose";
import { ApolloDriver, ApolloDriverConfig } from "@nestjs/apollo";
import { ScheduleModule } from "@nestjs/schedule";

import { CronModule } from "../cron";
import GraphQLJSON from "graphql-type-json";

import "../enums/graphql-enums";
import { env } from "../config";
import { AuthModule } from "./auth";
import { UserModule, UserSubscriptionService } from "./user";
import { FileModule } from "./file";
import { ProductModule } from "./product";
import { ProductReviewModule } from "./product-review";
import { HealthModule } from "./health";
import { DatabaseModule } from "./database";
import { AppSettingsModule } from "./app-settings";
import { CouponModule } from "./coupon";
import { NotificationModule } from "./notification";
import { PushNotificationModule } from "./push-notification";
import { EmailModule } from "./email";
import { TicketModule } from "./ticket";
import { BadgeModule } from "./badge";
import { BackupModule } from "./backup";
import { TelegramModule } from "./telegram";
import { AuthenticatedRequest } from "../types/graphql-context.types";
import {
  AuditInterceptor,
  LoggingInterceptor,
  TransformInterceptor,
} from "../interceptors";
import { GraphQLError } from "graphql";
import { formatUserFacingGraphQLError } from "../utils/resolve-user-facing-error.util";

const graphQLErrorLogger = new Logger("GraphQLError");

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
        serverSelectionTimeoutMS: 5_000,
        connectTimeoutMS: 5_000,
      }),
      inject: [],
    }),

    // GraphQL
    GraphQLModule.forRootAsync<ApolloDriverConfig>({
      driver: ApolloDriver,
      imports: [ConfigModule, UserModule],
      useFactory: async (userSubscriptionService: UserSubscriptionService) => {
        const wsConnectionIds = new WeakMap<object, string>();

        const resolveAuthorizationHeader = (
          connectionParams?: Record<string, unknown>,
        ): string | undefined => {
          const value =
            connectionParams?.authorization || connectionParams?.Authorization;

          if (typeof value === "string" && value.trim().length > 0) {
            return value;
          }

          return undefined;
        };

        const resolveWsSocketRef = (extra?: {
          socket?: object;
          request?: { socket?: object };
        }): object | undefined => {
          if (extra?.socket) {
            return extra.socket;
          }

          if (extra?.request?.socket) {
            return extra.request.socket;
          }

          return undefined;
        };

        return {
          autoSchemaFile: true, // Generate schema in memory, no file output
          sortSchema: true,
          path: "/graphql",
          resolvers: { JSON: GraphQLJSON },
          playground: env.GRAPHQL_PLAYGROUND ? { endpoint: "/graphql" } : false,
          introspection: env.GRAPHQL_INTROSPECTION !== false, // Always enable in development
          csrfPrevention: false, // Disable CSRF protection for development
          allowBatchedHttpRequests: true,
          subscriptions: {
            "graphql-ws": {
              onDisconnect: async (context: {
                extra?: { socket?: object; request?: { socket?: object } };
              }) => {
                const socketRef = resolveWsSocketRef(context?.extra);
                if (!socketRef) {
                  return;
                }

                const connectionId = wsConnectionIds.get(socketRef);
                if (!connectionId) {
                  return;
                }

                userSubscriptionService.unregisterConnection(connectionId);
                wsConnectionIds.delete(socketRef);
              },
            },
          },
          formatError: (error: GraphQLError) => {
            const formatted = formatUserFacingGraphQLError(
              error,
              graphQLErrorLogger,
              false,
            );

            return {
              message: formatted.code,
              code: formatted.code,
              ...(formatted.params ? { params: formatted.params } : {}),
              ...(formatted.extensions
                ? { extensions: formatted.extensions }
                : {}),
            };
          },
          context: ({
            req,
            extra,
            connectionParams,
          }: {
            req?: AuthenticatedRequest;
            extra?: {
              socket?: object;
              request?: { socket?: { remoteAddress?: string } };
            };
            connectionParams?: Record<string, unknown>;
          }) => {
            if (req) {
              return {
                req,
                user: req.user,
              };
            }

            const socketRef = resolveWsSocketRef(extra);
            let connectionId =
              (socketRef && wsConnectionIds.get(socketRef)) || undefined;

            if (!connectionId) {
              connectionId = randomUUID();
              if (socketRef) {
                wsConnectionIds.set(socketRef, connectionId);
              }
            }

            const authorization = resolveAuthorizationHeader(connectionParams);
            const wsReq = {
              headers: authorization ? { authorization } : {},
              ip: extra?.request?.socket?.remoteAddress,
              subscriptionConnectionId: connectionId,
            } as AuthenticatedRequest;

            return {
              req: wsReq,
              user: wsReq.user,
            };
          },
        };
      },
      inject: [UserSubscriptionService],
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
    CronModule,

    // Feature modules
    DatabaseModule,
    AuthModule,
    HealthModule,
    FileModule,
    AppSettingsModule,
    CouponModule,
    NotificationModule,
    PushNotificationModule,
    EmailModule,
    TicketModule,
    BadgeModule,
    BackupModule,
    TelegramModule,
    ProductModule,
    ProductReviewModule,
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
