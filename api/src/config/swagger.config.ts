import { INestApplication } from "@nestjs/common";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";

import { env } from "./env";

export const setupSwagger = (app: INestApplication) => {
  const config = new DocumentBuilder()
    .setTitle("Negin Heal API")
    //     .setDescription(
    //       `
    // # Negin Heal Management System API

    // A comprehensive RESTful API for managing operations and health tracking.
    //     `,
    //     )
    .setVersion("1.0.0")
    // .setContact(
    //   "Negin Heal Team",
    //   "https://negin-heal.com",
    //   "support@negin-heal.com",
    // )
    // .setLicense("MIT", "https://opensource.org/licenses/MIT")
    .addServer(`http://localhost:${env.PORT}`, "Development Server")
    .addServer("https://api.negin-heal.com", "Production Server")
    .addTag("Health", "System health and monitoring endpoints")
    .addTag("Animals", "Animal records and health tracking")
    .addBearerAuth(
      {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
        name: "JWT",
        description: "Enter JWT token",
        in: "header",
      },
      "JWT-auth", // This name should be same as used in @ApiBearerAuth('JWT-auth')
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);

  SwaggerModule.setup("api/docs", app, document, {
    customSiteTitle: "Negin Heal API Documentation",
    customfavIcon: "/favicon.ico",
    customCss: `
      .swagger-ui .topbar { display: none; }
      .swagger-ui .info .title { color: #2c3e50; }
      .swagger-ui .scheme-container { background: #f8f9fa; padding: 10px; border-radius: 4px; }
    `,
    swaggerOptions: {
      persistAuthorization: true,
      displayRequestDuration: true,
      filter: true,
      showRequestHeaders: true,
      tryItOutEnabled: true,
    },
  });

  return document;
};
