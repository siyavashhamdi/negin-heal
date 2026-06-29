import { useEffect, useMemo, useRef, useState, type DragEvent, type ReactElement } from "react";
import { NetworkStatus } from "@apollo/client";
import { useQuery } from "@apollo/client/react";
import {
  Box,
  CircularProgress,
  DialogContentText,
  Divider,
  Stack,
  Typography,
} from "@mui/material";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import DeleteRoundedIcon from "@mui/icons-material/DeleteRounded";
import { useMutationWithSnackbar } from "../../hooks/useMutationWithSnackbar";
import { useSnackbar } from "../../hooks/useSnackbar";
import { useTranslation } from "../../hooks/useTranslation";
import { useAuth } from "../../contexts/AuthContext";
import EntityConfirmDialogShell from "../../shared/crud/EntityConfirmDialogShell";
import EntityModalShell from "../../shared/crud/EntityModalShell";
import { PRODUCT_CREATE_MUTATION } from "../../graphql/mutations/productCreate.mutation";
import { PRODUCT_UPDATE_MUTATION } from "../../graphql/mutations/productUpdate.mutation";
import { PRODUCT_DETAIL_QUERY } from "../../graphql/queries/productDetail.query";
import ChaptersSection from "./product-form-dialog/ChaptersSection";
import MainInfoSection from "./product-form-dialog/MainInfoSection";
import ProductFormSectionTabs from "./ProductFormSectionTabs";
import ProductReviewsAdminSection from "./ProductReviewsAdminSection";
import type { ProductSectionTab } from "./product-section-tabs.shared";
import formSectionStyles from "./product-form-dialog/styles/ProductFormSections.module.scss";
import {
  reorderByIdWithInsertion,
  shouldInsertAfterHorizontal,
  shouldInsertAfterVertical,
} from "./product-form-dialog/reorder-drag.util";
import type {
  ProductDetailQuery,
  ProductDetailQueryVariables,
  ProductEditRecord,
} from "./product-list.api";
import { mapProductDetailRowToRecord } from "./product-list.api";
import type {
  DiscountKind,
  DraftChapter,
  DraftItem,
  VisibleAfterUnit,
} from "./product-form-dialog/types";
import {
  buildExistingFilePreview,
  getFileIdFromAccessUrl,
  type FileAccessUrl,
} from "../../utils/fileAccessUrl.util";
import {
  FILE_UPLOAD_POLICY,
  FILE_UPLOAD_POLICY_MAX_SIZE_BYTES,
} from "../../constants/fileUploadPolicies";
import { uploadFile, FileUploadError } from "../../utils/fileUpload.util";
import { hasFormChanges } from "../../utils/formChange.util";
import {
  calculateBatchUploadPercent,
  getFieldUploadPercent,
  type UploadProgressEntry,
} from "../../utils/uploadProgress.util";
import ModalFooterActions from "../../shared/crud/ModalFooterActions";
import { validateProductForm } from "./product-form-validation.util";

type ProductFormDialogProps = {
  readonly open: boolean;
  readonly onClose: () => void;
  readonly onSaved?: () => void;
  readonly productId?: string | null;
  readonly onDelete?: () => void;
};

type ProductWriteMutationResult = {
  productCreate: {
    id: string;
  };
  productUpdate: {
    id: string;
  };
};

type ProductWriteMutationVariables = {
  input: Record<string, unknown>;
};

type UploadedProductFiles = {
  readonly coverImageFileId?: string;
  readonly itemFileIdsByItemId: Record<string, string>;
};

type UploadTask = {
  readonly fieldId: string;
  readonly file: File;
  readonly errorMessage: string;
  readonly applyFileId: (uploadedFileId: string, files: UploadedProductFiles) => UploadedProductFiles;
};

const PRODUCT_COVER_UPLOAD_FIELD_ID = "product-cover-image";

function getProductItemUploadFieldId(itemId: string): string {
  return `product-item-file-${itemId}`;
}

function hasPendingLocalFileSelections(
  coverImageFile: File | null,
  chapters: DraftChapter[]
): boolean {
  if (coverImageFile != null) {
    return true;
  }

  return chapters.some((chapter) => chapter.items.some((item) => item.file != null));
}

let tempIdCounter = 0;
function createTempId(prefix: string): string {
  tempIdCounter += 1;
  return `${prefix}-${Date.now()}-${tempIdCounter}`;
}

function createDraftItem(): DraftItem {
  return {
    id: createTempId("item"),
    title: "",
    contentType: "FILE",
    article: "",
    file: null,
    fileAccessUrl: null,
  };
}

function createDraftChapter(): DraftChapter {
  return {
    id: createTempId("chapter"),
    title: "",
    description: "",
    visibleAfterMinutes: "",
    visibleAfterUnit: "DAYS",
    isFree: false,
    items: [createDraftItem()],
  };
}

function getVisibleAfterDraft(
  visibleAfterMinutes: number | null
): Pick<DraftChapter, "visibleAfterMinutes" | "visibleAfterUnit"> {
  if (visibleAfterMinutes == null) {
    return {
      visibleAfterMinutes: "",
      visibleAfterUnit: "DAYS",
    };
  }
  if (visibleAfterMinutes % (24 * 60) === 0) {
    return {
      visibleAfterMinutes: String(visibleAfterMinutes / (24 * 60)),
      visibleAfterUnit: "DAYS",
    };
  }
  if (visibleAfterMinutes % 60 === 0) {
    return {
      visibleAfterMinutes: String(visibleAfterMinutes / 60),
      visibleAfterUnit: "HOURS",
    };
  }
  return {
    visibleAfterMinutes: String(visibleAfterMinutes),
    visibleAfterUnit: "MINUTES",
  };
}

