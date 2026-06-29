import { Injectable, Logger } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";

import {
  Product,
  ProductDocument,
  StoredFile,
  StoredFileDocument,
  Ticket,
  TicketDocument,
  User,
  UserProduct,
  UserProductDocument,
  UserDocument,
} from "../../database/schemas";
import { addNotDeletedCondition } from "../../database/utils/not-deleted-query.util";
import { FileService } from "./file.service";

export type UnreferencedFileCleanupRunResult = {
  referencedFileCount: number;
  clearedUnavailableReferenceCount: number;
  deletedUnreferencedFileCount: number;
  deletedUnreferencedDbOnlyCount: number;
  deletedMinioOrphanCount: number;
};

type FileReferenceSource = {
  label: string;
  collect: () => Promise<unknown[]>;
};

const UNAVAILABLE_REFERENCE_BATCH_SIZE = 500;

@Injectable()
export class UnreferencedFileCleanupService {
  private readonly logger = new Logger(UnreferencedFileCleanupService.name);
  private readonly fileScanBatchSize = 500;
  private readonly deleteBatchSize = 100;

  private readonly fileReferenceSources: FileReferenceSource[];

  constructor(
    @InjectModel(Product.name)
    private readonly productModel: Model<ProductDocument>,
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
    @InjectModel(Ticket.name)
    private readonly ticketModel: Model<TicketDocument>,
    @InjectModel(UserProduct.name)
    private readonly userProductModel: Model<UserProductDocument>,
    @InjectModel(StoredFile.name)
    private readonly storedFileModel: Model<StoredFileDocument>,
    private readonly fileService: FileService,
  ) {
    this.fileReferenceSources = [
      {
        label: "products.coverImageFileId",
        collect: () =>
          this.productModel.collection.distinct(
            "coverImageFileId",
            addNotDeletedCondition({
              coverImageFileId: { $exists: true, $ne: null },
            }),
          ),
      },
      {
        label: "products.chapters.items.fileId",
        collect: () =>
          this.productModel.collection.distinct(
            "chapters.items.fileId",
            addNotDeletedCondition({
              "chapters.items.fileId": { $exists: true, $ne: null },
            }),
          ),
      },
      {
        label: "users.profile.avatarFileId",
        collect: () =>
          this.userModel.collection.distinct(
            "profile.avatarFileId",
            addNotDeletedCondition({
              "profile.avatarFileId": { $exists: true, $ne: null },
            }),
          ),
      },
      {
        label: "tickets.messages.attachmentFileIds",
        collect: () =>
          this.ticketModel.collection.distinct(
            "messages.attachmentFileIds",
            addNotDeletedCondition({
              "messages.attachmentFileIds.0": { $exists: true },
            }),
          ),
      },
      {
        label: "user_products.purchase.uploadedReceiptFileId",
        collect: () =>
          this.userProductModel.collection.distinct(
            "purchase.uploadedReceiptFileId",
            addNotDeletedCondition({
              "purchase.uploadedReceiptFileId": { $exists: true, $ne: null },
            }),
          ),
      },
    ];
  }

  async removeUnreferencedFiles(): Promise<UnreferencedFileCleanupRunResult> {
    let clearedUnavailableReferenceCount = 0;

    // Phase 1: null broken references and remove unusable file records.
    let referencedFileIds = await this.collectReferencedFileIds();
    clearedUnavailableReferenceCount +=
      await this.clearUnavailableFileReferences(referencedFileIds);

    // Phase 2: delete unreferenced files (MinIO + files collection).
    referencedFileIds = await this.collectReferencedFileIds();
    const deletedUnreferencedFileCount =
      await this.deleteUnreferencedStoredFiles();

    // Phase 3: safety net for unreferenced DB rows whose MinIO object is already gone.
    referencedFileIds = await this.collectReferencedFileIds();
    const deletedUnreferencedDbOnlyCount =
      await this.fileService.removeUnreferencedStoredFileRecordsMissingInMinio({
        getReferencedFileIds: () => this.collectReferencedFileIds(),
        scanBatchSize: this.fileScanBatchSize,
        deleteBatchSize: this.deleteBatchSize,
      });

    // Phase 4: delete MinIO objects that have no active DB record.
    referencedFileIds = await this.collectReferencedFileIds();
    const deletedMinioOrphanCount =
      await this.fileService.removeMinioObjectsWithoutDbRecord({
        referencedFileIds,
      });

    // Phase 5: final pass for references broken by deletions above.
    referencedFileIds = await this.collectReferencedFileIds();
    clearedUnavailableReferenceCount +=
      await this.clearUnavailableFileReferences(referencedFileIds);

    this.logger.log(
      `Unreferenced file cleanup: referenced=${referencedFileIds.size}, clearedUnavailableReferences=${clearedUnavailableReferenceCount}, deletedUnreferenced=${deletedUnreferencedFileCount}, deletedUnreferencedDbOnly=${deletedUnreferencedDbOnlyCount}, deletedMinioOrphans=${deletedMinioOrphanCount}`,
    );

    return {
      referencedFileCount: referencedFileIds.size,
      clearedUnavailableReferenceCount,
      deletedUnreferencedFileCount,
      deletedUnreferencedDbOnlyCount,
      deletedMinioOrphanCount,
    };
  }

