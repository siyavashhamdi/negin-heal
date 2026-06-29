import axios from "axios";
import formDataImport = require("form-data");
import { createReadStream } from "fs";
import { basename } from "path";

import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from "@nestjs/common";

import { EXCEPTION_CONSTANT } from "../../constants/exception.constant";
import { AppSettingsService } from "../app-settings/app-settings.service";
import { TelegramConfig } from "../app-settings/app-settings.types";
import {
  TelegramApiResponse,
  TelegramCallApiOptions,
  TelegramFilePayload,
  TelegramSendChatActionInput,
  TelegramSendContactInput,
  TelegramSendLocationInput,
  TelegramSendMediaInput,
  TelegramSendMessageInput,
  TelegramSendMessageResult,
} from "./telegram.types";

type TelegramMultipartForm = InstanceType<typeof formDataImport>;

type TelegramRequestParams = Record<string, unknown>;

@Injectable()
export class TelegramService {
  private readonly logger = new Logger(TelegramService.name);

  constructor(private readonly appSettingsService: AppSettingsService) {}

  async isConfigured(): Promise<boolean> {
    const config = await this.appSettingsService.getTelegramConfig();
    return config != null;
  }

  async sendMessage(
    input: TelegramSendMessageInput,
  ): Promise<TelegramSendMessageResult> {
    return this.mapMessageResult(
      await this.callApi("sendMessage", {
        chat_id: await this.resolveChatId(input.chatId),
        text: input.text,
        ...(input.messageThreadId !== undefined
          ? { message_thread_id: input.messageThreadId }
          : {}),
        ...(input.parseMode ? { parse_mode: input.parseMode } : {}),
        ...(input.disableNotification !== undefined
          ? { disable_notification: input.disableNotification }
          : {}),
        ...(input.disableWebPagePreview !== undefined
          ? { disable_web_page_preview: input.disableWebPagePreview }
          : {}),
        ...(input.replyToMessageId !== undefined
          ? { reply_to_message_id: input.replyToMessageId }
          : {}),
      }),
    );
  }

  async sendPhoto(
    input: TelegramSendMediaInput,
  ): Promise<TelegramSendMessageResult> {
    return this.sendMedia("sendPhoto", "photo", input);
  }

  async sendDocument(
    input: TelegramSendMediaInput,
  ): Promise<TelegramSendMessageResult> {
    return this.sendMedia("sendDocument", "document", input);
  }

  async sendVideo(
    input: TelegramSendMediaInput,
  ): Promise<TelegramSendMessageResult> {
    return this.sendMedia("sendVideo", "video", input);
  }

  async sendAudio(
    input: TelegramSendMediaInput,
  ): Promise<TelegramSendMessageResult> {
    return this.sendMedia("sendAudio", "audio", input);
  }

  async sendVoice(
    input: TelegramSendMediaInput,
  ): Promise<TelegramSendMessageResult> {
    return this.sendMedia("sendVoice", "voice", input);
  }

  async sendAnimation(
    input: TelegramSendMediaInput,
  ): Promise<TelegramSendMessageResult> {
    return this.sendMedia("sendAnimation", "animation", input);
  }

  async sendLocation(
    input: TelegramSendLocationInput,
  ): Promise<TelegramSendMessageResult> {
    return this.mapMessageResult(
      await this.callApi("sendLocation", {
        chat_id: await this.resolveChatId(input.chatId),
        latitude: input.latitude,
        longitude: input.longitude,
        ...(input.messageThreadId !== undefined
          ? { message_thread_id: input.messageThreadId }
          : {}),
        ...(input.disableNotification !== undefined
          ? { disable_notification: input.disableNotification }
          : {}),
        ...(input.replyToMessageId !== undefined
          ? { reply_to_message_id: input.replyToMessageId }
          : {}),
      }),
    );
  }

