import { Schema as MongooseSchema } from "mongoose";

export type SessionClientContext = {
  capturedAt?: Date;
  ipAddress?: string;
  userAgent?: string;
  acceptLanguage?: string;
  clientType?: string;
  deviceName?: string;
  deviceModel?: string;
  deviceCategory?: string;
  osName?: string;
  osVersion?: string;
  browserName?: string;
  browserVersion?: string;
  engineName?: string;
  architecture?: string;
  bitness?: string;
  platform?: string;
  screenResolution?: string;
  viewportSize?: string;
  devicePixelRatio?: number;
  language?: string;
  languages?: string;
  timezone?: string;
  timezoneOffset?: string;
  colorScheme?: string;
  touchInput?: boolean;
  maxTouchPoints?: number;
  connectionType?: string;
  downlinkMbps?: number;
  rttMs?: number;
  saveData?: boolean;
  cpuCores?: number;
  deviceMemoryGb?: number;
  cookiesEnabled?: boolean;
  pdfViewerEnabled?: boolean;
  appVersion?: string;
  pageUrl?: string;
  referrer?: string;
};

export const SessionClientContextSchema =
  new MongooseSchema<SessionClientContext>(
    {
      capturedAt: { type: Date },
      ipAddress: { type: String },
      userAgent: { type: String },
      acceptLanguage: { type: String },
      clientType: { type: String },
      deviceName: { type: String },
      deviceModel: { type: String },
      deviceCategory: { type: String },
      osName: { type: String },
      osVersion: { type: String },
      browserName: { type: String },
      browserVersion: { type: String },
      engineName: { type: String },
      architecture: { type: String },
      bitness: { type: String },
      platform: { type: String },
      screenResolution: { type: String },
      viewportSize: { type: String },
      devicePixelRatio: { type: Number },
      language: { type: String },
      languages: { type: String },
      timezone: { type: String },
      timezoneOffset: { type: String },
      colorScheme: { type: String },
      touchInput: { type: Boolean },
      maxTouchPoints: { type: Number },
      connectionType: { type: String },
      downlinkMbps: { type: Number },
      rttMs: { type: Number },
      saveData: { type: Boolean },
      cpuCores: { type: Number },
      deviceMemoryGb: { type: Number },
      cookiesEnabled: { type: Boolean },
      pdfViewerEnabled: { type: Boolean },
      appVersion: { type: String },
      pageUrl: { type: String },
      referrer: { type: String },
    },
    { _id: false },
  );
