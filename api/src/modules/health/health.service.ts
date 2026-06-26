import { Injectable } from "@nestjs/common";

import {
  ANDROID_APP_VERSION,
  API_VERSION,
  WEB_VERSION,
} from "../../constants/app-version.constants";
import {
  HealthCheckApiResponse,
  HealthReadinessApiResponse,
  HealthLivenessApiResponse,
} from "./api/responses";

@Injectable()
export class HealthService {
  async check(): Promise<HealthCheckApiResponse> {
    return {
      status: "ok",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      version: API_VERSION,
      versions: {
        web: WEB_VERSION,
        api: API_VERSION,
        android: ANDROID_APP_VERSION,
      },
    };
  }

  async readiness(): Promise<HealthReadinessApiResponse> {
    // Add database connectivity checks here
    return {
      status: "ready",
      timestamp: new Date().toISOString(),
    };
  }

  async liveness(): Promise<HealthLivenessApiResponse> {
    return {
      status: "alive",
      timestamp: new Date().toISOString(),
    };
  }
}
