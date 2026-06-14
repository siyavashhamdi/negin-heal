import { Module } from "@nestjs/common";

import { HealthService } from "./health.service";
import { HealthController } from "./api/health.controller";

@Module({
  controllers: [HealthController],
  providers: [HealthService],
})
export class HealthModule {}