  async sendContact(
    input: TelegramSendContactInput,
  ): Promise<TelegramSendMessageResult> {
    return this.mapMessageResult(
      await this.callApi("sendContact", {
        chat_id: await this.resolveChatId(input.chatId),
        phone_number: input.phoneNumber,
        first_name: input.firstName,
        ...(input.lastName ? { last_name: input.lastName } : {}),
        ...(input.messageThreadId !== undefined
          ? { message_thread_id: input.messageThreadId }
          : {}),
        ...(input.disableNotification !== undefined
          ? { disable_notification: input.disableNotification }
          : {}),
        ...(input.replyToMessageId !== undefined
          ? { reply_to_message_id: input.replyToMessageId }
          : {}),
      }),
    );
  }

  async sendChatAction(input: TelegramSendChatActionInput): Promise<boolean> {
    return this.callApi("sendChatAction", {
      chat_id: await this.resolveChatId(input.chatId),
      action: input.action,
      ...(input.messageThreadId !== undefined
        ? { message_thread_id: input.messageThreadId }
        : {}),
    });
  }

  async callApi<TResult = unknown>(
    method: string,
    params: TelegramRequestParams = {},
    options: TelegramCallApiOptions = {},
  ): Promise<TResult> {
    const normalizedMethod = method.trim();
    if (!normalizedMethod) {
      throw new InternalServerErrorException(
        EXCEPTION_CONSTANT.TELEGRAM_METHOD_REQUIRED,
      );
    }

    const requestParams = { ...params };
    if (options.chatId !== undefined && requestParams.chat_id === undefined) {
      requestParams.chat_id = await this.resolveChatId(options.chatId);
    }
    if (
      options.messageThreadId !== undefined &&
      requestParams.message_thread_id === undefined
    ) {
      requestParams.message_thread_id = options.messageThreadId;
    }

    const shouldUseMultipart =
      options.multipart === true || this.containsFilePayload(requestParams);

    try {
      const response = shouldUseMultipart
        ? await this.postMultipart<TResult>(normalizedMethod, requestParams)
        : await this.postJson<TResult>(normalizedMethod, requestParams);

      return this.unwrapApiResponse(response);
    } catch (error) {
      this.logger.error(
        `Telegram API call failed: method=${normalizedMethod}`,
        error instanceof Error ? error.stack : String(error),
      );

      throw new InternalServerErrorException(
        EXCEPTION_CONSTANT.TELEGRAM_SEND_FAILED,
      );
    }
  }

  private async sendMedia(
    method: string,
    mediaField: string,
    input: TelegramSendMediaInput,
  ): Promise<TelegramSendMessageResult> {
    const params: TelegramRequestParams = {
      chat_id: await this.resolveChatId(input.chatId),
      [mediaField]: input.media,
      ...(input.caption ? { caption: input.caption } : {}),
      ...(input.parseMode ? { parse_mode: input.parseMode } : {}),
      ...(input.messageThreadId !== undefined
        ? { message_thread_id: input.messageThreadId }
        : {}),
      ...(input.disableNotification !== undefined
        ? { disable_notification: input.disableNotification }
        : {}),
      ...(input.replyToMessageId !== undefined
        ? { reply_to_message_id: input.replyToMessageId }
        : {}),
    };

    return this.mapMessageResult(
      await this.callApi(
        method,
        params,
        typeof input.media === "string" ? {} : { multipart: true },
      ),
    );
  }

  private async postJson<TResult>(
    method: string,
    params: TelegramRequestParams,
  ): Promise<TelegramApiResponse<TResult>> {
    const { data } = await axios.post<TelegramApiResponse<TResult>>(
      await this.buildApiUrl(method),
      params,
      {
        timeout: 30_000,
      },
    );

    return data;
  }