  private async clearUnavailableFileReferences(
    referencedFileIds: Set<string>,
  ): Promise<number> {
    if (referencedFileIds.size === 0) {
      return 0;
    }

    const unavailableFileIds =
      await this.fileService.findReferencedFileIdsUnavailableForUse(
        referencedFileIds,
      );

    if (unavailableFileIds.size === 0) {
      return 0;
    }

    const unavailableFileIdList = [...unavailableFileIds];
    let clearedCount = 0;
    const updatedAt = new Date();

    for (
      let index = 0;
      index < unavailableFileIdList.length;
      index += UNAVAILABLE_REFERENCE_BATCH_SIZE
    ) {
      const unavailableBatch = unavailableFileIdList.slice(
        index,
        index + UNAVAILABLE_REFERENCE_BATCH_SIZE,
      );
      const unavailableObjectIds = unavailableBatch.map(
        (fileId) => new Types.ObjectId(fileId),
      );

      const [
        clearedProductReferences,
        clearedUserReferences,
        clearedTicketReferences,
        clearedUserProductReferences,
      ] = await Promise.all([
        this.clearUnavailableProductFileReferences(
          unavailableObjectIds,
          updatedAt,
        ),
        this.clearUnavailableUserAvatarReferences(
          unavailableObjectIds,
          updatedAt,
        ),
        this.clearUnavailableTicketAttachmentReferences(
          unavailableObjectIds,
          updatedAt,
        ),
        this.clearUnavailableUserProductReceiptReferences(
          unavailableObjectIds,
          updatedAt,
        ),
      ]);

      clearedCount +=
        clearedProductReferences +
        clearedUserReferences +
        clearedTicketReferences +
        clearedUserProductReferences;
    }

    const referencedFileIdsAfterClear = await this.collectReferencedFileIds();
    let deletedBrokenFileCount = 0;
    for (
      let index = 0;
      index < unavailableFileIdList.length;
      index += this.deleteBatchSize
    ) {
      const deleteBatch = unavailableFileIdList
        .slice(index, index + this.deleteBatchSize)
        .map((fileId) => new Types.ObjectId(fileId));
      deletedBrokenFileCount += await this.fileService.deleteUnreferencedByIds(
        deleteBatch,
        referencedFileIdsAfterClear,
      );
    }

    this.logger.log(
      `Cleared unavailable file references for ${unavailableFileIdList.length} unusable file id(s) across ${clearedCount} document(s); soft-deleted ${deletedBrokenFileCount} broken file record(s) from files collection`,
    );

    return clearedCount;
  }

  private async clearUnavailableProductFileReferences(
    unavailableObjectIds: Types.ObjectId[],
    updatedAt: Date,
  ): Promise<number> {
    const result = await this.productModel.collection.updateMany(
      addNotDeletedCondition({
        $or: [
          { coverImageFileId: { $in: unavailableObjectIds } },
          { "chapters.items.fileId": { $in: unavailableObjectIds } },
        ],
      }),
      [
        {
          $set: {
            coverImageFileId: {
              $cond: [
                { $in: ["$coverImageFileId", unavailableObjectIds] },
                null,
                "$coverImageFileId",
              ],
            },
            chapters: {
              $map: {
                input: { $ifNull: ["$chapters", []] },
                as: "chapter",
                in: {
                  $mergeObjects: [
                    "$$chapter",
                    {
                      items: {
                        $map: {
                          input: { $ifNull: ["$$chapter.items", []] },
                          as: "item",
                          in: {
                            $mergeObjects: [
                              "$$item",
                              {
                                fileId: {
                                  $cond: [
                                    {
                                      $in: [
                                        "$$item.fileId",
                                        unavailableObjectIds,
                                      ],
                                    },
                                    null,
                                    "$$item.fileId",
                                  ],
                                },
                              },
                            ],
                          },
                        },
                      },
                    },
                  ],
                },
              },
            },
            "audit.updatedAt": updatedAt,
          },
        },
      ],
    );

    return result.modifiedCount ?? 0;
  }

