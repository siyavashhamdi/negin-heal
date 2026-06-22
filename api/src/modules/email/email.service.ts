import * as nodemailer from "nodemailer";

import { Injectable, Logger } from "@nestjs/common";

import { APP_SETTING_KEY } from "../../constants";
import { env } from "../../config/env";
import { AppSettingsService } from "../app-settings";
import { EmailTemplate, EmailTemplateInputs } from "./email-template";
import {
  PASSWORD_RESET_EMAIL_HTML,
  PASSWORD_RESET_EMAIL_SUBJECT,
  isLegacyPasswordResetEmailTemplate,
} from "./password-reset-email.template";
import {
  WELCOME_EMAIL_HTML,
  WELCOME_EMAIL_SUBJECT,
  isLegacyWelcomeEmailTemplate,
} from "./welcome-email.template";
import {
  VERIFY_EMAIL_HTML,
  VERIFY_EMAIL_SUBJECT,
  isLegacyVerifyEmailTemplate,
} from "./verify-email.template";

type StoredEmailSmtpConfig = {
  host?: unknown;
  port?: unknown;
  secure?: unknown;
  username?: unknown;
  password?: unknown;
  fromName?: unknown;
  fromEmail?: unknown;
};

type NormalizedEmailSmtpConfig = {
  host: string;
  port: number;
  secure: boolean;
  username: string;
  password: string;
  fromName: string;
  fromEmail: string;
};

type SendEmailInput = {
  to: string;
  subject: string;
  html: string;
  replyTo?: string;
};

type SendPasswordResetEmailInput = {
  to: string;
  resetCode: string;
  expiresInMinutes?: number;
};

type SendWelcomeEmailInput = {
  to: string;
  userFirstName: string;
  activationUrl: string;
};

type SendVerifyEmailInput = {
  to: string;
  userFirstName: string;
  verificationUrl: string;
};

type CommonEmailTemplateInputs = {
  APP_NAME: string;
  APP_URL: string;
  SECURITY_TEAM_NAME: string;
};

type PasswordResetTemplateInputs = CommonEmailTemplateInputs & {
  RESET_CODE: string;
};

type WelcomeTemplateInputs = CommonEmailTemplateInputs & {
  USER_FIRST_NAME: string;
  ACTIVATION_URL: string;
};

type VerifyEmailTemplateInputs = CommonEmailTemplateInputs & {
  USER_FIRST_NAME: string;
  VERIFICATION_URL: string;
};

type StoredEmailTemplateConfig = {
  name?: unknown;
  subject?: unknown;
  html?: unknown;
};

type RenderedEmailTemplate = {
  subject: string;
  html: string;
};

