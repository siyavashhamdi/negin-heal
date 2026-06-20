import { useEffect, useMemo, useState, type ReactElement } from "react";
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
import EntityConfirmDialogShell from "../../shared/crud/EntityConfirmDialogShell";
import EntityModalShell from "../../shared/crud/EntityModalShell";
import { COURSE_CREATE_MUTATION } from "../../graphql/mutations/courseCreate.mutation";
import { COURSE_UPDATE_MUTATION } from "../../graphql/mutations/courseUpdate.mutation";
import { COURSE_DETAIL_QUERY } from "../../graphql/queries/courseDetail.query";
import ChaptersSection from "./course-form-dialog/ChaptersSection";
import MainInfoSection from "./course-form-dialog/MainInfoSection";
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
import { uploadFile } from "../../utils/fileUpload.util";
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
  readonly chapterIconFileIdsByChapterId: Record<string, string>;
  readonly itemFileIdsByItemId: Record<string, string>;
};

type UploadTask = {
  readonly file: File;
  readonly errorMessage: string;
  readonly applyFileId: (uploadedFileId: string, files: UploadedCourseFiles) => UploadedCourseFiles;
};

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
    iconFile: null,
    iconAccessUrl: null,
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
      iconFile: null,
      iconAccessUrl: chapter.iconAccessUrl ?? null,
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

function reorderById<T extends { id: string }>(
  items: T[],
  draggedId: string,
  targetId: string,
): T[] {
  if (draggedId === targetId) {
    return items;
  }
  const draggedIndex = items.findIndex((item) => item.id === draggedId);
  const targetIndex = items.findIndex((item) => item.id === targetId);
  if (draggedIndex < 0 || targetIndex < 0) {
    return items;
  }

  const copy = [...items];
  const [dragged] = copy.splice(draggedIndex, 1);
  if (!dragged) {
    return items;
  }
  copy.splice(targetIndex, 0, dragged);
  return copy;
}