  private async clearUnavailableUserAvatarReferences(
    unavailableObjectIds: Types.ObjectId[],
    updatedAt: Date,
  ): Promise<number> {
    const result = await this.userModel.collection.updateMany(
      addNotDeletedCondition({
        "profile.avatarFileId": { $in: unavailableObjectIds },
      }),
      {
        $set: {
          "profile.avatarFileId": null,
          "audit.updatedAt": updatedAt,
        },
      },
    );

    return result.modifiedCount ?? 0;
  }

  private async clearUnavailableTicketAttachmentReferences(
    unavailableObjectIds: Types.ObjectId[],
    updatedAt: Date,
  ): Promise<number> {
    const result = await this.ticketModel.collection.updateMany(
      addNotDeletedCondition({
        "messages.attachmentFileIds": { $in: unavailableObjectIds },
      }),
      [
        {
          $set: {
            messages: {
              $map: {
                input: { $ifNull: ["$messages", []] },
                as: "message",
                in: {
                  $mergeObjects: [
                    "$$message",
                    {
                      attachmentFileIds: {
                        $filter: {
                          input: {
                            $ifNull: ["$$message.attachmentFileIds", []],
                          },
                          as: "fileId",
                          cond: {
                            $not: {
                              $in: ["$$fileId", unavailableObjectIds],
                            },
                          },
                        },
                      },
                    },
                  ],
                },
              },
            },
            "audit.updatedAt": updatedAt,
          },
        },
      ],
    );

    return result.modifiedCount ?? 0;
  }

  private async clearUnavailableUserProductReceiptReferences(
    unavailableObjectIds: Types.ObjectId[],
    updatedAt: Date,
  ): Promise<number> {
    const result = await this.userProductModel.collection.updateMany(
      addNotDeletedCondition({
        "purchase.uploadedReceiptFileId": { $in: unavailableObjectIds },
      }),
      {
        $set: {
          "purchase.uploadedReceiptFileId": null,
          "audit.updatedAt": updatedAt,
        },
      },
    );

    return result.modifiedCount ?? 0;
  }

  private normalizeFileId(value: unknown): string | null {
    if (!value) {
      return null;
    }

    if (value instanceof Types.ObjectId) {
      return value.toString();
    }

    const normalizedValue = String(value);
    return Types.ObjectId.isValid(normalizedValue)
      ? new Types.ObjectId(normalizedValue).toString()
      : null;
  }

  private async collectReferencedFileIds(): Promise<Set<string>> {
    const referencedFileIds = new Set<string>();

    const batches = await Promise.all(
      this.fileReferenceSources.map(async (source) => source.collect()),
    );

    for (const ids of batches) {
      for (const id of ids) {
        const normalizedId = this.normalizeFileId(id);
        if (normalizedId) {
          referencedFileIds.add(normalizedId);
        }
      }
    }

    return referencedFileIds;
  }

  private async deleteUnreferencedStoredFiles(): Promise<number> {
    let deletedCount = 0;
    let lastId: Types.ObjectId | undefined;

    while (true) {
      const referencedFileIds = await this.collectReferencedFileIds();

      const batch = await this.storedFileModel.collection
        .find(addNotDeletedCondition(lastId ? { _id: { $gt: lastId } } : {}), {
          projection: { _id: 1 },
        })
        .sort({ _id: 1 })
        .limit(this.fileScanBatchSize)
        .toArray();

      if (batch.length === 0) {
        break;
      }

      const unreferencedIds = batch
        .map((storedFile) => storedFile._id as Types.ObjectId)
        .filter((fileId) => !referencedFileIds.has(fileId.toString()));

      for (
        let index = 0;
        index < unreferencedIds.length;
        index += this.deleteBatchSize
      ) {
        const deleteBatch = unreferencedIds.slice(
          index,
          index + this.deleteBatchSize,
        );
        deletedCount += await this.fileService.deleteUnreferencedByIds(
          deleteBatch,
          referencedFileIds,
        );
      }

      lastId = batch[batch.length - 1]._id as Types.ObjectId;

      if (batch.length < this.fileScanBatchSize) {
        break;
      }
    }

    return deletedCount;
  }
}
