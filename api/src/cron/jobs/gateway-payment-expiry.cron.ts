import { Injectable, Logger } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";

import { GatewayPaymentExpiryService } from "../../modules/product/gateway-payment-expiry.service";

@Injectable()
export class GatewayPaymentExpiryCron {
  private readonly logger = new Logger(GatewayPaymentExpiryCron.name);
  private isRunning = false;

  constructor(
    private readonly gatewayPaymentExpiryService: GatewayPaymentExpiryService,
  ) {}

  @Cron(CronExpression.EVERY_10_MINUTES, {
    name: "gateway-payment-expiry",
    timeZone: "UTC",
  })
  async handleGatewayPaymentExpiry(): Promise<void> {
    if (this.isRunning) {
      this.logger.warn(
        "Gateway payment expiry cron is still running, skipping this tick",
      );
      return;
    }

    this.isRunning = true;

    try {
      await this.gatewayPaymentExpiryService.expireStaleGatewayPayments();
    } catch (error) {
      this.logger.error(
        "Gateway payment expiry cron failed",
        error instanceof Error ? error.stack : String(error),
      );
    } finally {
      this.isRunning = false;
    }
  }
}
