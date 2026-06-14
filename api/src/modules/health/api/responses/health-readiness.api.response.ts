import { ApiProperty } from "@nestjs/swagger";

/**
 * Health Readiness Response for REST API
 * Used for GET /health/ready endpoint
 */
export class HealthReadinessApiResponse {
  @ApiProperty({
    description: "Readiness status of the service",
    example: "ready",
    type: String,
  })
  status: string;

  @ApiProperty({
    description: "Current timestamp in ISO format",
    example: "2024-01-01T00:00:00.000Z",
    type: String,
  })
  timestamp: string;
}