function createDraftChaptersFromProduct(product: ProductEditRecord): DraftChapter[] {
  const draftChapters = product.chapters.map((chapter) => {
    const visibleAfterDraft = getVisibleAfterDraft(chapter.visibleAfterMinutes);

    return {
      id: createTempId("chapter"),
      title: chapter.title,
      description: chapter.description,
      visibleAfterMinutes: visibleAfterDraft.visibleAfterMinutes,
      visibleAfterUnit: visibleAfterDraft.visibleAfterUnit,
      isFree: chapter.isFree,
      items: chapter.items.map((item) => ({
        id: createTempId("item"),
        title: item.title,
        contentType: item.fileAccessUrl ? ("FILE" as const) : ("ARTICLE" as const),
        article: item.article,
        file: null,
        fileAccessUrl: item.fileAccessUrl ?? null,
      })),
    };
  });

  return draftChapters.length > 0 ? draftChapters : [createDraftChapter()];
}

function getLastChapter(chapters: DraftChapter[]): DraftChapter | undefined {
  return chapters[chapters.length - 1];
}

function getLastItemId(chapter: DraftChapter | undefined): string | null {
  return chapter?.items[chapter.items.length - 1]?.id ?? null;
}

function normalizeDigits(value: string): string {
  return value
    .replace(/[۰-۹]/g, (digit) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(digit)))
    .replace(/[٠-٩]/g, (digit) => String("٠١٢٣٤٥٦٧٨٩".indexOf(digit)));
}

function stripNumberSeparators(value: string): string {
  return normalizeDigits(value).replace(/[,٬\s]/g, "");
}

function formatIntegerWithThousands(value: string): string {
  const digits = stripNumberSeparators(value).replace(/\D/g, "");
  if (!digits) {
    return "";
  }
  return Number(digits).toLocaleString("en-US");
}

function sanitizeDecimalNumber(value: string): string {
  const cleanValue = stripNumberSeparators(value).replace(/[^\d.]/g, "");
  const [integerPart = "", ...decimalParts] = cleanValue.split(".");
  return decimalParts.length === 0 ? integerPart : `${integerPart}.${decimalParts.join("")}`;
}

function sanitizePercentageValue(value: string): string {
  const sanitizedValue = sanitizeDecimalNumber(value);
  if (!sanitizedValue) {
    return "";
  }
  const parsedValue = Number(sanitizedValue);
  if (!Number.isFinite(parsedValue)) {
    return "";
  }
  return parsedValue > 100 ? "100" : sanitizedValue.replace(/^0(?=\d)/, "");
}

