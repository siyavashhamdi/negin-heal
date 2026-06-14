import { Controller, Get } from "@nestjs/common";
import { ApiOkResponse, ApiOperation, ApiTags } from "@nestjs/swagger";

import { HealthService } from "../health.service";
import {
  HealthCheckApiResponse,
  HealthReadinessApiResponse,
  HealthLivenessApiResponse,
} from "./responses";

@ApiTags("Health")
@Controller("health")
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  @ApiOperation({
    summary: "System Health Check",
    description:
      "Comprehensive health check including database connectivity, memory usage, and system status",
  })
  @ApiOkResponse({
    description: "System health status retrieved successfully",
    type: HealthCheckApiResponse,
  })
  async check(): Promise<HealthCheckApiResponse> {
    return this.healthService.check();
  }

  @Get("ready")
  @ApiOperation({
    summary: "Readiness Probe",
    description:
      "Kubernetes readiness probe endpoint. Returns 200 if the service is ready to accept traffic",
  })
  @ApiOkResponse({
    description: "Service is ready to accept traffic",
    type: HealthReadinessApiResponse,
  })
  async readiness(): Promise<HealthReadinessApiResponse> {
    return this.healthService.readiness();
  }

  @Get("live")
  @ApiOperation({
    summary: "Liveness Probe",
    description:
      "Kubernetes liveness probe endpoint. Returns 200 if the service is alive and should not be restarted",
  })
  @ApiOkResponse({
    description: "Service is alive and running",
    type: HealthLivenessApiResponse,
  })
  async liveness(): Promise<HealthLivenessApiResponse> {
    return this.healthService.liveness();
  }
}
