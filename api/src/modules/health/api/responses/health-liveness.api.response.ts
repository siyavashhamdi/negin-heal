import { ApiProperty } from "@nestjs/swagger";

/**
 * Health Liveness Response for REST API
 * Used for GET /health/live endpoint
 */
export class HealthLivenessApiResponse {
  @ApiProperty({
    description: "Liveness status of the service",
    example: "alive",
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