const CourseFormDialog = ({
  open,
  onClose,
  onSaved,
  courseId,
}: CourseFormDialogProps): ReactElement => {
  const { showError } = useSnackbar();
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
  const [draggedChapterId, setDraggedChapterId] = useState<string | null>(null);
  const [draggedItemId, setDraggedItemId] = useState<string | null>(null);
  const [freeCourseConfirmOpen, setFreeCourseConfirmOpen] = useState(false);
  const [expandedItemByChapter, setExpandedItemByChapter] = useState<Record<string, string | null>>(
    () => {
      const firstChapter = chapters[0];
      return firstChapter ? { [firstChapter.id]: firstChapter.items[0]?.id ?? null } : {};
    },
  );

  const activeChapterIndex = useMemo(
    () => chapters.findIndex((chapter) => chapter.id === activeChapterId),
    [activeChapterId, chapters],
  );
  const activeChapter = activeChapterIndex >= 0 ? chapters[activeChapterIndex] : undefined;
  const parsedPriceIrt = parseOptionalNumber(priceIrt);
  const hasPositivePrice = parsedPriceIrt != null && parsedPriceIrt > 0;

  const applyFormState = (nextCourse?: CourseEditRecord | null): void => {
    const nextChapters = nextCourse ? createDraftChaptersFromCourse(nextCourse) : [createDraftChapter()];
    const activeDraftChapter = getLastChapter(nextChapters) ?? createDraftChapter();
    setTitle(nextCourse?.title ?? "");
    setDescription(nextCourse?.description ?? "");
    setCoverImageFile(null);
    setCoverImageAccessUrl(nextCourse?.coverImageAccessUrl ?? null);
    setPriceIrt(
      typeof nextCourse?.priceIrt === "number"
        ? formatIntegerWithThousands(String(nextCourse.priceIrt))
        : "",
    );
    setTags(nextCourse?.tags ?? []);
    setIsActive(nextCourse?.isActive ?? false);
    setDiscountEnabled(nextCourse?.discount != null);
    setDiscountKind(nextCourse?.discount?.type ?? "PERCENTAGE");
    setDiscountValue(
      nextCourse?.discount
        ? nextCourse.discount.type === "PERCENTAGE"
          ? sanitizePercentageValue(String(nextCourse.discount.value))
          : formatIntegerWithThousands(String(nextCourse.discount.value))
        : "",
    );
    setChapters(nextChapters);
    setActiveChapterId(activeDraftChapter.id);
    setExpandedItemByChapter({ [activeDraftChapter.id]: getLastItemId(activeDraftChapter) });
  };

  const resetForm = (): void => {
    applyFormState(null);
  };

  const closeDialog = (): void => {
    setFreeCourseConfirmOpen(false);
    onClose();
    resetForm();
  };

  useEffect(() => {
    if (!open) {
      return;
    }
    if (!isEditMode) {
      applyFormState(null);
      return;
    }
    if (detailCourse) {
      applyFormState(detailCourse);
    }
  }, [detailCourse, isEditMode, open]);

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
  const isSubmitting =
    createCourseResult.loading ||
    updateCourseResult.loading ||
    isUploadingFiles;
  const isEditFormReady = !isEditMode || (detailCourse != null && !detailLoading);
  const canSubmit = isEditFormReady && !isSubmitting;

  const uploadAndGetFileId = async (file: File): Promise<string | null> => {
    try {
      const result = await uploadFile(file);
      return getFileIdFromAccessUrl(result.accessUrl);
    } catch {
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
        file: coverImageFile,
        errorMessage: "آپلود فایل کاور انجام نشد.",
        applyFileId: (uploadedFileId, files) => ({
          ...files,
          coverImageFileId: uploadedFileId,
        }),
      });
    }

    for (const chapter of chapters) {
      if (chapter.iconFile) {
        uploadTasks.push({
          file: chapter.iconFile,
          errorMessage: "آپلود آیکن فصل انجام نشد.",
          applyFileId: (uploadedFileId, files) => ({
            ...files,
            chapterIconFileIdsByChapterId: {
              ...files.chapterIconFileIdsByChapterId,
              [chapter.id]: uploadedFileId,
            },
          }),
        });
      }

      for (const item of chapter.items) {
        if (item.contentType === "FILE" && item.file) {
          uploadTasks.push({
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
        uploadedFileId: await uploadAndGetFileId(task.file),
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
        chapterIconFileIdsByChapterId: {},
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
        iconFileId:
          uploadedFiles.chapterIconFileIdsByChapterId[chapter.id] ||
          getFileIdFromAccessUrl(chapter.iconAccessUrl) ||
          undefined,
        visibleAfterMinutes: parseVisibleAfterMinutes(
          chapter.visibleAfterMinutes,
          chapter.visibleAfterUnit,
        ),
        isFree: hasPositivePrice ? chapter.isFree : false,
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
    let uploadedFiles: UploadedCourseFiles | null = null;
    try {
      uploadedFiles = await uploadSelectedFiles();
    } finally {
      setIsUploadingFiles(false);
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
      priceIrt: parsedPriceIrt,
      isActive,
      tags,
      chapters: chapterInputs,
    };

    if (discountEnabled && hasPositivePrice && parsedDiscountValue != null) {
      input.discount = {
        type: discountKind,
        value: parsedDiscountValue,
      };
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

  const handleChapterDragOver = (targetChapterId: string): void => {
    if (!draggedChapterId || draggedChapterId === targetChapterId) {
      return;
    }
    setChapters((prev) => reorderById(prev, draggedChapterId, targetChapterId));
  };

  const handleItemDragOver = (chapterId: string, targetItemId: string): void => {
    if (!draggedItemId || draggedItemId === targetItemId) {
      return;
    }
    mapChapterById(chapterId, (chapter) => ({
      ...chapter,
      items: reorderById(chapter.items, draggedItemId, targetItemId),
    }));
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
        onClose={() => (isSubmitting ? undefined : closeDialog())}
        title={isEditMode ? "ویرایش دوره" : "دوره جدید"}
        maxWidth="lg"
        pinFooterToBottomOnMobile
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
            onCoverImageFileChange={setCoverImageFile}
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
          />

          <Divider />

          <ChaptersSection
            chapters={chapters}
            activeChapter={activeChapter}
            activeChapterIndex={activeChapterIndex}
            expandedItemByChapter={expandedItemByChapter}
            hasPositivePrice={hasPositivePrice}
            onAddChapter={addChapter}
            onSelectChapterIndex={handleSelectChapterIndex}
            onSetDraggedChapterId={setDraggedChapterId}
            onChapterDragOver={handleChapterDragOver}
            onRemoveChapter={removeChapter}
            onUpdateChapter={updateChapter}
            onSetExpandedItemByChapter={handleSetExpandedItem}
            onSetDraggedItemId={setDraggedItemId}
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