  private async postMultipart<TResult>(
    method: string,
    params: TelegramRequestParams,
  ): Promise<TelegramApiResponse<TResult>> {
    const form = this.buildMultipartForm(params);

    const { data } = await axios.post<TelegramApiResponse<TResult>>(
      await this.buildApiUrl(method),
      form,
      {
        headers: form.getHeaders(),
        timeout: 0,
        ...({
          maxBodyLength: Infinity,
          maxContentLength: Infinity,
        } as Record<string, unknown>),
      },
    );

    return data;
  }

  private buildMultipartForm(
    params: TelegramRequestParams,
  ): TelegramMultipartForm {
    const form = new formDataImport();

    for (const [key, value] of Object.entries(params)) {
      if (value === undefined || value === null) {
        continue;
      }

      if (this.isFilePayload(value)) {
        this.appendFilePayload(form, key, value);
        continue;
      }

      if (typeof value === "string" || typeof value === "number") {
        form.append(key, String(value));
        continue;
      }

      if (typeof value === "boolean") {
        form.append(key, value ? "true" : "false");
        continue;
      }

      form.append(key, JSON.stringify(value));
    }

    return form;
  }

  private appendFilePayload(
    form: TelegramMultipartForm,
    fieldName: string,
    payload: TelegramFilePayload,
  ): void {
    const fileName = payload.fileName?.trim() || "file";
    const contentType = payload.contentType?.trim();

    if (payload.filePath) {
      form.append(fieldName, createReadStream(payload.filePath), {
        filename: basename(payload.filePath) || fileName,
        ...(contentType ? { contentType } : {}),
      });
      return;
    }

    if (payload.buffer) {
      form.append(fieldName, payload.buffer, {
        filename: fileName,
        ...(contentType ? { contentType } : {}),
      });
      return;
    }

    if (payload.stream) {
      form.append(fieldName, payload.stream, {
        filename: fileName,
        ...(contentType ? { contentType } : {}),
      });
      return;
    }

    throw new InternalServerErrorException(
      EXCEPTION_CONSTANT.TELEGRAM_FILE_PAYLOAD_INVALID,
    );
  }

  private containsFilePayload(params: TelegramRequestParams): boolean {
    return Object.values(params).some((value) => this.isFilePayload(value));
  }

  private isFilePayload(value: unknown): value is TelegramFilePayload {
    if (typeof value !== "object" || value === null) {
      return false;
    }

    const payload = value as TelegramFilePayload;
    return Boolean(payload.filePath || payload.buffer || payload.stream);
  }

  private unwrapApiResponse<TResult>(
    response: TelegramApiResponse<TResult>,
  ): TResult {
    if (!response.ok) {
      const description =
        response.description ||
        (response as { error_code?: number }).error_code?.toString() ||
        "Unknown Telegram API error";

      throw new Error(description);
    }

    if (response.result === undefined) {
      throw new Error("Telegram API returned an empty result");
    }

    return response.result;
  }

  private mapMessageResult(result: unknown): TelegramSendMessageResult {
    const message = result as {
      message_id: number;
      chat: { id: number };
      date: number;
    };

    return {
      messageId: message.message_id,
      chatId: message.chat.id,
      date: message.date,
    };
  }

  private async buildApiUrl(method: string): Promise<string> {
    const config = await this.getActiveTelegramConfigOrThrow();
    return `${config.apiBaseUrl}/bot${config.botToken}/${method}`;
  }

  private async getActiveTelegramConfigOrThrow(): Promise<TelegramConfig> {
    const config = await this.appSettingsService.getTelegramConfig();
    if (!config) {
      throw new InternalServerErrorException(
        EXCEPTION_CONSTANT.TELEGRAM_NOT_CONFIGURED,
      );
    }

    return config;
  }

  private async resolveChatId(chatId?: string | number): Promise<string> {
    if (chatId !== undefined) {
      const normalizedOverride = chatId.toString().trim();
      if (normalizedOverride) {
        return normalizedOverride;
      }
    }

    const config = await this.getActiveTelegramConfigOrThrow();
    return config.chatId;
  }
}
