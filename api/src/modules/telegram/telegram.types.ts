import { Readable } from "stream";

export type TelegramParseMode = "HTML" | "Markdown" | "MarkdownV2";

export type TelegramChatTarget = {
  chatId?: string | number;
  messageThreadId?: number;
};

export type TelegramFilePayload = {
  filePath?: string;
  buffer?: Buffer;
  stream?: Readable;
  fileName?: string;
  contentType?: string;
};

export type TelegramSendMessageInput = TelegramChatTarget & {
  text: string;
  parseMode?: TelegramParseMode;
  disableNotification?: boolean;
  disableWebPagePreview?: boolean;
  replyToMessageId?: number;
};

export type TelegramSendMediaInput = TelegramChatTarget & {
  media: TelegramFilePayload | string;
  caption?: string;
  parseMode?: TelegramParseMode;
  disableNotification?: boolean;
  replyToMessageId?: number;
};

export type TelegramSendLocationInput = TelegramChatTarget & {
  latitude: number;
  longitude: number;
  disableNotification?: boolean;
  replyToMessageId?: number;
};

export type TelegramSendContactInput = TelegramChatTarget & {
  phoneNumber: string;
  firstName: string;
  lastName?: string;
  disableNotification?: boolean;
  replyToMessageId?: number;
};

export type TelegramSendChatActionInput = TelegramChatTarget & {
  action:
    | "typing"
    | "upload_photo"
    | "record_video"
    | "upload_video"
    | "record_voice"
    | "upload_voice"
    | "upload_document"
    | "choose_sticker"
    | "find_location";
};

export type TelegramCallApiOptions = TelegramChatTarget & {
  multipart?: boolean;
};

export type TelegramMessage = {
  message_id: number;
  chat: {
    id: number;
    type: string;
  };
  date: number;
  text?: string;
};

export type TelegramApiResponse<TResult = unknown> = {
  ok: boolean;
  result?: TResult;
  description?: string;
  error_code?: number;
};

export type TelegramSendMessageResult = {
  messageId: number;
  chatId: number;
  date: number;
};
