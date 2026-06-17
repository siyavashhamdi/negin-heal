import { FilterQuery, Model, Types } from "mongoose";
import { InjectModel } from "@nestjs/mongoose";
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";

import { PAGINATION_CONSTANT } from "../../constants";
import { SortingOrder } from "../../common/pagination/input";
import { buildSortOptions } from "../../common/pagination/utils";
import {
  BadgeCountTriggerAction,
  BadgeCountTriggerSource,
  TicketClosedBy,
  TicketStatus,
  UserRole,
} from "../../enums";
import {
  StoredFile,
  Ticket,
  TicketDocument,
  TicketMessage,
  User,
  UserDocument,
} from "../../database/schemas";
import { BadgeService } from "../badge";
import { FileService, FileAccessUrlDescriptor } from "../file";
import {
  TicketListGqlInput,
  TicketListSortOptionInput,
  SuperAdminTicketSendGqlInput,
  UserTicketListGqlInput,
  UserTicketSendGqlInput,
} from "./graphql/inputs";
import {
  TicketListGqlResponse,
  TicketListPaginatedOffsetGqlResponse,
  TicketStoredFileMinimalGqlResponse,
  TicketUserMinimalGqlResponse,
  UserTicketListGqlResponse,
  UserTicketListPaginatedOffsetGqlResponse,
} from "./graphql/responses";

type TicketListSortField = Extract<keyof TicketListSortOptionInput, string>;
type TicketListRequest = Pick<TicketListGqlInput, "filters" | "options">;
type TicketListRecord = Ticket & {
  _id: Types.ObjectId;
};
type TicketUserLookupRecord = Pick<User, "profile" | "username"> & {
  _id: Types.ObjectId;
};
type TicketFileLookupRecord = Pick<
  StoredFile,
  "mimeType" | "name" | "path" | "sizeBytes"
> & {
  accessUrl?: FileAccessUrlDescriptor;
};
type TicketRelatedLookups = {
  usersById: Map<string, TicketUserLookupRecord>;
  filesById: Map<string, TicketFileLookupRecord>;
  avatarAccessUrlMap: Map<string, FileAccessUrlDescriptor>;
};

@Injectable()
export class TicketService {
  constructor(
    @InjectModel(Ticket.name)
    private readonly ticketModel: Model<TicketDocument>,
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
    private readonly fileService: FileService,
    private readonly badgeService: BadgeService,
  ) {}

  async list(
    input: TicketListGqlInput,
  ): Promise<TicketListPaginatedOffsetGqlResponse> {
    const { tickets, total, limit, skip, relatedLookups } =
      await this.findTicketListRecords(input);

    return {
      items: tickets.map((ticket) =>
        this.toTicketListResponse(ticket, relatedLookups),
      ),
      pagination: {
        limit,
        skip,
        total,
        count: tickets.length,
      },
    };
  }

  async listForUser(
    input: UserTicketListGqlInput,
    userId: Types.ObjectId,
  ): Promise<UserTicketListPaginatedOffsetGqlResponse> {
    const userScopedFilterQuery: FilterQuery<Ticket> = {
      "audit.createdBy": userId,
    };
    const { tickets, total, limit, skip, relatedLookups } =
      await this.findTicketListRecords(input, userScopedFilterQuery);

    return {
      items: tickets.map((ticket) =>
        this.toUserTicketListResponse(ticket, relatedLookups),
      ),
      pagination: {
        limit,
        skip,
        total,
        count: tickets.length,
      },
    };
  }

  async sendByEndUser(
    input: UserTicketSendGqlInput,
    userId: Types.ObjectId,
  ): Promise<UserTicketListGqlResponse> {
    const ticket = await this.sendTicket({
      input,
      actorUserId: userId,
      actorRole: UserRole.END_USER,
    });
    const relatedLookups = await this.buildTicketRelatedLookups([ticket]);

    return this.toUserTicketListResponse(ticket, relatedLookups);
  }

  async sendBySuperAdmin(
    input: SuperAdminTicketSendGqlInput,
    adminUserId: Types.ObjectId,
    roles: UserRole[] = [UserRole.SUPER_ADMIN],
  ): Promise<TicketListGqlResponse> {
    const ticket = await this.sendTicket({
      input,
      actorUserId: adminUserId,
      actorRole: roles.includes(UserRole.SUPER_ADMIN)
        ? UserRole.SUPER_ADMIN
        : UserRole.ADMIN,
    });
    const relatedLookups = await this.buildTicketRelatedLookups([ticket]);

    return this.toTicketListResponse(ticket, relatedLookups);
  }

