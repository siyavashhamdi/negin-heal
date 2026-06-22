import { useEffect, useMemo, useRef, useState, type DragEvent, type ReactElement } from "react";
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
import { useMutationWithSnackbar } from "../../hooks/useMutationWithSnackbar";
import { useSnackbar } from "../../hooks/useSnackbar";
import { useTranslation } from "../../hooks/useTranslation";
import EntityConfirmDialogShell from "../../shared/crud/EntityConfirmDialogShell";
import EntityModalShell from "../../shared/crud/EntityModalShell";
import { COURSE_CREATE_MUTATION } from "../../graphql/mutations/courseCreate.mutation";
import { COURSE_UPDATE_MUTATION } from "../../graphql/mutations/courseUpdate.mutation";
import { COURSE_DETAIL_QUERY } from "../../graphql/queries/courseDetail.query";
import ChaptersSection from "./course-form-dialog/ChaptersSection";
import MainInfoSection from "./course-form-dialog/MainInfoSection";
import {
  reorderByIdWithInsertion,
  shouldInsertAfterHorizontal,
  shouldInsertAfterVertical,
} from "./course-form-dialog/reorder-drag.util";
import type {
  CourseDetailQuery,
  CourseDetailQueryVariables,
  CourseEditRecord,
} from "./courses-list.api";
import { mapCourseDetailRowToRecord } from "./courses-list.api";
import type {
  DiscountKind,
  DraftChapter,
  DraftItem,
  VisibleAfterUnit,
} from "./course-form-dialog/types";
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

type CourseFormDialogProps = {
  readonly open: boolean;
  readonly onClose: () => void;
  readonly onSaved?: () => void;
  readonly courseId?: string | null;
};

type CourseWriteMutationResult = {
  courseCreate: {
    id: string;
  };
  courseUpdate: {
    id: string;
  };
};

type CourseWriteMutationVariables = {
  input: Record<string, unknown>;
};

type UploadedCourseFiles = {
  readonly coverImageFileId?: string;
  readonly itemFileIdsByItemId: Record<string, string>;
};

type UploadTask = {
  readonly fieldId: string;
  readonly file: File;
  readonly errorMessage: string;
  readonly applyFileId: (uploadedFileId: string, files: UploadedCourseFiles) => UploadedCourseFiles;
};

const COURSE_COVER_UPLOAD_FIELD_ID = "course-cover-image";

function getCourseItemUploadFieldId(itemId: string): string {
  return `course-item-file-${itemId}`;
}

