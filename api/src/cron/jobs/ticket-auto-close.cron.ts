import { Injectable, Logger } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";

import { TicketAutoCloseService } from "../../modules/ticket/ticket-auto-close.service";

@Injectable()
export class TicketAutoCloseCron {
  private readonly logger = new Logger(TicketAutoCloseCron.name);
  private isRunning = false;

  constructor(
    private readonly ticketAutoCloseService: TicketAutoCloseService,
  ) {}

  @Cron(CronExpression.EVERY_HOUR, {
    name: "ticket-auto-close",
    timeZone: "UTC",
  })
  async handleTicketAutoClose(): Promise<void> {
    if (this.isRunning) {
      this.logger.warn(
        "Ticket auto-close cron is still running, skipping this tick",
      );
      return;
    }

    this.isRunning = true;

    try {
      await this.ticketAutoCloseService.closeAnsweredTickets();
    } catch (error) {
      this.logger.error(
        "Ticket auto-close cron failed",
        error instanceof Error ? error.stack : String(error),
      );
    } finally {
      this.isRunning = false;
    }
  }
}