  async closeByEndUser(
    ticketId: Types.ObjectId,
    userId: Types.ObjectId,
  ): Promise<UserTicketListGqlResponse> {
    const ticket = await this.closeTicket({
      ticketId,
      actorUserId: userId,
      actorRole: UserRole.END_USER,
    });
    const relatedLookups = await this.buildTicketRelatedLookups([ticket]);

    return this.toUserTicketListResponse(ticket, relatedLookups);
  }

  async closeByStaff(
    ticketId: Types.ObjectId,
    staffUserId: Types.ObjectId,
  ): Promise<TicketListGqlResponse> {
    const ticket = await this.closeTicket({
      ticketId,
      actorUserId: staffUserId,
      actorRole: UserRole.SUPER_ADMIN,
    });
    const relatedLookups = await this.buildTicketRelatedLookups([ticket]);

    return this.toTicketListResponse(ticket, relatedLookups);
  }

  private async sendTicket(params: {
    input: UserTicketSendGqlInput | SuperAdminTicketSendGqlInput;
    actorUserId: Types.ObjectId;
    actorRole: UserRole.END_USER | UserRole.SUPER_ADMIN | UserRole.ADMIN;
  }): Promise<TicketListRecord> {
    const normalizedMessageBody = this.normalizeRequiredText(
      params.input.message.body,
      "Message body",
    );
    const attachmentFileIds = await this.resolveAttachmentFileIds(
      params.input.message.attachmentFileIds,
    );

    if (params.input.id) {
      const existingTicket = await this.ticketModel
        .findById(params.input.id)
        .exec();
      if (!existingTicket) {
        throw new NotFoundException("Ticket not found");
      }

      if (
        params.actorRole === UserRole.END_USER &&
        !this.isSameObjectId(
          existingTicket.audit?.createdBy,
          params.actorUserId,
        )
      ) {
        throw new ForbiddenException(
          "You can only update your own support tickets",
        );
      }

      if (this.hasNonEmptyText(params.input.title)) {
        existingTicket.title = this.normalizeRequiredText(
          params.input.title,
          "Ticket title",
        );
      }

      if (params.input.category) {
        existingTicket.category = params.input.category;
      }

      if (params.input.priority) {
        existingTicket.priority = params.input.priority;
      }

      existingTicket.messages = [
        ...(existingTicket.messages ?? []),
        {
          body: normalizedMessageBody,
          attachmentFileIds,
          senderUserId: params.actorUserId,
        },
      ];

      this.reopenTicketOnNewMessage(existingTicket, params.actorRole);
      const savedTicket = await existingTicket.save();
      await this.publishTicketBadgeCountSignal({
        ticketId: savedTicket._id,
        action: BadgeCountTriggerAction.UPDATED,
        targetEndUserId: savedTicket.audit?.createdBy,
        includeStaffUsers: params.actorRole === UserRole.END_USER,
      });

      return savedTicket.toObject() as TicketListRecord;
    }

    const title = this.normalizeRequiredText(
      params.input.title,
      "Ticket title",
    );
    if (!params.input.category) {
      throw new BadRequestException("Ticket category is required");
    }

    const assignedEndUserId =
      params.actorRole === UserRole.END_USER
        ? params.actorUserId
        : await this.resolveAssignedEndUserId(params.input);

    const createdTicket = await this.ticketModel.create({
      title,
      category: params.input.category,
      ...(params.input.priority ? { priority: params.input.priority } : {}),
      status: TicketStatus.OPEN,
      audit: {
        createdBy: assignedEndUserId,
        updatedBy: params.actorUserId,
      },
      messages: [
        {
          body: normalizedMessageBody,
          attachmentFileIds,
          senderUserId: params.actorUserId,
        },
      ],
    });
    await this.publishTicketBadgeCountSignal({
      ticketId: createdTicket._id,
      action: BadgeCountTriggerAction.CREATED,
      includeStaffUsers: true,
    });

    return createdTicket.toObject() as TicketListRecord;
  }

