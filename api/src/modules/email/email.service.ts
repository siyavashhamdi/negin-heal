import * as nodemailer from "nodemailer";

import { Injectable, Logger } from "@nestjs/common";

import { APP_SETTING_KEY } from "../../constants";
import { AppSettingsService } from "../app-settings";
import { EmailTemplate, EmailTemplateInputs } from "./email-template";

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

type SendLoginCodeEmailInput = {
  to: string;
  code: string;
  expiresInMinutes?: number;
};

type SendPasswordResetEmailInput = {
  to: string;
  resetLink: string;
  expiresInMinutes?: number;
};

type SendSampleEmailInput = {
  to: string;
  requestedBy: string;
  sentAtIso: string;
};

type LoginCodeTemplateInputs = {
  APP_NAME: string;
  LOGIN_CODE: string;
  EXPIRES_IN_MINUTES: number;
  SECURITY_TEAM_NAME: string;
};

type PasswordResetTemplateInputs = {
  APP_NAME: string;
  RESET_LINK: string;
  EXPIRES_IN_MINUTES: number;
  SECURITY_TEAM_NAME: string;
};

type SampleTemplateInputs = {
  APP_NAME: string;
  REQUESTED_BY: string;
  SENT_AT: string;
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
  LOGIN_CODE: "LOGIN_CODE",
  PASSWORD_RESET: "PASSWORD_RESET",
  SAMPLE: "SAMPLE",
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

  async sendLoginCodeEmail(input: SendLoginCodeEmailInput): Promise<void> {
    const expiresInMinutes = input.expiresInMinutes ?? 5;

    const template = await this.renderConfiguredEmailTemplate(
      EMAIL_TEMPLATE_NAME.LOGIN_CODE,
      {
        APP_NAME: this.appName,
        LOGIN_CODE: input.code,
        EXPIRES_IN_MINUTES: expiresInMinutes,
        SECURITY_TEAM_NAME: `${this.appName} Security Team`,
      } satisfies LoginCodeTemplateInputs,
    );

    await this.sendEmail({
      to: input.to,
      subject: template.subject,
      html: template.html,
    });
  }

  async sendPasswordResetEmail(
    input: SendPasswordResetEmailInput,
  ): Promise<void> {
    const expiresInMinutes = input.expiresInMinutes ?? 30;

    const template = await this.renderConfiguredEmailTemplate(
      EMAIL_TEMPLATE_NAME.PASSWORD_RESET,
      {
        APP_NAME: this.appName,
        RESET_LINK: input.resetLink,
        EXPIRES_IN_MINUTES: expiresInMinutes,
        SECURITY_TEAM_NAME: `${this.appName} Security Team`,
      } satisfies PasswordResetTemplateInputs,
    );

    await this.sendEmail({
      to: input.to,
      subject: template.subject,
      html: template.html,
    });
  }

  async sendSampleEmail(input: SendSampleEmailInput): Promise<void> {
    const template = await this.renderConfiguredEmailTemplate(
      EMAIL_TEMPLATE_NAME.SAMPLE,
      {
        APP_NAME: this.appName,
        REQUESTED_BY: input.requestedBy,
        SENT_AT: input.sentAtIso,
      } satisfies SampleTemplateInputs,
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
      throw new Error(`Email template ${templateName} is not configured`);
    }

    const subjectTemplate = this.normalizeString(storedTemplate.subject);
    const htmlTemplate = this.normalizeString(storedTemplate.html);

    if (!subjectTemplate || !htmlTemplate) {
      throw new Error(`Email template ${templateName} is incomplete`);
    }

    return {
      subject: new EmailTemplate(subjectTemplate, inputs, {
        escapeHtml: false,
      }).render(),
      html: new EmailTemplate(htmlTemplate, inputs).render(),
    };
  }
}
