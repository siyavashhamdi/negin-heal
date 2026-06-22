import { Injectable } from "@nestjs/common";

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
      version: process.env.npm_package_version || "N/A",
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