  private async closeTicket(params: {
    ticketId: Types.ObjectId;
    actorUserId: Types.ObjectId;
    actorRole: UserRole.END_USER | UserRole.SUPER_ADMIN | UserRole.ADMIN;
  }): Promise<TicketListRecord> {
    const ticket = await this.ticketModel.findById(params.ticketId).exec();
    if (!ticket) {
      throw new NotFoundException("Ticket not found");
    }

    if (
      params.actorRole === UserRole.END_USER &&
      !this.isSameObjectId(ticket.audit?.createdBy, params.actorUserId)
    ) {
      throw new ForbiddenException(
        "You can only close your own support tickets",
      );
    }

    ticket.status = TicketStatus.CLOSED;
    ticket.closedBy =
      params.actorRole === UserRole.END_USER
        ? TicketClosedBy.END_USER
        : TicketClosedBy.SUPPORT;
    ticket.closedByUserId = params.actorUserId;
    ticket.closedAt = new Date();

    const savedTicket = await ticket.save();
    await this.publishTicketBadgeCountSignal({
      ticketId: savedTicket._id,
      action: BadgeCountTriggerAction.UPDATED,
      targetEndUserId: savedTicket.audit?.createdBy,
      includeStaffUsers: true,
    });

    return savedTicket.toObject() as TicketListRecord;
  }

  private async publishTicketBadgeCountSignal(params: {
    ticketId: Types.ObjectId;
    action: BadgeCountTriggerAction;
    targetEndUserId?: Types.ObjectId;
    includeStaffUsers?: boolean;
  }): Promise<void> {
    await this.badgeService.publishCountSignal({
      targetUserIds: params.targetEndUserId,
      includeStaffUsers: params.includeStaffUsers,
      payload: {
        source: BadgeCountTriggerSource.TICKET,
        action: params.action,
        ticketId: params.ticketId.toString(),
      },
    });
  }

  private async resolveAssignedEndUserId(
    input: UserTicketSendGqlInput | SuperAdminTicketSendGqlInput,
  ): Promise<Types.ObjectId> {
    const endUserId = "endUserId" in input ? input.endUserId : undefined;
    if (!endUserId) {
      throw new BadRequestException("End-user ID is required");
    }

    const user = await this.userModel
      .findById(endUserId)
      .select({ _id: 1, roles: 1 })
      .lean<Pick<User, "roles"> & { _id: Types.ObjectId }>()
      .exec();
    if (!user) {
      throw new NotFoundException("End user not found");
    }
    if (!user.roles?.includes(UserRole.END_USER)) {
      throw new BadRequestException("Assigned user must have END_USER role");
    }

    return user._id;
  }

  private async findTicketListRecords(
    input: TicketListRequest,
    enforcedFilterQuery?: FilterQuery<Ticket>,
  ): Promise<{
    tickets: TicketListRecord[];
    total: number;
    limit: number;
    skip: number;
    relatedLookups: TicketRelatedLookups;
  }> {
    const { filters, options } = input || {};
    const limit =
      options?.limit ?? PAGINATION_CONSTANT.OFFSET_BASED.DEFAULT_LIMIT;
    const skip = options?.skip ?? PAGINATION_CONSTANT.OFFSET_BASED.DEFAULT_SKIP;
    const filterQuery = {
      ...this.buildListFilterQuery(filters),
      ...(enforcedFilterQuery ?? {}),
    };
    const sortOptions = this.resolveTicketListSortOptions(options?.sort);

    const [tickets, total] = await Promise.all([
      this.ticketModel
        .find(filterQuery)
        .sort(sortOptions)
        .skip(skip)
        .limit(limit)
        .lean<TicketListRecord[]>()
        .exec(),
      this.ticketModel.countDocuments(filterQuery).exec(),
    ]);
    const relatedLookups = await this.buildTicketRelatedLookups(tickets);

    return {
      tickets,
      total,
      limit,
      skip,
      relatedLookups,
    };
  }