function parseOptionalNumber(value: string): number | undefined {
  const trimmed = stripNumberSeparators(value).trim();
  if (!trimmed) {
    return undefined;
  }
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function parseVisibleAfterMinutes(value: string, unit: VisibleAfterUnit): number | null {
  const parsedValue = parseOptionalNumber(value);
  if (parsedValue == null) {
    return null;
  }
  if (unit === "DAYS") {
    return parsedValue * 24 * 60;
  }
  if (unit === "HOURS") {
    return parsedValue * 60;
  }
  return parsedValue;
}

function trimToNull(value: string): string | null {
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}

function resolveStoredFileId(
  uploadedFileId: string | undefined,
  existingAccessUrl: FileAccessUrl | null
): string | null {
  return uploadedFileId ?? getFileIdFromAccessUrl(existingAccessUrl) ?? null;
}

function buildProductItemInput(
  item: DraftItem,
  itemIndex: number,
  uploadedFiles: UploadedProductFiles
): Record<string, unknown> {
  if (item.contentType === "FILE") {
    return {
      title: item.title.trim(),
      sortOrder: itemIndex + 1,
      fileId: resolveStoredFileId(uploadedFiles.itemFileIdsByItemId[item.id], item.fileAccessUrl),
      article: null,
    };
  }

  return {
    title: item.title.trim(),
    sortOrder: itemIndex + 1,
    fileId: null,
    article: trimToNull(item.article),
  };
}

function buildProductWriteMutationInput(input: {
  readonly isEditMode: boolean;
  readonly productId?: string | null;
  readonly title: string;
  readonly description: string;
  readonly coverImageFileId: string | null;
  readonly priceIrt: number;
  readonly isActive: boolean;
  readonly isReviewSubmissionEnabled: boolean;
  readonly isReviewsSectionVisible: boolean;
  readonly tags: string[];
  readonly discountEnabled: boolean;
  readonly hasPositivePrice: boolean;
  readonly discountKind: DiscountKind;
  readonly parsedDiscountValue: number | undefined;
  readonly chapters: Record<string, unknown>[];
}): Record<string, unknown> {
  const mutationInput: Record<string, unknown> = {
    title: input.title.trim(),
    description: trimToNull(input.description),
    coverImageFileId: input.coverImageFileId,
    priceIrt: input.priceIrt,
    isActive: input.isActive === true,
    isReviewSubmissionEnabled: input.isReviewSubmissionEnabled === true,
    isReviewsSectionVisible: input.isReviewsSectionVisible === true,
    tags: input.tags,
    chapters: input.chapters,
  };

  if (input.discountEnabled && input.hasPositivePrice && input.parsedDiscountValue != null) {
    mutationInput.discount = {
      type: input.discountKind,
      value: input.parsedDiscountValue,
    };
  } else if (input.isEditMode) {
    mutationInput.discount = null;
  }

  if (input.isEditMode && input.productId) {
    mutationInput.id = input.productId;
  }

  return mutationInput;
}

type ProductFormSnapshot = {
  readonly title: string;
  readonly description: string;
  readonly coverImageAccessUrl: FileAccessUrl | null;
  readonly hasCoverImageFile: boolean;
  readonly priceIrt: string;
  readonly tags: string[];
  readonly isActive: boolean;
  readonly isReviewSubmissionEnabled: boolean;
  readonly isReviewsSectionVisible: boolean;
  readonly discountEnabled: boolean;
  readonly discountKind: DiscountKind;
  readonly discountValue: string;
  readonly chapters: ReadonlyArray<{
    readonly id: string;
    readonly title: string;
    readonly description: string;
    readonly visibleAfterMinutes: string;
    readonly visibleAfterUnit: VisibleAfterUnit;
    readonly isFree: boolean;
    readonly items: ReadonlyArray<{
      readonly id: string;
      readonly title: string;
      readonly contentType: DraftItem["contentType"];
      readonly article: string;
      readonly fileAccessUrl: FileAccessUrl | null;
      readonly hasFile: boolean;
    }>;
  }>;
};

function buildProductFormSnapshot(input: {
  readonly title: string;
  readonly description: string;
  readonly coverImageAccessUrl: FileAccessUrl | null;
  readonly coverImageFile: File | null;
  readonly priceIrt: string;
  readonly tags: string[];
  readonly isActive: boolean;
  readonly isReviewSubmissionEnabled: boolean;
  readonly isReviewsSectionVisible: boolean;
  readonly discountEnabled: boolean;
  readonly discountKind: DiscountKind;
  readonly discountValue: string;
  readonly chapters: DraftChapter[];
}): ProductFormSnapshot {
  return {
    title: input.title,
    description: input.description,
    coverImageAccessUrl: input.coverImageAccessUrl,
    hasCoverImageFile: input.coverImageFile != null,
    priceIrt: input.priceIrt,
    tags: input.tags,
    isActive: input.isActive,
    isReviewSubmissionEnabled: input.isReviewSubmissionEnabled,
    isReviewsSectionVisible: input.isReviewsSectionVisible,
    discountEnabled: input.discountEnabled,
    discountKind: input.discountKind,
    discountValue: input.discountValue,
    chapters: input.chapters.map((chapter) => ({
      id: chapter.id,
      title: chapter.title,
      description: chapter.description,
      visibleAfterMinutes: chapter.visibleAfterMinutes,
      visibleAfterUnit: chapter.visibleAfterUnit,
      isFree: chapter.isFree,
      items: chapter.items.map((item) => ({
        id: item.id,
        title: item.title,
        contentType: item.contentType,
        article: item.article,
        fileAccessUrl: item.fileAccessUrl,
        hasFile: item.file != null,
      })),
    })),
  };
}

const ProductFormDialog = ({
  open,
  onClose,
  onSaved,
  productId,
  onDelete,
}: ProductFormDialogProps): ReactElement => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { showError, updateUploadProgress, hideUploadProgress } = useSnackbar();
  const isEditMode = Boolean(productId);
  const isSuperAdmin = user?.roles?.includes("SUPER_ADMIN") === true;
  const useEditSectionTabs = isEditMode && isSuperAdmin;
  const [activeFormSectionTab, setActiveFormSectionTab] = useState<ProductSectionTab>("intro");
  const [reviewsRefreshToken, setReviewsRefreshToken] = useState(0);
  const isIntroFormTabActive = !useEditSectionTabs || activeFormSectionTab === "intro";
  const isReviewsFormTabActive = useEditSectionTabs && activeFormSectionTab === "reviews";
  const showIntroFormSection = !useEditSectionTabs || activeFormSectionTab === "intro";
  const showContentFormSection = !useEditSectionTabs || activeFormSectionTab === "content";
  const showReviewsFormSection = isReviewsFormTabActive && Boolean(productId);
  const {
    data,
    loading: detailLoading,
    networkStatus,
    refetch: refetchProductDetail,
  } = useQuery<ProductDetailQuery, ProductDetailQueryVariables>(PRODUCT_DETAIL_QUERY, {
    variables: { input: { id: productId ?? "" } },
    skip: !open || !productId,
    fetchPolicy: "network-only",
    nextFetchPolicy: "network-only",
    notifyOnNetworkStatusChange: true,
  });
  const detailProduct = useMemo(() => {
    if (!productId || data?.productDetail?.id !== productId) {
      return null;
    }
    return mapProductDetailRowToRecord(data.productDetail);
  }, [productId, data]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [coverImageFile, setCoverImageFile] = useState<File | null>(null);
  const [coverImageAccessUrl, setCoverImageAccessUrl] = useState<FileAccessUrl | null>(null);
  const [priceIrt, setPriceIrt] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [isActive, setIsActive] = useState(false);
  const [isReviewSubmissionEnabled, setIsReviewSubmissionEnabled] = useState(true);
  const [isReviewsSectionVisible, setIsReviewsSectionVisible] = useState(true);
  const [discountEnabled, setDiscountEnabled] = useState(false);
  const [discountKind, setDiscountKind] = useState<DiscountKind>("PERCENTAGE");
  const [discountValue, setDiscountValue] = useState("");
  const [chapters, setChapters] = useState<DraftChapter[]>([createDraftChapter()]);
  const [activeChapterId, setActiveChapterId] = useState<string>(chapters[0]?.id ?? "");
  const draggedChapterIdRef = useRef<string | null>(null);
  const draggedItemIdRef = useRef<string | null>(null);
  const [freeProductConfirmOpen, setFreeProductConfirmOpen] = useState(false);
  const [expandedItemByChapter, setExpandedItemByChapter] = useState<Record<string, string | null>>(
    () => {
      const firstChapter = chapters[0];
      return firstChapter ? { [firstChapter.id]: firstChapter.items[0]?.id ?? null } : {};
    }
  );
  const [initialSnapshot, setInitialSnapshot] = useState<ProductFormSnapshot | null>(null);
  const appliedFormKeyRef = useRef<string | null>(null);

  const activeChapterIndex = useMemo(
    () => chapters.findIndex((chapter) => chapter.id === activeChapterId),
    [activeChapterId, chapters]
  );
  const activeChapter = activeChapterIndex >= 0 ? chapters[activeChapterIndex] : undefined;
  const parsedPriceIrt = parseOptionalNumber(priceIrt);
  const hasPositivePrice = parsedPriceIrt != null && parsedPriceIrt > 0;

  const currentSnapshot = useMemo(
    () =>
      buildProductFormSnapshot({
        title,
        description,
        coverImageAccessUrl,
        coverImageFile,
        priceIrt,
        tags,
        isActive,
        discountEnabled,
        discountKind,
        discountValue,
        isReviewSubmissionEnabled,
        isReviewsSectionVisible,
        chapters,
      }),
    [
      chapters,
      coverImageAccessUrl,
      coverImageFile,
      description,
      discountEnabled,
      discountKind,
      discountValue,
      isActive,
      isReviewSubmissionEnabled,
      isReviewsSectionVisible,
      priceIrt,
      tags,
      title,
    ]
  );

  const applyFormState = (nextProduct?: ProductEditRecord | null): void => {
    const nextChapters = nextProduct
      ? createDraftChaptersFromProduct(nextProduct)
      : [createDraftChapter()];
    const activeDraftChapter = getLastChapter(nextChapters) ?? createDraftChapter();
    const nextTitle = nextProduct?.title ?? "";
    const nextDescription = nextProduct?.description ?? "";
    const nextCoverImageAccessUrl = nextProduct?.coverImageAccessUrl ?? null;
    const nextPriceIrt =
      typeof nextProduct?.priceIrt === "number"
        ? formatIntegerWithThousands(String(nextProduct.priceIrt))
        : "";
    const nextTags = nextProduct?.tags ?? [];
    const nextIsActive = nextProduct?.isActive ?? false;
    const nextIsReviewSubmissionEnabled = nextProduct?.isReviewSubmissionEnabled ?? true;
    const nextIsReviewsSectionVisible = nextProduct?.isReviewsSectionVisible ?? true;
    const nextDiscountEnabled = nextProduct?.discount != null;
    const nextDiscountKind = nextProduct?.discount?.type ?? "PERCENTAGE";
    const nextDiscountValue = nextProduct?.discount
      ? nextProduct.discount.type === "PERCENTAGE"
        ? sanitizePercentageValue(String(nextProduct.discount.value))
        : formatIntegerWithThousands(String(nextProduct.discount.value))
      : "";

    setTitle(nextTitle);
    setDescription(nextDescription);
    setCoverImageFile(null);
    setCoverImageAccessUrl(nextCoverImageAccessUrl);
    setPriceIrt(nextPriceIrt);
    setTags(nextTags);
    setIsActive(nextIsActive);
    setIsReviewSubmissionEnabled(nextIsReviewSubmissionEnabled);
    setIsReviewsSectionVisible(nextIsReviewsSectionVisible);
    setDiscountEnabled(nextDiscountEnabled);
    setDiscountKind(nextDiscountKind);
    setDiscountValue(nextDiscountValue);
    setChapters(nextChapters);
    setActiveChapterId(activeDraftChapter.id);
    setExpandedItemByChapter({ [activeDraftChapter.id]: getLastItemId(activeDraftChapter) });
    setInitialSnapshot(
      buildProductFormSnapshot({
        title: nextTitle,
        description: nextDescription,
        coverImageAccessUrl: nextCoverImageAccessUrl,
        coverImageFile: null,
        priceIrt: nextPriceIrt,
        tags: nextTags,
        isActive: nextIsActive,
        isReviewSubmissionEnabled: nextIsReviewSubmissionEnabled,
        isReviewsSectionVisible: nextIsReviewsSectionVisible,
        discountEnabled: nextDiscountEnabled,
        discountKind: nextDiscountKind,
        discountValue: nextDiscountValue,
        chapters: nextChapters,
      })
    );
  };

  const resetForm = (): void => {
    appliedFormKeyRef.current = null;
    applyFormState(null);
  };

  const handleCoverImageFileChange = (file: File | null): void => {
    setCoverImageFile(file);
    if (file != null) {
      setCoverImageAccessUrl(null);
    }
  };

  const closeDialog = (): void => {
    setFreeProductConfirmOpen(false);
    onClose();
    resetForm();
  };

  useEffect(() => {
    if (!open) {
      appliedFormKeyRef.current = null;
      return;
    }

    if (!isEditMode) {
      if (appliedFormKeyRef.current === "__create__") {
        return;
      }

      applyFormState(null);
      appliedFormKeyRef.current = "__create__";
      return;
    }

    if (!detailProduct || !productId) {
      return;
    }

    if (appliedFormKeyRef.current === productId) {
      return;
    }

    applyFormState(detailProduct);
    appliedFormKeyRef.current = productId;
  }, [productId, detailProduct, isEditMode, open]);

  const [createProduct, createProductResult] = useMutationWithSnackbar<
    ProductWriteMutationResult,
    ProductWriteMutationVariables
  >(PRODUCT_CREATE_MUTATION, {
    successMessage: "دوره جدید با موفقیت ایجاد شد.",
    onSuccess: () => {
      closeDialog();
      onSaved?.();
    },
  });

  const [updateProduct, updateProductResult] = useMutationWithSnackbar<
    ProductWriteMutationResult,
    ProductWriteMutationVariables
  >(PRODUCT_UPDATE_MUTATION, {
    successMessage: "دوره با موفقیت ویرایش شد.",
    onSuccess: () => {
      onSaved?.();
      appliedFormKeyRef.current = null;
      void refetchProductDetail();
    },
  });

  const [isUploadingFiles, setIsUploadingFiles] = useState(false);
  const [uploadProgressByFieldId, setUploadProgressByFieldId] = useState<
    Record<string, UploadProgressEntry>
  >({});
  const isSubmitting = createProductResult.loading || updateProductResult.loading || isUploadingFiles;
  const isInitialEditFormLoading = isEditMode && detailProduct == null && detailLoading;
  const isProductDetailTabRefetching = isEditMode && networkStatus === NetworkStatus.refetch;
  const isEditFormReady = !isEditMode || detailProduct != null;
  const hasCreateInput = title.trim().length > 0;
  const hasEditFormChanges =
    initialSnapshot != null &&
    (hasFormChanges(initialSnapshot, currentSnapshot) ||
      hasPendingLocalFileSelections(coverImageFile, chapters));
  const canSubmit =
    isEditFormReady && !isSubmitting && (isEditMode ? hasEditFormChanges : hasCreateInput);

  useEffect(() => {
    const activeUploadCount = Object.keys(uploadProgressByFieldId).length;
    if (activeUploadCount === 0) {
      hideUploadProgress();
      return;
    }

    updateUploadProgress(calculateBatchUploadPercent(uploadProgressByFieldId));
  }, [hideUploadProgress, updateUploadProgress, uploadProgressByFieldId]);

  useEffect(() => {
    if (open) {
      setActiveFormSectionTab("intro");
      setReviewsRefreshToken(0);
    }
  }, [open, productId]);

  const handleFormSectionTabChange = (tab: ProductSectionTab): void => {
    if (tab === activeFormSectionTab) {
      return;
    }

    setActiveFormSectionTab(tab);

    if (!isEditMode || !productId) {
      return;
    }

    if (tab === "intro" || tab === "content") {
      void refetchProductDetail(
        {
          input: { id: productId },
        },
        { fetchPolicy: "no-cache" }
      ).then((result) => {
        const row = result.data?.productDetail;
        if (!row || row.id !== productId) {
          return;
        }

        applyFormState(mapProductDetailRowToRecord(row));
        appliedFormKeyRef.current = productId;
      });
      return;
    }

    if (tab === "reviews") {
      setReviewsRefreshToken((previous) => previous + 1);
    }
  };

  const uploadAndGetFileId = async (file: File, fieldId: string): Promise<string | null> => {
    const uploadPolicy =
      fieldId === PRODUCT_COVER_UPLOAD_FIELD_ID
        ? FILE_UPLOAD_POLICY.PRODUCT_COVER
        : FILE_UPLOAD_POLICY.PRODUCT_ITEM;
    const accept = uploadPolicy === FILE_UPLOAD_POLICY.PRODUCT_COVER ? "image/*" : "*/*";
    const allowedFormatsLabel = uploadPolicy === FILE_UPLOAD_POLICY.PRODUCT_COVER ? "تصویر" : "همه";

    setUploadProgressByFieldId((previous) => ({
      ...previous,
      [fieldId]: { loaded: 0, total: file.size },
    }));

    try {
      const result = await uploadFile(file, {
        policy: uploadPolicy,
        accept,
        allowedFormatsLabel,
        maxSizeBytes: FILE_UPLOAD_POLICY_MAX_SIZE_BYTES[uploadPolicy],
        onProgress: (progress) => {
          setUploadProgressByFieldId((previous) => ({
            ...previous,
            [fieldId]: {
              loaded: Math.round((progress.percent / 100) * file.size),
              total: file.size,
            },
          }));
        },
      });
      setUploadProgressByFieldId((previous) => {
        const next = { ...previous };
        delete next[fieldId];
        return next;
      });
      return getFileIdFromAccessUrl(result.accessUrl);
    } catch (error) {
      setUploadProgressByFieldId((previous) => {
        const next = { ...previous };
        delete next[fieldId];
        return next;
      });
      if (error instanceof FileUploadError && error.message.trim()) {
        showError(error.message);
      }
      return null;
    }
  };

  const mapChapterById = (
    chapterId: string,
    mapper: (chapter: DraftChapter) => DraftChapter
  ): void => {
    setChapters((prev) =>
      prev.map((chapter) => (chapter.id === chapterId ? mapper(chapter) : chapter))
    );
  };

  const updateChapter = (chapterId: string, patch: Partial<DraftChapter>): void => {
    mapChapterById(chapterId, (chapter) => ({ ...chapter, ...patch }));
  };

  const removeChapter = (chapterId: string): void => {
    if (chapters.length <= 1) {
      return;
    }

    const nextChapters = chapters.filter((chapter) => chapter.id !== chapterId);
    setChapters(nextChapters);

    if (activeChapterId === chapterId) {
      const nextActiveChapter = getLastChapter(nextChapters);
      setActiveChapterId(nextActiveChapter?.id ?? "");
      setExpandedItemByChapter(
        nextActiveChapter ? { [nextActiveChapter.id]: getLastItemId(nextActiveChapter) } : {}
      );
    }
  };

  const addChapter = (): void => {
    const chapter = createDraftChapter();
    setChapters((prev) => [...prev, chapter]);
    setActiveChapterId(chapter.id);
    setExpandedItemByChapter({
      [chapter.id]: chapter.items[0]?.id ?? null,
    });
  };

  const updateItem = (chapterId: string, itemId: string, patch: Partial<DraftItem>): void => {
    mapChapterById(chapterId, (chapter) => ({
      ...chapter,
      items: chapter.items.map((item) => (item.id === itemId ? { ...item, ...patch } : item)),
    }));
  };

  const addItem = (chapterId: string): void => {
    const newItem = createDraftItem();
    mapChapterById(chapterId, (chapter) => ({
      ...chapter,
      items: [...chapter.items, newItem],
    }));
    setExpandedItemByChapter({
      [chapterId]: newItem.id,
    });
  };

  const removeItem = (chapterId: string, itemId: string): void => {
    const chapter = chapters.find((draftChapter) => draftChapter.id === chapterId);
    if (!chapter || chapter.items.length <= 1) {
      return;
    }

    const nextItems = chapter.items.filter((item) => item.id !== itemId);
    setChapters((prev) =>
      prev.map((draftChapter) =>
        draftChapter.id === chapterId ? { ...draftChapter, items: nextItems } : draftChapter
      )
    );
    setExpandedItemByChapter({ [chapterId]: nextItems[nextItems.length - 1]?.id ?? null });
  };

  const validateBeforeSubmit = (): boolean => {
    const validationResult = validateProductForm({
      title,
      parsedPriceIrt,
      discountEnabled,
      hasPositivePrice,
      discountKind,
      discountValue,
      chapters,
      parseOptionalNumber,
    });

    if (!validationResult.valid) {
      if (useEditSectionTabs) {
        setActiveFormSectionTab(validationResult.section);
      }
      showError(validationResult.message);
      return false;
    }

    return true;
  };

  const isFreeProductCandidate = (): boolean => {
    const parsedDiscountValue = parseOptionalNumber(discountValue);
    return (
      parsedPriceIrt == null ||
      parsedPriceIrt === 0 ||
      (discountEnabled &&
        hasPositivePrice &&
        discountKind === "PERCENTAGE" &&
        parsedDiscountValue === 100)
    );
  };

  const uploadSelectedFiles = async (): Promise<UploadedProductFiles | null> => {
    const uploadTasks: UploadTask[] = [];

    if (coverImageFile) {
      uploadTasks.push({
        fieldId: PRODUCT_COVER_UPLOAD_FIELD_ID,
        file: coverImageFile,
        errorMessage: "آپلود فایل کاور انجام نشد.",
        applyFileId: (uploadedFileId, files) => ({
          ...files,
          coverImageFileId: uploadedFileId,
        }),
      });
    }

    for (const chapter of chapters) {
      for (const item of chapter.items) {
        if (item.contentType === "FILE" && item.file) {
          uploadTasks.push({
            fieldId: getProductItemUploadFieldId(item.id),
            file: item.file,
            errorMessage: "آپلود فایل آیتم انجام نشد.",
            applyFileId: (uploadedFileId, files) => ({
              ...files,
              itemFileIdsByItemId: {
                ...files.itemFileIdsByItemId,
                [item.id]: uploadedFileId,
              },
            }),
          });
        }
      }
    }

    const uploadResults = await Promise.all(
      uploadTasks.map(async (task) => ({
        task,
        uploadedFileId: await uploadAndGetFileId(task.file, task.fieldId),
      }))
    );

    const failedUpload = uploadResults.find((result) => !result.uploadedFileId);
    if (failedUpload) {
      showError(failedUpload.task.errorMessage);
      return null;
    }

    return uploadResults.reduce<UploadedProductFiles>(
      (files, result) => result.task.applyFileId(result.uploadedFileId ?? "", files),
      {
        itemFileIdsByItemId: {},
      }
    );
  };

  const buildChapterInputs = (uploadedFiles: UploadedProductFiles): Record<string, unknown>[] =>
    chapters.map((chapter, chapterIndex) => ({
      title: chapter.title.trim(),
      description: trimToNull(chapter.description),
      visibleAfterMinutes: parseVisibleAfterMinutes(
        chapter.visibleAfterMinutes,
        chapter.visibleAfterUnit
      ),
      isFree: hasPositivePrice ? chapter.isFree === true : false,
      sortOrder: chapterIndex + 1,
      items: chapter.items.map((item, itemIndex) =>
        buildProductItemInput(item, itemIndex, uploadedFiles)
      ),
    }));

  const handleSubmit = async (skipFreeConfirmation = false): Promise<void> => {
    if (!validateBeforeSubmit()) {
      return;
    }

    if (!skipFreeConfirmation && isFreeProductCandidate()) {
      setFreeProductConfirmOpen(true);
      return;
    }

    setFreeProductConfirmOpen(false);
    const parsedDiscountValue = parseOptionalNumber(discountValue);
    setIsUploadingFiles(true);
    setUploadProgressByFieldId({});
    let uploadedFiles: UploadedProductFiles | null = null;
    try {
      uploadedFiles = await uploadSelectedFiles();
    } finally {
      setIsUploadingFiles(false);
      setUploadProgressByFieldId({});
    }
    if (!uploadedFiles) {
      return;
    }
    const chapterInputs = buildChapterInputs(uploadedFiles);
    const mutationInput = buildProductWriteMutationInput({
      isEditMode,
      productId,
      title,
      description,
      coverImageFileId: resolveStoredFileId(uploadedFiles.coverImageFileId, coverImageAccessUrl),
      priceIrt: parsedPriceIrt ?? 0,
      isActive,
      isReviewSubmissionEnabled,
      isReviewsSectionVisible,
      tags,
      discountEnabled,
      hasPositivePrice,
      discountKind,
      parsedDiscountValue,
      chapters: chapterInputs,
    });
    const mutateProduct = isEditMode ? updateProduct : createProduct;

    void mutateProduct({
      variables: {
        input: mutationInput,
      },
    });
  };

  const handleSelectChapterIndex = (nextIndex: number): void => {
    const chapter = chapters[nextIndex];
    if (chapter) {
      setActiveChapterId(chapter.id);
      setExpandedItemByChapter({ [chapter.id]: getLastItemId(chapter) });
    }
  };

  const handleChapterDragOver = (
    event: DragEvent<HTMLButtonElement>,
    targetChapterId: string
  ): void => {
    const draggedChapterId = draggedChapterIdRef.current;
    if (!draggedChapterId || draggedChapterId === targetChapterId) {
      return;
    }

    event.preventDefault();
    event.dataTransfer.dropEffect = "move";

    const insertAfter = shouldInsertAfterHorizontal(event, event.currentTarget);
    setChapters((prev) =>
      reorderByIdWithInsertion(prev, draggedChapterId, targetChapterId, insertAfter)
    );
  };

  const handleItemDragOver = (
    event: DragEvent<HTMLDivElement>,
    chapterId: string,
    targetItemId: string
  ): void => {
    const draggedItemId = draggedItemIdRef.current;
    if (!draggedItemId || draggedItemId === targetItemId) {
      return;
    }

    event.preventDefault();
    event.dataTransfer.dropEffect = "move";

    const insertAfter = shouldInsertAfterVertical(event, event.currentTarget);
    mapChapterById(chapterId, (chapter) => ({
      ...chapter,
      items: reorderByIdWithInsertion(chapter.items, draggedItemId, targetItemId, insertAfter),
    }));
  };

  const handleSetDraggedChapterId = (chapterId: string | null): void => {
    draggedChapterIdRef.current = chapterId;
  };

  const handleSetDraggedItemId = (itemId: string | null): void => {
    draggedItemIdRef.current = itemId;
  };

  const handleDiscountKindChange = (nextDiscountKind: DiscountKind): void => {
    setDiscountKind(nextDiscountKind);
    setDiscountValue("");
  };

  const handleSetExpandedItem = (chapterId: string, itemId: string | null): void => {
    setExpandedItemByChapter({
      [chapterId]: itemId,
    });
  };

  return (
    <>
      <EntityModalShell
        open={open}
        onClose={closeDialog}
        disableClose={isSubmitting}
        hasUnsavedChanges={canSubmit}
        title={isEditMode ? "ویرایش دوره" : "دوره جدید"}
        subtitle={
          isEditMode
            ? t("pages.products.form.edit.subtitle")
            : t("pages.products.form.create.subtitle")
        }
        maxWidth="lg"
        pinFooterToBottomOnMobile
        resetKey={isEditMode ? `${productId ?? ""}-${isEditFormReady}` : undefined}
        footer={
          <ModalFooterActions
            actions={[
              {
                key: "close",
                isCloseButton: true,
                onClick: closeDialog,
                disabled: isSubmitting,
              },
              ...(isEditMode && onDelete && isIntroFormTabActive
                ? [
                    {
                      key: "delete",
                      label: "حذف دوره",
                      onClick: onDelete,
                      isDestructive: true,
                      disabled: isSubmitting,
                      icon: <DeleteRoundedIcon />,
                    },
                  ]
                : []),
              ...(isReviewsFormTabActive
                ? []
                : [
                    {
                      key: "submit",
                      label: isEditMode ? "ذخیره تغییرات" : "ایجاد دوره",
                      onClick: () => void handleSubmit(),
                      variant: "contained" as const,
                      color: "primary" as const,
                      icon: <AddRoundedIcon />,
                      disabled: !canSubmit,
                    },
                  ]),
            ]}
          />
        }
      >
        <Box sx={{ display: "grid", gap: "0.95rem" }}>
          {isInitialEditFormLoading ? (
            <Stack alignItems="center" justifyContent="center" spacing={2} sx={{ minHeight: 320 }}>
              <CircularProgress />
              <Typography variant="body2" color="text.secondary">
                در حال دریافت اطلاعات دوره...
              </Typography>
            </Stack>
          ) : (
            <>
              {useEditSectionTabs ? (
                <ProductFormSectionTabs
                  activeTab={activeFormSectionTab}
                  onChange={handleFormSectionTabChange}
                />
              ) : null}

              {isProductDetailTabRefetching &&
              (activeFormSectionTab === "intro" || activeFormSectionTab === "content") ? (
                <Stack
                  alignItems="center"
                  justifyContent="center"
                  spacing={2}
                  sx={{ minHeight: 240 }}
                >
                  <CircularProgress size={28} />
                  <Typography variant="body2" color="text.secondary">
                    در حال بروزرسانی اطلاعات...
                  </Typography>
                </Stack>
              ) : (
                <>
                  {showIntroFormSection ? (
                    <div
                      id={useEditSectionTabs ? "product-form-intro" : undefined}
                      className={
                        useEditSectionTabs ? formSectionStyles.sectionScrollTarget : undefined
                      }
                    >
                      <MainInfoSection
                        title={title}
                        onTitleChange={setTitle}
                        description={description}
                        onDescriptionChange={setDescription}
                        coverImageFile={coverImageFile}
                        onCoverImageFileChange={handleCoverImageFileChange}
                        coverImageExistingFile={buildExistingFilePreview(
                          coverImageAccessUrl,
                          title.trim() || "کاور دوره"
                        )}
                        onCoverImageExistingFileClear={() => {
                          setCoverImageAccessUrl(null);
                        }}
                        priceIrt={priceIrt}
                        onPriceIrtChange={setPriceIrt}
                        tags={tags}
                        onTagsChange={setTags}
                        isActive={isActive}
                        onIsActiveChange={setIsActive}
                        isReviewSubmissionEnabled={isReviewSubmissionEnabled}
                        onIsReviewSubmissionEnabledChange={setIsReviewSubmissionEnabled}
                        isReviewsSectionVisible={isReviewsSectionVisible}
                        onIsReviewsSectionVisibleChange={setIsReviewsSectionVisible}
                        hasPositivePrice={hasPositivePrice}
                        discountEnabled={discountEnabled}
                        onDiscountEnabledChange={setDiscountEnabled}
                        discountKind={discountKind}
                        onDiscountKindChange={handleDiscountKindChange}
                        discountValue={discountValue}
                        onDiscountValueChange={setDiscountValue}
                        formatIntegerWithThousands={formatIntegerWithThousands}
                        sanitizePercentageValue={sanitizePercentageValue}
                        uploadProgress={getFieldUploadPercent(
                          uploadProgressByFieldId[PRODUCT_COVER_UPLOAD_FIELD_ID]
                        )}
                        uploading={PRODUCT_COVER_UPLOAD_FIELD_ID in uploadProgressByFieldId}
                      />
                    </div>
                  ) : null}

                  {!useEditSectionTabs ? <Divider /> : null}

                  {showContentFormSection ? (
                    <div
                      id={useEditSectionTabs ? "product-form-content" : undefined}
                      className={
                        useEditSectionTabs ? formSectionStyles.sectionScrollTarget : undefined
                      }
                    >
                      <ChaptersSection
                        chapters={chapters}
                        activeChapter={activeChapter}
                        activeChapterIndex={activeChapterIndex}
                        expandedItemByChapter={expandedItemByChapter}
                        hasPositivePrice={hasPositivePrice}
                        uploadProgressByFieldId={uploadProgressByFieldId}
                        enableMediaCompress={isSuperAdmin}
                        onAddChapter={addChapter}
                        onSelectChapterIndex={handleSelectChapterIndex}
                        onSetDraggedChapterId={handleSetDraggedChapterId}
                        onChapterDragOver={handleChapterDragOver}
                        onRemoveChapter={removeChapter}
                        onUpdateChapter={updateChapter}
                        onSetExpandedItemByChapter={handleSetExpandedItem}
                        onSetDraggedItemId={handleSetDraggedItemId}
                        onItemDragOver={handleItemDragOver}
                        onUpdateItem={updateItem}
                        onAddItem={addItem}
                        onRemoveItem={removeItem}
                        stripNumberSeparators={stripNumberSeparators}
                      />
                    </div>
                  ) : null}

                  {showReviewsFormSection ? (
                    <section
                      id="product-form-reviews"
                      className={`${formSectionStyles.reviewsSection} ${formSectionStyles.reviewsSectionPanel}`}
                      aria-labelledby="product-form-reviews-heading"
                    >
                      <div className={formSectionStyles.reviewsHeader}>
                        <Typography id="product-form-reviews-heading" component="h3" variant="h6">
                          امتیاز و نظرات
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          مدیریت و بررسی نظرات ثبت‌شده برای این دوره
                        </Typography>
                      </div>
                      <ProductReviewsAdminSection
                        productId={productId!}
                        refreshToken={reviewsRefreshToken}
                      />
                    </section>
                  ) : null}
                </>
              )}
            </>
          )}
        </Box>
      </EntityModalShell>
      <EntityConfirmDialogShell
        open={freeProductConfirmOpen}
        onClose={() => setFreeProductConfirmOpen(false)}
        title={isEditMode ? "تایید ویرایش دوره رایگان" : "تایید ایجاد دوره رایگان"}
        footer={
          <ModalFooterActions
            actions={[
              {
                key: "close",
                isCloseButton: true,
                onClick: () => setFreeProductConfirmOpen(false),
              },
              {
                key: "submit",
                label: isEditMode ? "ذخیره دوره رایگان" : "ایجاد دوره رایگان",
                onClick: () => void handleSubmit(true),
                variant: "contained",
                color: "primary",
                disabled: isSubmitting,
              },
            ]}
          />
        }
      >
        <DialogContentText>
          {isEditMode
            ? "این دوره به‌صورت رایگان ذخیره می‌شود. آیا مطمئن هستید؟"
            : "این دوره به‌صورت رایگان ایجاد می‌شود. آیا مطمئن هستید؟"}
        </DialogContentText>
      </EntityConfirmDialogShell>
    </>
  );
};

export default ProductFormDialog;
