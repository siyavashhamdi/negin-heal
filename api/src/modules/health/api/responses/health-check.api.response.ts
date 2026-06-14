import { ApiProperty } from "@nestjs/swagger";

/**
 * Health Check Response for REST API
 * Used for GET /health endpoint
 */
export class HealthCheckApiResponse {
  @ApiProperty({
    description: "Health status of the system",
    example: "ok",
    type: String,
  })
  status: string;

  @ApiProperty({
    description: "Current timestamp in ISO format",
    example: "2024-01-01T00:00:00.000Z",
    type: String,
  })
  timestamp: string;

  @ApiProperty({
    description: "System uptime in seconds",
    example: 3600,
    type: Number,
  })
  uptime: number;

  @ApiProperty({
    description: "Memory usage information",
    type: Object,
    properties: {
      rss: { type: "number", description: "Resident Set Size" },
      heapTotal: { type: "number", description: "Total heap memory" },
      heapUsed: { type: "number", description: "Used heap memory" },
      external: { type: "number", description: "External memory" },
      arrayBuffers: { type: "number", description: "Array buffers" },
    },
  })
  memory: {
    rss: number;
    heapTotal: number;
    heapUsed: number;
    external: number;
    arrayBuffers: number;
  };

  @ApiProperty({
    description: "Application version",
    example: "1.0.0",
    type: String,
  })
  version: string;
}