  private buildListFilterQuery(
    filters?: TicketListGqlInput["filters"],
  ): FilterQuery<Ticket> {
    const query: FilterQuery<Ticket> = {
      $and: [
        {
          $or: [
            { "audit.deletedAt": null },
            { "audit.deletedAt": { $exists: false } },
          ],
        },
      ],
    };

    if (!filters) {
      return query;
    }

    if (filters.query?.trim()) {
      const searchRegex = this.createContainsRegex(filters.query);
      this.addListOrFilter(query, [
        { title: searchRegex },
        { "messages.body": searchRegex },
      ]);
    }

    if (filters.id) {
      query._id = new Types.ObjectId(filters.id);
    }

    this.addListContainsFilter(query, "title", filters.title);
    this.addListContainsFilter(query, "messages.body", filters.messageBody);

    if (filters.category) {
      query.category = filters.category;
    }

    if (filters.priority) {
      query.priority = filters.priority;
    }

    if (filters.status) {
      query.status = filters.status;
    }

    if (filters.closedBy) {
      query.closedBy = filters.closedBy;
    }

    if (filters.createdByUserId) {
      query["audit.createdBy"] = new Types.ObjectId(filters.createdByUserId);
    }

    if (filters.updatedByUserId) {
      query["audit.updatedBy"] = new Types.ObjectId(filters.updatedByUserId);
    }

    if (filters.closedByUserId) {
      query.closedByUserId = new Types.ObjectId(filters.closedByUserId);
    }

    if (filters.attachmentFileId) {
      query["messages.attachmentFileIds"] = new Types.ObjectId(
        filters.attachmentFileId,
      );
    }

    this.addListDateRangeFilter(
      query,
      "audit.createdAt",
      filters.createdAtFrom,
      filters.createdAtTo,
    );
    this.addListDateRangeFilter(
      query,
      "audit.updatedAt",
      filters.updatedAtFrom,
      filters.updatedAtTo,
    );
    this.addListDateRangeFilter(
      query,
      "closedAt",
      filters.closedAtFrom,
      filters.closedAtTo,
    );

    return query;
  }

  private resolveTicketListSortOptions(
    sort?: TicketListSortOptionInput,
  ): Record<string, 1 | -1> {
    const sortOptions = buildSortOptions<TicketListSortField>(
      sort ?? {},
      {
        createdAt: "audit.createdAt",
        updatedAt: "audit.updatedAt",
        title: "title",
        category: "category",
        priority: "priority",
        status: "status",
        closedBy: "closedBy",
        closedAt: "closedAt",
      },
      { createdAt: SortingOrder.DESC },
    );

    sortOptions._id = Object.values(sortOptions)[0] ?? -1;

    return sortOptions;
  }

  private async buildTicketRelatedLookups(
    tickets: TicketListRecord[],
  ): Promise<TicketRelatedLookups> {
    const userIds = new Set<string>();
    const fileIds = new Set<string>();

    tickets.forEach((ticket) => {
      if (ticket.audit?.createdBy) {
        userIds.add(ticket.audit.createdBy.toString());
      }
      if (ticket.audit?.updatedBy) {
        userIds.add(ticket.audit.updatedBy.toString());
      }
      if (ticket.closedByUserId) {
        userIds.add(ticket.closedByUserId.toString());
      }

      (ticket.messages ?? []).forEach((message) => {
        if (message.senderUserId) {
          userIds.add(message.senderUserId.toString());
        }
        (message.attachmentFileIds ?? []).forEach((fileId) => {
          fileIds.add(fileId.toString());
        });
      });
    });

    const userObjectIds = [...userIds]
      .filter((id) => Types.ObjectId.isValid(id))
      .map((id) => new Types.ObjectId(id));
    const fileObjectIds = [...fileIds]
      .filter((id) => Types.ObjectId.isValid(id))
      .map((id) => new Types.ObjectId(id));

    const [users, files] = await Promise.all([
      userObjectIds.length > 0
        ? this.userModel
            .find({ _id: { $in: userObjectIds } })
            .select({ _id: 1, username: 1, profile: 1 })
            .lean<TicketUserLookupRecord[]>()
            .exec()
        : Promise.resolve([]),
      fileObjectIds.length > 0
        ? this.fileService.getFileSummariesByIds(fileObjectIds)
        : Promise.resolve(new Map()),
    ]);
    const avatarAccessUrlMap = await this.fileService.getAccessUrlMap(
      users.map((user) => user.profile?.avatarFileId),
    );

    return {
      usersById: new Map(users.map((user) => [user._id.toString(), user])),
      filesById: new Map(
        [...files.entries()].map(([id, file]) => [
          id,
          {
            name: file.name,
            mimeType: file.mimeType,
            sizeBytes: file.sizeBytes,
            path: file.path,
            accessUrl: file.accessUrl,
          },
        ]),
      ),
      avatarAccessUrlMap,
    };
  }

