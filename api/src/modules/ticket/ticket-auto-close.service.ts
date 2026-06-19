import { Injectable, Logger } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";

import {
  BadgeCountTriggerAction,
  BadgeCountTriggerSource,
  TicketClosedBy,
  TicketStatus,
} from "../../enums";
import { Ticket, TicketDocument } from "../../database/schemas";
import { BadgeService } from "../badge";

export type TicketAutoCloseRunResult = {
  closedCount: number;
};

@Injectable()
export class TicketAutoCloseService {
  private readonly logger = new Logger(TicketAutoCloseService.name);

  constructor(
    @InjectModel(Ticket.name)
    private readonly ticketModel: Model<TicketDocument>,
    private readonly badgeService: BadgeService,
  ) {}

  async closeAnsweredTickets(): Promise<TicketAutoCloseRunResult> {
    const answeredTickets = await this.ticketModel
      .find({ status: TicketStatus.ANSWERED })
      .exec();

    if (!answeredTickets.length) {
      this.logger.log("Ticket auto-close: no answered tickets to close");
      return { closedCount: 0 };
    }

    const closedAt = new Date();
    let closedCount = 0;
    const affectedEndUserIds = new Set<string>();
    let lastClosedTicketId: string | undefined;

    for (const ticket of answeredTickets) {
      ticket.status = TicketStatus.CLOSED;
      ticket.closedBy = TicketClosedBy.SYSTEM;
      ticket.closedByUserId = undefined;
      ticket.closedAt = closedAt;

      const savedTicket = await ticket.save();
      if (savedTicket.audit?.createdBy) {
        affectedEndUserIds.add(savedTicket.audit.createdBy.toString());
      }
      lastClosedTicketId = savedTicket._id.toString();
      closedCount++;
    }

    if (affectedEndUserIds.size > 0) {
      await this.badgeService.publishCountSignal({
        targetUserIds: [...affectedEndUserIds].map(
          (userId) => new Types.ObjectId(userId),
        ),
        payload: {
          source: BadgeCountTriggerSource.TICKET,
          action: BadgeCountTriggerAction.UPDATED,
          ...(lastClosedTicketId ? { ticketId: lastClosedTicketId } : {}),
        },
      });

      const endUserIdsWithOpenTickets = await this.ticketModel
        .distinct("audit.createdBy", {
          "audit.createdBy": {
            $in: [...affectedEndUserIds].map(
              (userId) => new Types.ObjectId(userId),
            ),
          },
          status: TicketStatus.OPEN,
        })
        .exec();
      const endUserIdsWithOpenTicketSet = new Set(
        endUserIdsWithOpenTickets.map((userId) => userId.toString()),
      );
      const hasEndUserWithNoOpenTickets = [...affectedEndUserIds].some(
        (userId) => !endUserIdsWithOpenTicketSet.has(userId),
      );

      if (hasEndUserWithNoOpenTickets) {
        await this.badgeService.publishCountSignal({
          includeStaffUsers: true,
          payload: {
            source: BadgeCountTriggerSource.TICKET,
            action: BadgeCountTriggerAction.UPDATED,
            ...(lastClosedTicketId ? { ticketId: lastClosedTicketId } : {}),
          },
        });
      }
    }

    this.logger.log(
      `Ticket auto-close: closed ${closedCount} answered ticket(s)`,
    );

    return { closedCount };
  }
}