const EMAIL_TEMPLATE_NAME = {
  PASSWORD_RESET: "PASSWORD_RESET",
  WELCOME: "WELCOME",
  VERIFY_EMAIL: "VERIFY_EMAIL",
} as const;

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter | null = null;
  private transporterConfigSignature: string | null = null;
  private readonly appName = "Negin Heal";

  constructor(private readonly appSettingsService: AppSettingsService) {}

  async sendEmail(input: SendEmailInput): Promise<void> {
    const config = await this.getActiveSmtpConfigOrThrow();
    const transporter = await this.getTransporter(config);

    await transporter.sendMail({
      from: this.formatFrom(config.fromName, config.fromEmail),
      to: input.to,
      subject: input.subject,
      html: input.html,
      replyTo: input.replyTo,
    });

    this.logger.debug(`Email sent to ${input.to}`);
  }

  async sendPasswordResetEmail(
    input: SendPasswordResetEmailInput,
  ): Promise<void> {
    const template = await this.renderConfiguredEmailTemplate(
      EMAIL_TEMPLATE_NAME.PASSWORD_RESET,
      {
        ...this.buildCommonTemplateInputs(),
        RESET_CODE: input.resetCode,
      } satisfies PasswordResetTemplateInputs,
    );

    await this.sendEmail({
      to: input.to,
      subject: template.subject,
      html: template.html,
    });
  }

  async sendWelcomeEmail(input: SendWelcomeEmailInput): Promise<void> {
    const template = await this.renderConfiguredEmailTemplate(
      EMAIL_TEMPLATE_NAME.WELCOME,
      {
        ...this.buildCommonTemplateInputs(),
        USER_FIRST_NAME: input.userFirstName.trim() || "کاربر عزیز",
        ACTIVATION_URL: input.activationUrl,
      } satisfies WelcomeTemplateInputs,
    );

    await this.sendEmail({
      to: input.to,
      subject: template.subject,
      html: template.html,
    });
  }

  async sendVerifyEmail(input: SendVerifyEmailInput): Promise<void> {
    const template = await this.renderConfiguredEmailTemplate(
      EMAIL_TEMPLATE_NAME.VERIFY_EMAIL,
      {
        ...this.buildCommonTemplateInputs(),
        USER_FIRST_NAME: input.userFirstName.trim() || "کاربر عزیز",
        VERIFICATION_URL: input.verificationUrl,
      } satisfies VerifyEmailTemplateInputs,
    );

    await this.sendEmail({
      to: input.to,
      subject: template.subject,
      html: template.html,
    });
  }

  private async getTransporter(
    config: NormalizedEmailSmtpConfig,
  ): Promise<nodemailer.Transporter> {
    const signature = this.buildTransportSignature(config);
    if (this.transporter && this.transporterConfigSignature === signature) {
      return this.transporter;
    }

    const transporter = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.secure,
      auth: {
        user: config.username,
        pass: config.password,
      },
    });

    await transporter.verify();
    this.logger.log("SMTP transporter verified successfully");

    this.transporter = transporter;
    this.transporterConfigSignature = signature;
    return transporter;
  }

  private async getActiveSmtpConfigOrThrow(): Promise<NormalizedEmailSmtpConfig> {
    const storedConfig =
      await this.appSettingsService.getActiveJsonSettingValue<StoredEmailSmtpConfig>(
        APP_SETTING_KEY.EMAIL_SMTP_CONFIG,
      );

    if (!storedConfig) {
      throw new Error("Active SMTP app setting is not configured");
    }

    const username = this.normalizeString(storedConfig.username);
    const password = this.normalizeSecret(storedConfig.password);
    const fromEmail =
      this.normalizeString(storedConfig.fromEmail) ||
      this.normalizeString(storedConfig.username);

    if (!username || !password || !fromEmail) {
      throw new Error("Incomplete SMTP app setting configuration");
    }

    return {
      host: this.normalizeString(storedConfig.host) || "smtp.gmail.com",
      port: this.normalizePositiveNumber(storedConfig.port, 587),
      secure: this.normalizeBoolean(storedConfig.secure, false),
      username,
      password,
      fromName: this.normalizeString(storedConfig.fromName) || "Negin Heal",
      fromEmail,
    };
  }

  private normalizeString(value: unknown): string {
    return typeof value === "string" ? value.trim() : "";
  }

  private normalizeSecret(value: unknown): string {
    const secret = this.normalizeString(value);
    return secret.replace(/\s+/g, "");
  }

  private normalizePositiveNumber(value: unknown, fallback: number): number {
    const numericValue = Number(value);
    return Number.isFinite(numericValue) && numericValue > 0
      ? numericValue
      : fallback;
  }

  private normalizeBoolean(value: unknown, fallback: boolean): boolean {
    if (typeof value === "boolean") {
      return value;
    }
    if (typeof value === "string") {
      if (value.toLowerCase() === "true") {
        return true;
      }
      if (value.toLowerCase() === "false") {
        return false;
      }
    }
    return fallback;
  }

  private formatFrom(name: string, email: string): string {
    const escapedName = name.replace(/"/g, '\\"');
    return `"${escapedName}" <${email}>`;
  }

  private buildCommonTemplateInputs(): CommonEmailTemplateInputs {
    return {
      APP_NAME: this.appName,
      APP_URL: this.resolveAppUrl(),
      SECURITY_TEAM_NAME: `${this.appName} Security Team`,
    };
  }

  private resolveAppUrl(): string {
    const configuredUrl = env.APP_URL ?? env.BASE_URL;
    if (!configuredUrl?.trim()) {
      return `http://localhost:${env.PORT}`;
    }

    return configuredUrl.replace(/\/+$/, "");
  }

  private buildTransportSignature(config: NormalizedEmailSmtpConfig): string {
    return JSON.stringify({
      host: config.host,
      port: config.port,
      secure: config.secure,
      username: config.username,
      password: config.password,
    });
  }

  private async renderConfiguredEmailTemplate<
    TInputs extends EmailTemplateInputs,
  >(templateName: string, inputs: TInputs): Promise<RenderedEmailTemplate> {
    const storedTemplates =
      await this.appSettingsService.getActiveJsonSettingValue<
        StoredEmailTemplateConfig[]
      >(APP_SETTING_KEY.EMAIL_TEMPLATES);

    if (!Array.isArray(storedTemplates) || storedTemplates.length === 0) {
      throw new Error("Active email templates app setting is not configured");
    }

    const storedTemplate = storedTemplates.find(
      (template) => this.normalizeString(template.name) === templateName,
    );

    if (!storedTemplate) {
      const builtInTemplate = this.resolveBuiltInEmailTemplate(templateName);
      if (builtInTemplate) {
        this.logger.warn(
          `Email template ${templateName} is not configured; falling back to the built-in template`,
        );
        return this.renderBuiltInEmailTemplate(builtInTemplate, inputs);
      }

      throw new Error(`Email template ${templateName} is not configured`);
    }

    const subjectTemplate = this.normalizeString(storedTemplate.subject);
    let htmlTemplate = this.normalizeString(storedTemplate.html);

    if (
      templateName === EMAIL_TEMPLATE_NAME.PASSWORD_RESET &&
      isLegacyPasswordResetEmailTemplate(htmlTemplate)
    ) {
      this.logger.warn(
        "Stored PASSWORD_RESET email template uses a legacy layout; falling back to the built-in template",
      );
      return this.renderBuiltInEmailTemplate(
        {
          subject: PASSWORD_RESET_EMAIL_SUBJECT,
          html: PASSWORD_RESET_EMAIL_HTML,
        },
        inputs,
      );
    }

    if (
      templateName === EMAIL_TEMPLATE_NAME.WELCOME &&
      isLegacyWelcomeEmailTemplate(htmlTemplate)
    ) {
      this.logger.warn(
        "Stored WELCOME email template uses a legacy layout; falling back to the built-in template",
      );
      return this.renderBuiltInEmailTemplate(
        {
          subject: WELCOME_EMAIL_SUBJECT,
          html: WELCOME_EMAIL_HTML,
        },
        inputs,
      );
    }

    if (
      templateName === EMAIL_TEMPLATE_NAME.VERIFY_EMAIL &&
      isLegacyVerifyEmailTemplate(htmlTemplate)
    ) {
      this.logger.warn(
        "Stored VERIFY_EMAIL email template uses a legacy layout; falling back to the built-in template",
      );
      return this.renderBuiltInEmailTemplate(
        {
          subject: VERIFY_EMAIL_SUBJECT,
          html: VERIFY_EMAIL_HTML,
        },
        inputs,
      );
    }

    if (!subjectTemplate || !htmlTemplate) {
      throw new Error(`Email template ${templateName} is incomplete`);
    }

    const combinedTemplate = `${subjectTemplate}\n${htmlTemplate}`;
    const requiredPlaceholders =
      EmailTemplate.extractPlaceholders(combinedTemplate);
    const providedInputKeys = new Set(
      Object.keys(inputs).map((key) => key.toUpperCase()),
    );
    const missingPlaceholders = requiredPlaceholders.filter(
      (placeholder) => !providedInputKeys.has(placeholder),
    );

    if (missingPlaceholders.length > 0) {
      throw new Error(
        `Email template ${templateName} is missing inputs for placeholders: ${missingPlaceholders.join(", ")}`,
      );
    }

    return {
      subject: new EmailTemplate(subjectTemplate, inputs, {
        escapeHtml: false,
      }).render(),
      html: new EmailTemplate(htmlTemplate, inputs).render(),
    };
  }

  private resolveBuiltInEmailTemplate(
    templateName: string,
  ): { subject: string; html: string } | null {
    if (templateName === EMAIL_TEMPLATE_NAME.WELCOME) {
      return {
        subject: WELCOME_EMAIL_SUBJECT,
        html: WELCOME_EMAIL_HTML,
      };
    }

    if (templateName === EMAIL_TEMPLATE_NAME.VERIFY_EMAIL) {
      return {
        subject: VERIFY_EMAIL_SUBJECT,
        html: VERIFY_EMAIL_HTML,
      };
    }

    return null;
  }

  private renderBuiltInEmailTemplate<
    TInputs extends EmailTemplateInputs,
  >(
    template: { subject: string; html: string },
    inputs: TInputs,
  ): RenderedEmailTemplate {
    return {
      subject: new EmailTemplate(template.subject, inputs, {
        escapeHtml: false,
      }).render(),
      html: new EmailTemplate(template.html, inputs).render(),
    };
  }
}