  private toTicketListResponse(
    ticket: TicketListRecord,
    relatedLookups: TicketRelatedLookups,
  ): TicketListGqlResponse {
    const createdByUserId = ticket.audit?.createdBy;
    const updatedByUserId = ticket.audit?.updatedBy;

    return {
      id: ticket._id,
      title: ticket.title,
      category: ticket.category,
      priority: ticket.priority,
      status: ticket.status,
      closedBy: ticket.closedBy,
      closedByUserId: ticket.closedByUserId,
      closedByUser: this.toTicketUserMinimalResponse(
        ticket.closedByUserId,
        ticket.closedByUserId
          ? relatedLookups.usersById.get(ticket.closedByUserId.toString())
          : undefined,
        relatedLookups.avatarAccessUrlMap,
      ),
      closedAt: ticket.closedAt,
      messages: (ticket.messages ?? []).map((message, index) =>
        this.toTicketMessageResponse(message, relatedLookups, {
          fallbackSenderUserId: index === 0 ? createdByUserId : updatedByUserId,
        }),
      ),
      createdByUserId,
      createdByUser: this.toTicketUserMinimalResponse(
        createdByUserId,
        createdByUserId
          ? relatedLookups.usersById.get(createdByUserId.toString())
          : undefined,
        relatedLookups.avatarAccessUrlMap,
      ),
      updatedByUserId,
      updatedByUser: this.toTicketUserMinimalResponse(
        updatedByUserId,
        updatedByUserId
          ? relatedLookups.usersById.get(updatedByUserId.toString())
          : undefined,
        relatedLookups.avatarAccessUrlMap,
      ),
      createdAt: ticket.audit?.createdAt,
      updatedAt: ticket.audit?.updatedAt,
    };
  }

  private toTicketMessageResponse(
    message: TicketMessage,
    relatedLookups: TicketRelatedLookups,
    options: { fallbackSenderUserId?: Types.ObjectId } = {},
  ): TicketListGqlResponse["messages"][number] {
    const attachmentFileIds = message.attachmentFileIds ?? [];
    const senderUserId = message.senderUserId ?? options.fallbackSenderUserId;

    return {
      body: message.body,
      senderUser: this.toTicketUserMinimalResponse(
        senderUserId,
        senderUserId
          ? relatedLookups.usersById.get(senderUserId.toString())
          : undefined,
        relatedLookups.avatarAccessUrlMap,
      ),
      attachmentFiles: attachmentFileIds.map((fileId) =>
        this.toTicketStoredFileMinimalResponse(
          fileId,
          relatedLookups.filesById.get(fileId.toString()),
        ),
      ),
    };
  }

  private toUserTicketListResponse(
    ticket: TicketListRecord,
    relatedLookups: TicketRelatedLookups,
  ): UserTicketListGqlResponse {
    const createdByUserId = ticket.audit?.createdBy;
    const updatedByUserId = ticket.audit?.updatedBy;

    return {
      id: ticket._id,
      title: ticket.title,
      category: ticket.category,
      priority: ticket.priority,
      status: ticket.status,
      closedBy: ticket.closedBy,
      closedAt: ticket.closedAt,
      messages: (ticket.messages ?? []).map((message, index) =>
        this.toUserTicketMessageResponse(message, relatedLookups, {
          ticketOwnerUserId: createdByUserId,
          fallbackSenderUserId: index === 0 ? createdByUserId : updatedByUserId,
        }),
      ),
      createdByUserId,
      createdByUser: this.toTicketUserMinimalResponse(
        createdByUserId,
        createdByUserId
          ? relatedLookups.usersById.get(createdByUserId.toString())
          : undefined,
        relatedLookups.avatarAccessUrlMap,
      ),
      updatedByUserId,
      updatedByUser: this.toTicketUserMinimalResponse(
        updatedByUserId,
        updatedByUserId
          ? relatedLookups.usersById.get(updatedByUserId.toString())
          : undefined,
        relatedLookups.avatarAccessUrlMap,
      ),
      createdAt: ticket.audit?.createdAt,
      updatedAt: ticket.audit?.updatedAt,
    };
  }

  private toUserTicketMessageResponse(
    message: TicketMessage,
    relatedLookups: TicketRelatedLookups,
    options: {
      ticketOwnerUserId?: Types.ObjectId;
      fallbackSenderUserId?: Types.ObjectId;
    } = {},
  ): UserTicketListGqlResponse["messages"][number] {
    const attachmentFileIds = message.attachmentFileIds ?? [];
    const senderUserId = message.senderUserId ?? options.fallbackSenderUserId;
    const isOwnerMessage = this.isSameObjectId(
      senderUserId,
      options.ticketOwnerUserId,
    );

    return {
      body: message.body,
      senderUser: isOwnerMessage
        ? undefined
        : {
            profile: {
              firstName: "پشتیبانی",
            },
          },
      attachmentFiles: attachmentFileIds.map((fileId) =>
        this.toTicketStoredFileMinimalResponse(
          fileId,
          relatedLookups.filesById.get(fileId.toString()),
        ),
      ),
    };
  }