function hasPendingLocalFileSelections(
  coverImageFile: File | null,
  chapters: DraftChapter[],
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
  visibleAfterMinutes: number | null,
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

function createDraftChaptersFromCourse(course: CourseEditRecord): DraftChapter[] {
  const draftChapters = course.chapters.map((chapter) => {
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

function parseVisibleAfterMinutes(value: string, unit: VisibleAfterUnit): number | undefined {
  const parsedValue = parseOptionalNumber(value);
  if (parsedValue == null) {
    return undefined;
  }
  if (unit === "DAYS") {
    return parsedValue * 24 * 60;
  }
  if (unit === "HOURS") {
    return parsedValue * 60;
  }
  return parsedValue;
}

type CourseFormSnapshot = {
  readonly title: string;
  readonly description: string;
  readonly coverImageAccessUrl: FileAccessUrl | null;
  readonly hasCoverImageFile: boolean;
  readonly priceIrt: string;
  readonly tags: string[];
  readonly isActive: boolean;
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

function buildCourseFormSnapshot(input: {
  readonly title: string;
  readonly description: string;
  readonly coverImageAccessUrl: FileAccessUrl | null;
  readonly coverImageFile: File | null;
  readonly priceIrt: string;
  readonly tags: string[];
  readonly isActive: boolean;
  readonly discountEnabled: boolean;
  readonly discountKind: DiscountKind;
  readonly discountValue: string;
  readonly chapters: DraftChapter[];
}): CourseFormSnapshot {
  return {
    title: input.title,
    description: input.description,
    coverImageAccessUrl: input.coverImageAccessUrl,
    hasCoverImageFile: input.coverImageFile != null,
    priceIrt: input.priceIrt,
    tags: input.tags,
    isActive: input.isActive,
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

const CourseFormDialog = ({
  open,
  onClose,
  onSaved,
  courseId,
}: CourseFormDialogProps): ReactElement => {
  const { t } = useTranslation();
  const { showError, updateUploadProgress, hideUploadProgress } = useSnackbar();
  const isEditMode = Boolean(courseId);
  const { data, loading: detailLoading } = useQuery<CourseDetailQuery, CourseDetailQueryVariables>(
    COURSE_DETAIL_QUERY,
    {
      variables: { input: { id: courseId ?? "" } },
      skip: !open || !courseId,
      fetchPolicy: "network-only",
    },
  );
  const detailCourse = useMemo(() => {
    if (!courseId || data?.courseDetail?.id !== courseId) {
      return null;
    }
    return mapCourseDetailRowToRecord(data.courseDetail);
  }, [courseId, data]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [coverImageFile, setCoverImageFile] = useState<File | null>(null);
  const [coverImageAccessUrl, setCoverImageAccessUrl] = useState<FileAccessUrl | null>(null);
  const [priceIrt, setPriceIrt] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [isActive, setIsActive] = useState(false);
  const [discountEnabled, setDiscountEnabled] = useState(false);
  const [discountKind, setDiscountKind] = useState<DiscountKind>("PERCENTAGE");
  const [discountValue, setDiscountValue] = useState("");
  const [chapters, setChapters] = useState<DraftChapter[]>([createDraftChapter()]);
  const [activeChapterId, setActiveChapterId] = useState<string>(chapters[0]?.id ?? "");
  const draggedChapterIdRef = useRef<string | null>(null);
  const draggedItemIdRef = useRef<string | null>(null);
  const [freeCourseConfirmOpen, setFreeCourseConfirmOpen] = useState(false);
  const [expandedItemByChapter, setExpandedItemByChapter] = useState<Record<string, string | null>>(
    () => {
      const firstChapter = chapters[0];
      return firstChapter ? { [firstChapter.id]: firstChapter.items[0]?.id ?? null } : {};
    },
  );
  const [initialSnapshot, setInitialSnapshot] = useState<CourseFormSnapshot | null>(null);
  const appliedFormKeyRef = useRef<string | null>(null);

  const activeChapterIndex = useMemo(
    () => chapters.findIndex((chapter) => chapter.id === activeChapterId),
    [activeChapterId, chapters],
  );
  const activeChapter = activeChapterIndex >= 0 ? chapters[activeChapterIndex] : undefined;
  const parsedPriceIrt = parseOptionalNumber(priceIrt);
  const hasPositivePrice = parsedPriceIrt != null && parsedPriceIrt > 0;

  const currentSnapshot = useMemo(
    () =>
      buildCourseFormSnapshot({
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
      priceIrt,
      tags,
      title,
    ],
  );

  const applyFormState = (nextCourse?: CourseEditRecord | null): void => {
    const nextChapters = nextCourse ? createDraftChaptersFromCourse(nextCourse) : [createDraftChapter()];
    const activeDraftChapter = getLastChapter(nextChapters) ?? createDraftChapter();
    const nextTitle = nextCourse?.title ?? "";
    const nextDescription = nextCourse?.description ?? "";
    const nextCoverImageAccessUrl = nextCourse?.coverImageAccessUrl ?? null;
    const nextPriceIrt =
      typeof nextCourse?.priceIrt === "number"
        ? formatIntegerWithThousands(String(nextCourse.priceIrt))
        : "";
    const nextTags = nextCourse?.tags ?? [];
    const nextIsActive = nextCourse?.isActive ?? false;
    const nextDiscountEnabled = nextCourse?.discount != null;
    const nextDiscountKind = nextCourse?.discount?.type ?? "PERCENTAGE";
    const nextDiscountValue = nextCourse?.discount
      ? nextCourse.discount.type === "PERCENTAGE"
        ? sanitizePercentageValue(String(nextCourse.discount.value))
        : formatIntegerWithThousands(String(nextCourse.discount.value))
      : "";

    setTitle(nextTitle);
    setDescription(nextDescription);
    setCoverImageFile(null);
    setCoverImageAccessUrl(nextCoverImageAccessUrl);
    setPriceIrt(nextPriceIrt);
    setTags(nextTags);
    setIsActive(nextIsActive);
    setDiscountEnabled(nextDiscountEnabled);
    setDiscountKind(nextDiscountKind);
    setDiscountValue(nextDiscountValue);
    setChapters(nextChapters);
    setActiveChapterId(activeDraftChapter.id);
    setExpandedItemByChapter({ [activeDraftChapter.id]: getLastItemId(activeDraftChapter) });
    setInitialSnapshot(
      buildCourseFormSnapshot({
        title: nextTitle,
        description: nextDescription,
        coverImageAccessUrl: nextCoverImageAccessUrl,
        coverImageFile: null,
        priceIrt: nextPriceIrt,
        tags: nextTags,
        isActive: nextIsActive,
        discountEnabled: nextDiscountEnabled,
        discountKind: nextDiscountKind,
        discountValue: nextDiscountValue,
        chapters: nextChapters,
      }),
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
    setFreeCourseConfirmOpen(false);
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

    if (!detailCourse || !courseId) {
      return;
    }

    if (appliedFormKeyRef.current === courseId) {
      return;
    }

    applyFormState(detailCourse);
    appliedFormKeyRef.current = courseId;
  }, [courseId, detailCourse, isEditMode, open]);

  const [createCourse, createCourseResult] = useMutationWithSnackbar<
    CourseWriteMutationResult,
    CourseWriteMutationVariables
  >(COURSE_CREATE_MUTATION, {
    successMessage: "دوره جدید با موفقیت ایجاد شد.",
    errorMessage: "ایجاد دوره انجام نشد.",
    onSuccess: () => {
      closeDialog();
      onSaved?.();
    },
  });

  const [updateCourse, updateCourseResult] = useMutationWithSnackbar<
    CourseWriteMutationResult,
    CourseWriteMutationVariables
  >(COURSE_UPDATE_MUTATION, {
    successMessage: "دوره با موفقیت ویرایش شد.",
    errorMessage: "ویرایش دوره انجام نشد.",
    onSuccess: () => {
      closeDialog();
      onSaved?.();
    },
  });

  const [isUploadingFiles, setIsUploadingFiles] = useState(false);
  const [uploadProgressByFieldId, setUploadProgressByFieldId] = useState<
    Record<string, UploadProgressEntry>
  >({});
  const isSubmitting =
    createCourseResult.loading ||
    updateCourseResult.loading ||
    isUploadingFiles;
  const isEditFormReady = !isEditMode || (detailCourse != null && !detailLoading);
  const hasCreateInput = title.trim().length > 0;
  const hasEditFormChanges =
    initialSnapshot != null &&
    (hasFormChanges(initialSnapshot, currentSnapshot) ||
      hasPendingLocalFileSelections(coverImageFile, chapters));
  const canSubmit =
    isEditFormReady &&
    !isSubmitting &&
    (isEditMode ? hasEditFormChanges : hasCreateInput);

  useEffect(() => {
    const activeUploadCount = Object.keys(uploadProgressByFieldId).length;
    if (activeUploadCount === 0) {
      hideUploadProgress();
      return;
    }

    updateUploadProgress(calculateBatchUploadPercent(uploadProgressByFieldId));
  }, [hideUploadProgress, updateUploadProgress, uploadProgressByFieldId]);

  const uploadAndGetFileId = async (file: File, fieldId: string): Promise<string | null> => {
    const uploadPolicy =
      fieldId === COURSE_COVER_UPLOAD_FIELD_ID
        ? FILE_UPLOAD_POLICY.COURSE_COVER
        : FILE_UPLOAD_POLICY.COURSE_ITEM;
    const accept =
      uploadPolicy === FILE_UPLOAD_POLICY.COURSE_COVER ? "image/*" : "*/*";
    const allowedFormatsLabel =
      uploadPolicy === FILE_UPLOAD_POLICY.COURSE_COVER ? "تصویر" : "همه";

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
    mapper: (chapter: DraftChapter) => DraftChapter,
  ): void => {
    setChapters((prev) =>
      prev.map((chapter) => (chapter.id === chapterId ? mapper(chapter) : chapter)),
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
        nextActiveChapter ? { [nextActiveChapter.id]: getLastItemId(nextActiveChapter) } : {},
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
        draftChapter.id === chapterId ? { ...draftChapter, items: nextItems } : draftChapter,
      ),
    );
    setExpandedItemByChapter({ [chapterId]: nextItems[nextItems.length - 1]?.id ?? null });
  };

  const validateBeforeSubmit = (): boolean => {
    if (!title.trim()) {
      showError("عنوان دوره الزامی است.");
      return false;
    }
    if (parsedPriceIrt != null && parsedPriceIrt < 0) {
      showError("قیمت نمی‌تواند منفی باشد.");
      return false;
    }
    if (discountEnabled && hasPositivePrice) {
      const parsedDiscountValue = parseOptionalNumber(discountValue);
      if (parsedDiscountValue == null) {
        showError("مقدار تخفیف الزامی است.");
        return false;
      }
      if (
        discountKind === "PERCENTAGE" &&
        (parsedDiscountValue <= 0 || parsedDiscountValue > 100)
      ) {
        showError("مقدار تخفیف درصدی باید بین ۰ تا ۱۰۰ باشد.");
        return false;
      }
      if (discountKind === "FIXED_AMOUNT_IRT" && parsedDiscountValue <= 0) {
        showError("مقدار تخفیف باید عددی مثبت باشد.");
        return false;
      }
    }
    if (chapters.length === 0) {
      showError("حداقل یک فصل لازم است.");
      return false;
    }

    for (const chapter of chapters) {
      if (!chapter.title.trim()) {
        showError("عنوان فصل نمی‌تواند خالی باشد.");
        return false;
      }
      const parsedVisibleAfter = parseOptionalNumber(chapter.visibleAfterMinutes);
      if (parsedVisibleAfter != null && parsedVisibleAfter < 0) {
        showError("نمایش بعد از نمی‌تواند منفی باشد.");
        return false;
      }
      if (chapter.items.length === 0) {
        showError("هر فصل باید حداقل یک آیتم داشته باشد.");
        return false;
      }
      for (const item of chapter.items) {
        if (!item.title.trim()) {
          showError("عنوان آیتم نمی‌تواند خالی باشد.");
          return false;
        }
        if (item.contentType === "FILE" && !item.file && !getFileIdFromAccessUrl(item.fileAccessUrl)) {
          showError("برای آیتم فایل‌محور باید فایل انتخاب شود.");
          return false;
        }
        if (item.contentType === "ARTICLE" && !item.article.trim()) {
          showError("برای آیتم مقاله‌ای باید متن مقاله وارد شود.");
          return false;
        }
      }
    }
    return true;
  };

  const isFreeCourseCandidate = (): boolean => {
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

  const uploadSelectedFiles = async (): Promise<UploadedCourseFiles | null> => {
    const uploadTasks: UploadTask[] = [];

    if (coverImageFile) {
      uploadTasks.push({
        fieldId: COURSE_COVER_UPLOAD_FIELD_ID,
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
            fieldId: getCourseItemUploadFieldId(item.id),
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
      })),
    );

    const failedUpload = uploadResults.find((result) => !result.uploadedFileId);
    if (failedUpload) {
      showError(failedUpload.task.errorMessage);
      return null;
    }

    return uploadResults.reduce<UploadedCourseFiles>(
      (files, result) => result.task.applyFileId(result.uploadedFileId ?? "", files),
      {
        itemFileIdsByItemId: {},
      },
    );
  };

  const buildChapterInputs = (uploadedFiles: UploadedCourseFiles): Record<string, unknown>[] =>
    chapters.map((chapter, chapterIndex) => {
      const itemInputs = chapter.items.map((item, itemIndex) => ({
        title: item.title.trim(),
        sortOrder: itemIndex + 1,
        fileId:
          item.contentType === "FILE"
            ? uploadedFiles.itemFileIdsByItemId[item.id] ||
              getFileIdFromAccessUrl(item.fileAccessUrl) ||
              undefined
            : undefined,
        article: item.contentType === "ARTICLE" ? item.article.trim() || undefined : undefined,
      }));

      return {
        title: chapter.title.trim(),
        description: chapter.description.trim() || undefined,
        visibleAfterMinutes: parseVisibleAfterMinutes(
          chapter.visibleAfterMinutes,
          chapter.visibleAfterUnit,
        ),
        isFree: hasPositivePrice ? chapter.isFree === true : false,
        sortOrder: chapterIndex + 1,
        items: itemInputs,
      };
    });

  const handleSubmit = async (skipFreeConfirmation = false): Promise<void> => {
    if (!validateBeforeSubmit()) {
      return;
    }

    if (!skipFreeConfirmation && isFreeCourseCandidate()) {
      setFreeCourseConfirmOpen(true);
      return;
    }

    setFreeCourseConfirmOpen(false);
    const parsedDiscountValue = parseOptionalNumber(discountValue);
    setIsUploadingFiles(true);
    setUploadProgressByFieldId({});
    let uploadedFiles: UploadedCourseFiles | null = null;
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

    const input: Record<string, unknown> = {
      title: title.trim(),
      description: description.trim() || undefined,
      coverImageFileId:
        uploadedFiles.coverImageFileId || getFileIdFromAccessUrl(coverImageAccessUrl) || undefined,
      priceIrt: parsedPriceIrt ?? 0,
      isActive: isActive === true,
      tags,
      chapters: chapterInputs,
    };

    if (discountEnabled && hasPositivePrice && parsedDiscountValue != null) {
      input.discount = {
        type: discountKind,
        value: parsedDiscountValue,
      };
    } else if (isEditMode) {
      input.discount = null;
    }

    const mutationInput = isEditMode && courseId ? { ...input, id: courseId } : input;
    const mutateCourse = isEditMode ? updateCourse : createCourse;

    void mutateCourse({
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
    targetChapterId: string,
  ): void => {
    const draggedChapterId = draggedChapterIdRef.current;
    if (!draggedChapterId || draggedChapterId === targetChapterId) {
      return;
    }

    event.preventDefault();
    event.dataTransfer.dropEffect = "move";

    const insertAfter = shouldInsertAfterHorizontal(event, event.currentTarget);
    setChapters((prev) =>
      reorderByIdWithInsertion(prev, draggedChapterId, targetChapterId, insertAfter),
    );
  };

  const handleItemDragOver = (
    event: DragEvent<HTMLDivElement>,
    chapterId: string,
    targetItemId: string,
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
            ? t("pages.courses.form.edit.subtitle")
            : t("pages.courses.form.create.subtitle")
        }
        maxWidth="lg"
        pinFooterToBottomOnMobile
        resetKey={isEditMode ? `${courseId ?? ""}-${isEditFormReady}` : undefined}
        footer={
          <ModalFooterActions
            actions={[
              {
                key: "close",
                isCloseButton: true,
                onClick: closeDialog,
                disabled: isSubmitting,
              },
              {
                key: "submit",
                label: isEditMode ? "ذخیره تغییرات" : "ایجاد دوره",
                onClick: () => void handleSubmit(),
                variant: "contained",
                color: "primary",
                icon: <AddRoundedIcon />,
                disabled: !canSubmit,
              },
            ]}
          />
        }
      >
        <Box sx={{ display: "grid", gap: "0.95rem" }}>
          {isEditMode && !isEditFormReady ? (
            <Stack alignItems="center" justifyContent="center" spacing={2} sx={{ minHeight: 320 }}>
              <CircularProgress />
              <Typography variant="body2" color="text.secondary">
                در حال دریافت اطلاعات دوره...
              </Typography>
            </Stack>
          ) : (
            <>
              <MainInfoSection
            title={title}
            onTitleChange={setTitle}
            description={description}
            onDescriptionChange={setDescription}
            coverImageFile={coverImageFile}
            onCoverImageFileChange={handleCoverImageFileChange}
            coverImageExistingFile={buildExistingFilePreview(
              coverImageAccessUrl,
              title.trim() || "کاور دوره",
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
              uploadProgressByFieldId[COURSE_COVER_UPLOAD_FIELD_ID],
            )}
            uploading={COURSE_COVER_UPLOAD_FIELD_ID in uploadProgressByFieldId}
          />

          <Divider />

          <ChaptersSection
            chapters={chapters}
            activeChapter={activeChapter}
            activeChapterIndex={activeChapterIndex}
            expandedItemByChapter={expandedItemByChapter}
            hasPositivePrice={hasPositivePrice}
            uploadProgressByFieldId={uploadProgressByFieldId}
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
            </>
          )}
        </Box>
      </EntityModalShell>
      <EntityConfirmDialogShell
        open={freeCourseConfirmOpen}
        onClose={() => setFreeCourseConfirmOpen(false)}
        title={isEditMode ? "تایید ویرایش دوره رایگان" : "تایید ایجاد دوره رایگان"}
        footer={
          <ModalFooterActions
            actions={[
              {
                key: "close",
                isCloseButton: true,
                onClick: () => setFreeCourseConfirmOpen(false),
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

export default CourseFormDialog;