  private toTicketUserMinimalResponse(
    id?: Types.ObjectId,
    user?: TicketUserLookupRecord,
    avatarAccessUrlMap?: Map<string, FileAccessUrlDescriptor>,
  ): TicketUserMinimalGqlResponse | undefined {
    if (!id) {
      return undefined;
    }

    const avatarFileId = user?.profile?.avatarFileId;

    return {
      id,
      username: user?.username,
      profile: user?.profile
        ? {
            firstName: user.profile.firstName,
            lastName: user.profile.lastName,
            avatarAccessUrl: avatarFileId
              ? avatarAccessUrlMap?.get(avatarFileId.toString())
              : undefined,
          }
        : undefined,
    };
  }

  private toTicketStoredFileMinimalResponse(
    id: Types.ObjectId,
    file?: TicketFileLookupRecord,
  ): TicketStoredFileMinimalGqlResponse {
    return {
      name: file?.name,
      mimeType: file?.mimeType,
      sizeBytes: file?.sizeBytes,
      path: file?.path,
      accessUrl:
        file?.accessUrl ?? this.fileService.createAccessUrlDescriptor(id),
    };
  }

  private reopenTicketOnNewMessage(
    ticket: TicketDocument,
    actorRole: UserRole.END_USER | UserRole.SUPER_ADMIN | UserRole.ADMIN,
  ): void {
    ticket.status =
      actorRole === UserRole.END_USER
        ? TicketStatus.OPEN
        : TicketStatus.ANSWERED;
    ticket.closedBy = undefined;
    ticket.closedAt = undefined;
    ticket.closedByUserId = undefined;
  }

  private async resolveAttachmentFileIds(
    attachmentFileIds?: Types.ObjectId[],
  ): Promise<Types.ObjectId[]> {
    if (!attachmentFileIds?.length) {
      return [];
    }

    const uniqueAttachmentFileIds = [
      ...new Set(attachmentFileIds.map((id) => id.toString())),
    ].map((id) => new Types.ObjectId(id));

    await Promise.all(
      uniqueAttachmentFileIds.map((fileId) =>
        this.fileService.findById(fileId.toString()),
      ),
    );

    return uniqueAttachmentFileIds;
  }

  private normalizeRequiredText(
    value: string | undefined,
    fieldName: string,
  ): string {
    const normalizedValue = this.normalizeOptionalText(value);
    if (!normalizedValue) {
      throw new BadRequestException(`${fieldName} is required`);
    }

    return normalizedValue;
  }

  private normalizeOptionalText(value?: string | null): string | undefined {
    const normalizedValue = value?.trim();
    return normalizedValue || undefined;
  }

  private hasNonEmptyText(value?: string | null): boolean {
    return !!this.normalizeOptionalText(value);
  }

  private isSameObjectId(
    first?: Types.ObjectId,
    second?: Types.ObjectId,
  ): boolean {
    return !!first && !!second && first.toString() === second.toString();
  }

  private addListContainsFilter(
    query: FilterQuery<Ticket>,
    path: string,
    value?: string,
  ): void {
    if (value?.trim()) {
      query[path] = this.createContainsRegex(value);
    }
  }

  private addListOrFilter(
    query: FilterQuery<Ticket>,
    conditions: FilterQuery<Ticket>[],
  ): void {
    query.$and = [
      ...(Array.isArray(query.$and) ? query.$and : []),
      { $or: conditions },
    ];
  }

  private addListDateRangeFilter(
    query: FilterQuery<Ticket>,
    path: string,
    from?: string,
    to?: string,
  ): void {
    const range: Record<string, Date> = {};
    const fromDate = this.parseListFilterDate(from, false);
    const toDate = this.parseListFilterDate(to, true);

    if (fromDate) {
      range.$gte = fromDate;
    }

    if (toDate) {
      range.$lte = toDate;
    }

    if (Object.keys(range).length > 0) {
      query[path] = range;
    }
  }

  private parseListFilterDate(
    value: string | undefined,
    endOfDay: boolean,
  ): Date | undefined {
    if (!value?.trim()) {
      return undefined;
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return undefined;
    }

    if (endOfDay && /^\d{4}-\d{2}-\d{2}$/.test(value.trim())) {
      date.setHours(23, 59, 59, 999);
    }

    return date;
  }

  private createContainsRegex(value: string): RegExp {
    return new RegExp(this.escapeRegex(value.trim()), "i");
  }

  private escapeRegex(value: string): string {
    return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }
}
