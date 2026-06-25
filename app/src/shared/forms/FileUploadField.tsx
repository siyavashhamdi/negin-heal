import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
  type KeyboardEvent,
  type ReactElement,
  type SyntheticEvent,
} from "react";
import { Box, IconButton, LinearProgress, Typography, useMediaQuery } from "@mui/material";
import {
  ArticleRounded,
  AudiotrackRounded,
  CloseFullscreenOutlined,
  CloudUploadOutlined,
  CompressRounded,
  DeleteOutline,
  FileDownloadOutlined,
  ImageRounded,
  InsertDriveFileRounded,
  MovieRounded,
  OpenInFullOutlined,
  PauseRounded,
  PictureAsPdfRounded,
  PlayArrowRounded,
  VisibilityOutlined,
} from "@mui/icons-material";
import {
  getViewableMediaKind,
  isExecutableFileType,
  buildPdfEmbedUrl,
  type ExistingFilePreview,
  type FileAccessUrl,
} from "../../utils/fileAccessUrl.util";
import {
  formatTruncatedFileName,
  formatUploadFileSize,
  validateSelectedUploadFile,
} from "../../utils/fileUploadValidation.util";
import { isEndUserRole } from "../../utils/authRole.util";
import { useAuth } from "../../contexts/AuthContext";
import { useCachedFileUrl } from "../../hooks/useCachedFileAccessUrl";
import { useMobileDialogProps } from "../../hooks/useMobileDialogProps";
import { useMaxRoutePreview } from "../../hooks/useMaxRoutePreview";
import { useCompressMediaRoute } from "../../hooks/useCompressMediaRoute";
import EntityModalShell from "../crud/EntityModalShell";
import ModalFooterActions from "../crud/ModalFooterActions";
import MediaCompressDialog from "./MediaCompressDialog";
import type { MediaCompressDialogSource } from "./media-compression.api";
import styles from "./FileUploadField.module.scss";

export type FileUploadPreviewAction = "play" | "view" | "download" | "maximize" | "remove";

export type FileUploadPreviewActionContext = {
  mediaKind: "image" | "video" | "audio" | "pdf" | "text" | null;
};

export type FileUploadPreviewActionAccess =
  | Partial<Record<FileUploadPreviewAction, boolean>>
  | ((action: FileUploadPreviewAction, context: FileUploadPreviewActionContext) => boolean);

interface FilePreviewSource {
  name: string;
  mimeType: string;
  sizeBytes: number;
  previewUrl?: string | null;
}

interface FileUploadFieldProps {
  label: string;
  file: File | null;
  onChange: (file: File | null) => void;
  existingFile?: ExistingFilePreview | null;
  onExistingFileClear?: () => void;
  accept: string;
  allowedFormatsLabel: string;
  maxSizeLabel: string;
  maxSizeBytes?: number;
  dropTitle: string;
  mobileDropTitle?: string;
  dropHint: string;
  mobileDropHint?: string;
  removeLabel: string;
  maximizeLabel?: string;
  minimizeLabel?: string;
  playLabel?: string;
  pauseLabel?: string;
  downloadLabel?: string;
  viewLabel?: string;
  invalidLabel: string;
  error?: boolean;
  required?: boolean;
  fullWidth?: boolean;
  readOnly?: boolean;
  hideLabel?: boolean;
  previewActionAccess?: FileUploadPreviewActionAccess;
  /** Stable id for `/max` route ownership (auto-generated when omitted). */
  previewId?: string;
  previewDialogOpen?: boolean;
  onPreviewDialogOpen?: () => void;
  onPreviewDialogClose?: () => void;
  uploading?: boolean;
  uploadProgress?: number | null;
  uploadingLabel?: string;
  enableMediaCompress?: boolean;
  mediaCompressFileId?: string | null;
  onMediaCompressSuccess?: (fileAccessUrl: FileAccessUrl) => void;
  mediaCompressLabel?: string;
}

function isImageMimeType(mimeType: string): boolean {
  return mimeType.startsWith("image/");
}

function isVideoMimeType(mimeType: string): boolean {
  return mimeType.startsWith("video/");
}

function triggerFileDownload(url: string, fileName: string): void {
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.rel = "noopener";
  link.target = "_blank";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function getFileIcon(mimeType: string): ReactElement {
  if (isImageMimeType(mimeType)) {
    return <ImageRounded fontSize="large" />;
  }
  if (isVideoMimeType(mimeType)) {
    return <MovieRounded fontSize="large" />;
  }
  if (mimeType.startsWith("audio/")) {
    return <AudiotrackRounded fontSize="large" />;
  }
  if (mimeType === "application/pdf") {
    return <PictureAsPdfRounded fontSize="large" />;
  }
  if (mimeType.startsWith("text/")) {
    return <ArticleRounded fontSize="large" />;
  }
  return <InsertDriveFileRounded fontSize="large" />;
}

function pauseMediaElement(element: HTMLMediaElement | null): void {
  if (!element || element.paused) {
    return;
  }
  element.pause();
}

const FileUploadField = ({
  label,
  file,
  onChange,
  existingFile,
  onExistingFileClear,
  accept,
  allowedFormatsLabel,
  maxSizeLabel,
  maxSizeBytes,
  dropTitle,
  mobileDropTitle,
  dropHint,
  mobileDropHint,
  removeLabel,
  maximizeLabel = "بزرگ‌نمایی",
  minimizeLabel = "کوچک‌نمایی",
  playLabel = "پخش",
  pauseLabel = "توقف",
  downloadLabel = "دانلود",
  viewLabel = "مشاهده",
  invalidLabel,
  error = false,
  required = false,
  fullWidth = false,
  readOnly = false,
  hideLabel = false,
  previewActionAccess,
  previewId,
  previewDialogOpen,
  onPreviewDialogOpen,
  onPreviewDialogClose,
  uploading = false,
  uploadProgress = null,
  uploadingLabel = "در حال آپلود...",
  enableMediaCompress = false,
  mediaCompressFileId = null,
  onMediaCompressSuccess,
  mediaCompressLabel = "فشرده‌سازی",
}: FileUploadFieldProps): ReactElement => {
  const { user } = useAuth();
  const restrictDownloadForEndUser = useMemo(
    () => user != null && isEndUserRole(user.roles),
    [user]
  );
  const nativeMediaControlsList = restrictDownloadForEndUser ? "nodownload" : undefined;
  const { isCompact } = useMobileDialogProps();
  const isMobile = useMediaQuery("(max-width:600px)");
  const inputId = useId();
  const maxRouteOwnerId = previewId?.trim() || inputId;
  const inputRef = useRef<HTMLInputElement | null>(null);
  const inlineVideoRef = useRef<HTMLVideoElement | null>(null);
  const inlineAudioRef = useRef<HTMLAudioElement | null>(null);
  const popupVideoRef = useRef<HTMLVideoElement | null>(null);
  const popupAudioRef = useRef<HTMLAudioElement | null>(null);
  const [isDragActive, setIsDragActive] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isPlayingInline, setIsPlayingInline] = useState(false);
  const [textPreviewContent, setTextPreviewContent] = useState<string | null>(null);
  const [textPreviewLoading, setTextPreviewLoading] = useState(false);
  const [textPreviewError, setTextPreviewError] = useState<string | null>(null);
  const [hasPickError, setHasPickError] = useState(false);
  const [pickErrorMessage, setPickErrorMessage] = useState<string | null>(null);
  const selectedPreviewUrl = useMemo(() => (file ? URL.createObjectURL(file) : undefined), [file]);
  const { url: cachedExistingPreviewUrl } = useCachedFileUrl({
    fileId: existingFile?.fileId,
    networkUrl: existingFile?.accessUrl,
    mimeType: existingFile?.mimeType,
    fileName: existingFile?.name,
    enabled: file == null && existingFile != null,
  });
  const effectiveDropTitle = isMobile ? mobileDropTitle : dropTitle;
  const effectiveDropHint = isMobile ? mobileDropHint : dropHint;

  useEffect(() => {
    return () => {
      if (selectedPreviewUrl) {
        URL.revokeObjectURL(selectedPreviewUrl);
      }
    };
  }, [selectedPreviewUrl]);

  const selectedFileSource: FilePreviewSource | undefined = file
    ? {
        name: file.name,
        mimeType: file.type || "application/octet-stream",
        sizeBytes: file.size,
        previewUrl: selectedPreviewUrl,
      }
    : undefined;

  const existingFileSource: FilePreviewSource | undefined =
    file == null && existingFile
      ? {
          name: existingFile.name,
          mimeType: existingFile.mimeType,
          sizeBytes: existingFile.sizeBytes,
          previewUrl: cachedExistingPreviewUrl ?? existingFile.accessUrl,
        }
      : undefined;
  const previewSource = selectedFileSource ?? existingFileSource;
  const isBlockedFile =
    previewSource != null && isExecutableFileType(previewSource.mimeType, previewSource.name);
  const hasFile = previewSource != null;
  const previewMediaKind =
    previewSource && !isBlockedFile
      ? getViewableMediaKind(previewSource.mimeType, previewSource.name)
      : null;
  const previewUrl = previewSource?.previewUrl ?? null;
  const pdfDialogUrl = useMemo((): string | null => {
    if (!previewUrl || previewMediaKind !== "pdf") {
      return null;
    }

    return readOnly ? buildPdfEmbedUrl(previewUrl) : previewUrl;
  }, [previewMediaKind, previewUrl, readOnly]);
  const supportsMaximize =
    previewMediaKind === "image" || previewMediaKind === "video" || previewMediaKind === "audio";
  const supportsViewPopup = previewMediaKind === "pdf" || previewMediaKind === "text";
  const supportsInlinePlay = previewMediaKind === "video" || previewMediaKind === "audio";
  const isPreviewControlled = onPreviewDialogOpen != null && onPreviewDialogClose != null;
  const canUseMaxRoute =
    !readOnly && (supportsMaximize || supportsViewPopup) && !isPreviewControlled;
  const maxRoutePreview = useMaxRoutePreview(maxRouteOwnerId, canUseMaxRoute);
  const internalPreviewDialogOpen =
    (isMaximized && supportsMaximize) || (isViewOpen && supportsViewPopup);
  const usesUrlMaxRoute = canUseMaxRoute && !isPreviewControlled;
  const isPreviewDialogOpen = usesUrlMaxRoute
    ? maxRoutePreview.isOpen
    : isPreviewControlled
      ? Boolean(previewDialogOpen)
      : internalPreviewDialogOpen;
  const isMaximizeDialogActive = usesUrlMaxRoute
    ? maxRoutePreview.isOpen && supportsMaximize
    : isPreviewControlled
      ? Boolean(previewDialogOpen && supportsMaximize)
      : isMaximized;
  const isViewDialogActive = usesUrlMaxRoute
    ? maxRoutePreview.isOpen && supportsViewPopup
    : isPreviewControlled
      ? Boolean(previewDialogOpen && supportsViewPopup)
      : isViewOpen;
  const canShowMediaCompressAction =
    enableMediaCompress &&
    Boolean(mediaCompressFileId?.trim()) &&
    file == null &&
    existingFile != null &&
    (previewMediaKind === "video" || previewMediaKind === "audio") &&
    Boolean(onMediaCompressSuccess);
  const mediaCompressSource = useMemo((): MediaCompressDialogSource | null => {
    if (!canShowMediaCompressAction || !existingFile || !mediaCompressFileId) {
      return null;
    }

    return {
      fileId: mediaCompressFileId.trim(),
      fileName: existingFile.name,
      mimeType: existingFile.mimeType,
      mediaKind: previewMediaKind === "audio" ? "audio" : "video",
      previewUrl: cachedExistingPreviewUrl ?? existingFile.accessUrl,
      sizeBytes: existingFile.sizeBytes,
    };
  }, [
    canShowMediaCompressAction,
    cachedExistingPreviewUrl,
    existingFile,
    mediaCompressFileId,
    previewMediaKind,
  ]);
  const compressMediaRoute = useCompressMediaRoute(maxRouteOwnerId, canShowMediaCompressAction);
  const isMediaCompressOpen = compressMediaRoute.isOpen;

  const openPreviewDialog = useCallback((): void => {
    if (usesUrlMaxRoute) {
      maxRoutePreview.open();
      return;
    }
    if (isPreviewControlled) {
      onPreviewDialogOpen?.();
      return;
    }
    if (supportsMaximize) {
      setIsMaximized(true);
      return;
    }
    if (supportsViewPopup) {
      setIsViewOpen(true);
    }
  }, [
    isPreviewControlled,
    maxRoutePreview,
    onPreviewDialogOpen,
    supportsMaximize,
    supportsViewPopup,
    usesUrlMaxRoute,
  ]);

  const closePreviewDialog = useCallback((): void => {
    if (usesUrlMaxRoute) {
      if (maxRoutePreview.isOpen) {
        maxRoutePreview.close();
      }
      return;
    }
    if (isPreviewControlled) {
      onPreviewDialogClose?.();
      return;
    }
    setIsMaximized(false);
    setIsViewOpen(false);
  }, [isPreviewControlled, maxRoutePreview, onPreviewDialogClose, usesUrlMaxRoute]);

  const isPreviewActionEnabled = useCallback(
    (action: FileUploadPreviewAction): boolean => {
      if (isBlockedFile && action !== "remove") {
        return false;
      }

      if (restrictDownloadForEndUser && action === "download" && previewMediaKind != null) {
        return false;
      }

      if (previewActionAccess) {
        if (typeof previewActionAccess === "function") {
          if (!previewActionAccess(action, { mediaKind: previewMediaKind })) {
            return false;
          }
        } else if (previewActionAccess[action] === false) {
          return false;
        }
      }

      switch (action) {
        case "play":
          return supportsInlinePlay;
        case "view":
          return supportsViewPopup;
        case "download":
          return previewUrl != null;
        case "maximize":
          return supportsMaximize;
        case "remove":
          return !readOnly;
        default:
          return false;
      }
    },
    [
      isBlockedFile,
      previewActionAccess,
      previewMediaKind,
      previewUrl,
      readOnly,
      restrictDownloadForEndUser,
      supportsInlinePlay,
      supportsMaximize,
      supportsViewPopup,
    ]
  );

  useEffect(() => {
    if (!usesUrlMaxRoute && !isPreviewControlled) {
      setIsMaximized(false);
      setIsViewOpen(false);
    }
    setIsPlayingInline(false);
    setTextPreviewContent(null);
    setTextPreviewLoading(false);
    setTextPreviewError(null);
    setHasPickError(false);
  }, [isPreviewControlled, previewUrl, previewMediaKind, usesUrlMaxRoute]);

  useEffect(() => {
    if (!isViewDialogActive || previewMediaKind !== "text") {
      return;
    }

    let cancelled = false;

    const loadTextPreview = async (): Promise<void> => {
      setTextPreviewLoading(true);
      setTextPreviewError(null);
      setTextPreviewContent(null);

      try {
        if (file) {
          const text = await file.text();
          if (!cancelled) {
            setTextPreviewContent(text);
          }
          return;
        }

        if (!previewUrl) {
          throw new Error("missing preview url");
        }

        const response = await fetch(previewUrl);
        if (!response.ok) {
          throw new Error("failed to fetch text");
        }

        const text = await response.text();
        if (!cancelled) {
          setTextPreviewContent(text);
        }
      } catch {
        if (!cancelled) {
          setTextPreviewError("امکان نمایش متن فایل وجود ندارد.");
        }
      } finally {
        if (!cancelled) {
          setTextPreviewLoading(false);
        }
      }
    };

    void loadTextPreview();

    return () => {
      cancelled = true;
    };
  }, [file, isViewDialogActive, previewMediaKind, previewUrl]);

  useEffect(() => {
    if (!isMaximizeDialogActive) {
      pauseMediaElement(popupVideoRef.current);
      pauseMediaElement(popupAudioRef.current);
      return;
    }

    pauseMediaElement(inlineVideoRef.current);
    pauseMediaElement(inlineAudioRef.current);
    setIsPlayingInline(false);

    if (previewMediaKind === "video") {
      void popupVideoRef.current?.play().catch(() => undefined);
      return;
    }

    if (previewMediaKind === "audio") {
      void popupAudioRef.current?.play().catch(() => undefined);
    }
  }, [isMaximizeDialogActive, previewMediaKind]);

  const handlePick = useCallback(
    (nextFile: File | null) => {
      if (nextFile != null) {
        const validation = validateSelectedUploadFile(nextFile, {
          accept,
          maxSizeBytes: maxSizeBytes ?? Number.MAX_SAFE_INTEGER,
          allowedFormatsLabel,
        });
        if (!validation.valid) {
          setHasPickError(true);
          setPickErrorMessage(validation.message);
          return;
        }
      }

      setHasPickError(false);
      setPickErrorMessage(null);
      onChange(nextFile);
    },
    [accept, allowedFormatsLabel, maxSizeBytes, onChange]
  );

  const handleInputChange = (event: ChangeEvent<HTMLInputElement>): void => {
    const picked = event.target.files?.[0] ?? null;
    handlePick(picked);
    event.target.value = "";
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>): void => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragActive(false);
    const picked = event.dataTransfer.files?.[0] ?? null;
    handlePick(picked);
  };

  const handleDragEnter = (event: DragEvent<HTMLDivElement>): void => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragActive(true);
  };

  const handleDragOver = (event: DragEvent<HTMLDivElement>): void => {
    event.preventDefault();
    event.stopPropagation();
    event.dataTransfer.dropEffect = "copy";
    setIsDragActive(true);
  };

  const handleDragLeave = (event: DragEvent<HTMLDivElement>): void => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragActive(false);
  };

  const stopActionEvent = (event: SyntheticEvent): void => {
    event.stopPropagation();
  };

  const handleRemove = (event: SyntheticEvent): void => {
    if (uploading) {
      return;
    }
    stopActionEvent(event);
    pauseMediaElement(inlineVideoRef.current);
    pauseMediaElement(inlineAudioRef.current);
    pauseMediaElement(popupVideoRef.current);
    pauseMediaElement(popupAudioRef.current);
    closePreviewDialog();
    setIsPlayingInline(false);
    setHasPickError(false);
    setPickErrorMessage(null);
    if (file != null) {
      handlePick(null);
      return;
    }
    onExistingFileClear?.();
  };

  const handleToggleMaximize = (event: SyntheticEvent): void => {
    stopActionEvent(event);
    if (usesUrlMaxRoute || isPreviewControlled) {
      if (isPreviewDialogOpen) {
        closePreviewDialog();
      } else {
        openPreviewDialog();
      }
      return;
    }
    setIsMaximized((open) => !open);
  };

  const handleTogglePlay = (event: SyntheticEvent): void => {
    stopActionEvent(event);
    const mediaElement =
      previewMediaKind === "video" ? inlineVideoRef.current : inlineAudioRef.current;
    if (!mediaElement) {
      return;
    }

    if (mediaElement.paused) {
      void mediaElement.play().catch(() => undefined);
      return;
    }

    mediaElement.pause();
  };

  const handleToggleView = (event: SyntheticEvent): void => {
    stopActionEvent(event);
    if (usesUrlMaxRoute || isPreviewControlled) {
      if (isPreviewDialogOpen) {
        closePreviewDialog();
      } else {
        openPreviewDialog();
      }
      return;
    }
    setIsViewOpen((open) => !open);
  };

  const handleClosePreviewDialog = (): void => {
    closePreviewDialog();
  };

  const handleDownload = (event: SyntheticEvent): void => {
    stopActionEvent(event);
    if (!previewUrl || !previewSource) {
      return;
    }
    triggerFileDownload(previewUrl, previewSource.name);
  };

  const handleOpenMediaCompress = (event: SyntheticEvent): void => {
    stopActionEvent(event);
    if (!canShowMediaCompressAction) {
      return;
    }
    if (isPreviewDialogOpen) {
      closePreviewDialog();
    }
    compressMediaRoute.open();
  };

  const handleCloseMediaCompress = (): void => {
    compressMediaRoute.close();
  };

  const handleInlinePlay = (): void => {
    setIsPlayingInline(true);
  };

  const handleInlinePause = (): void => {
    setIsPlayingInline(false);
  };

  const openPicker = (): void => {
    if (readOnly) {
      return;
    }
    inputRef.current?.click();
  };

  const openReadOnlyPreview = (): void => {
    if (supportsMaximize || supportsViewPopup) {
      openPreviewDialog();
    }
  };

  const handleDropzoneClick = (): void => {
    if (uploading) {
      return;
    }
    if (readOnly) {
      if (hasFile) {
        openReadOnlyPreview();
      }
      return;
    }
    openPicker();
  };

  const handleDropzoneKeyDown = (event: KeyboardEvent<HTMLDivElement>): void => {
    if (event.key !== "Enter" && event.key !== " ") {
      return;
    }
    event.preventDefault();
    if (uploading) {
      return;
    }
    if (readOnly) {
      if (hasFile) {
        openReadOnlyPreview();
      }
      return;
    }
    openPicker();
  };

  const renderPreviewContent = (): ReactElement => {
    if (!previewSource || !previewUrl) {
      return <Box className={styles.previewIcon}>{getFileIcon("application/octet-stream")}</Box>;
    }

    if (previewMediaKind === "image") {
      return (
        <Box
          component="img"
          src={previewUrl}
          alt={previewSource.name}
          className={[styles.previewMedia, readOnly ? styles.previewMediaReadOnly : ""]
            .filter(Boolean)
            .join(" ")}
        />
      );
    }

    if (previewMediaKind === "video") {
      return (
        <Box
          component="video"
          ref={inlineVideoRef}
          src={previewUrl}
          className={[styles.previewMedia, readOnly ? styles.previewMediaReadOnly : ""]
            .filter(Boolean)
            .join(" ")}
          playsInline
          preload="metadata"
          onPlay={handleInlinePlay}
          onPause={handleInlinePause}
          onEnded={handleInlinePause}
        />
      );
    }

    if (previewMediaKind === "audio") {
      return (
        <>
          <Box className={styles.previewIcon}>{getFileIcon(previewSource.mimeType)}</Box>
          <Box
            component="audio"
            ref={inlineAudioRef}
            src={previewUrl}
            className={styles.offscreenMedia}
            preload="metadata"
            controlsList={nativeMediaControlsList}
            onPlay={handleInlinePlay}
            onPause={handleInlinePause}
            onEnded={handleInlinePause}
          />
        </>
      );
    }

    return <Box className={styles.previewIcon}>{getFileIcon(previewSource.mimeType)}</Box>;
  };

  if (readOnly && !hasFile) {
    return <></>;
  }

  return (
    <Box className={[styles.root, fullWidth ? styles.rootFullWidth : ""].filter(Boolean).join(" ")}>
      {!hideLabel ? (
        <span className={styles.label}>
          {label}
          {required ? <span className={styles.requiredMark}> *</span> : null}
        </span>
      ) : null}
      <Box
        role={readOnly ? (hasFile ? "button" : undefined) : "button"}
        tabIndex={readOnly ? (hasFile ? 0 : undefined) : 0}
        className={[
          styles.dropzone,
          error ? styles.dropzoneError : "",
          hasPickError ? styles.dropzoneError : "",
          hasFile ? styles.dropzoneHasFile : "",
          isDragActive ? styles.dropzoneDragActive : "",
          uploading ? styles.dropzoneUploading : "",
          fullWidth ? styles.dropzoneFullWidth : "",
          readOnly ? styles.dropzoneReadOnly : "",
          readOnly && hasFile && (supportsMaximize || supportsViewPopup)
            ? styles.dropzoneReadOnlyPreviewable
            : "",
        ]
          .filter(Boolean)
          .join(" ")}
        onClick={handleDropzoneClick}
        onKeyDown={handleDropzoneKeyDown}
        onDragEnter={readOnly ? undefined : handleDragEnter}
        onDragOver={readOnly ? undefined : handleDragOver}
        onDragLeave={readOnly ? undefined : handleDragLeave}
        onDrop={readOnly ? undefined : handleDrop}
      >
        {previewSource == null ? (
          <>
            <CloudUploadOutlined className={styles.icon} aria-hidden />
            {effectiveDropTitle ? (
              <Typography variant="body2" className={styles.title}>
                {effectiveDropTitle}
              </Typography>
            ) : null}
            {effectiveDropHint ? (
              <Typography variant="caption" className={styles.meta}>
                {effectiveDropHint}
              </Typography>
            ) : null}
            <Box className={styles.rules}>
              <Typography variant="caption" className={styles.rule}>
                {allowedFormatsLabel}
              </Typography>
              <Typography variant="caption" className={styles.rule}>
                {maxSizeLabel}
              </Typography>
            </Box>
          </>
        ) : (
          <Box className={styles.filePreview}>
            <Box className={styles.previewStage}>
              {renderPreviewContent()}
              <Box className={styles.fileOverlay}>
                <Box
                  className={[styles.fileRow, readOnly ? styles.fileRowReadOnly : ""]
                    .filter(Boolean)
                    .join(" ")}
                >
                  {!readOnly ? (
                    <Box className={styles.fileInfo}>
                      <Typography
                        variant="body2"
                        className={styles.fileName}
                        title={previewSource.name}
                      >
                        {formatTruncatedFileName(previewSource.name)}
                      </Typography>
                      <Typography variant="caption" className={styles.meta}>
                        {formatUploadFileSize(previewSource.sizeBytes)}
                      </Typography>
                    </Box>
                  ) : null}
                  <Box className={styles.fileActions}>
                    {isPreviewActionEnabled("play") ? (
                      <IconButton
                        size="small"
                        color="primary"
                        aria-label={isPlayingInline ? pauseLabel : playLabel}
                        onClick={handleTogglePlay}
                      >
                        {isPlayingInline ? (
                          <PauseRounded fontSize="small" />
                        ) : (
                          <PlayArrowRounded fontSize="small" />
                        )}
                      </IconButton>
                    ) : null}
                    {isPreviewActionEnabled("view") ? (
                      <IconButton
                        size="small"
                        color="primary"
                        aria-label={viewLabel}
                        onClick={handleToggleView}
                      >
                        <VisibilityOutlined fontSize="small" />
                      </IconButton>
                    ) : null}
                    {isPreviewActionEnabled("download") ? (
                      <IconButton
                        size="small"
                        color="primary"
                        aria-label={downloadLabel}
                        onClick={handleDownload}
                      >
                        <FileDownloadOutlined fontSize="small" />
                      </IconButton>
                    ) : null}
                    {isPreviewActionEnabled("maximize") ? (
                      <IconButton
                        size="small"
                        color="primary"
                        aria-label={isMaximizeDialogActive ? minimizeLabel : maximizeLabel}
                        onClick={handleToggleMaximize}
                      >
                        {isMaximizeDialogActive ? (
                          <CloseFullscreenOutlined fontSize="small" />
                        ) : (
                          <OpenInFullOutlined fontSize="small" />
                        )}
                      </IconButton>
                    ) : null}
                    {canShowMediaCompressAction ? (
                      <IconButton
                        size="small"
                        color="secondary"
                        aria-label={mediaCompressLabel}
                        onClick={handleOpenMediaCompress}
                        disabled={uploading}
                      >
                        <CompressRounded fontSize="small" />
                      </IconButton>
                    ) : null}
                    {isPreviewActionEnabled("remove") && !uploading ? (
                      <IconButton
                        size="small"
                        color="error"
                        aria-label={removeLabel}
                        onClick={handleRemove}
                      >
                        <DeleteOutline fontSize="small" />
                      </IconButton>
                    ) : null}
                  </Box>
                </Box>
              </Box>
            </Box>
          </Box>
        )}
        {uploading ? (
          <Box className={styles.uploadProgressOverlay} aria-live="polite">
            <LinearProgress
              variant={uploadProgress == null ? "indeterminate" : "determinate"}
              value={uploadProgress ?? 0}
              className={styles.uploadProgressBar}
            />
            <Typography variant="caption" className={styles.uploadProgressLabel}>
              {uploadingLabel}
              {uploadProgress != null ? ` ${uploadProgress}%` : ""}
            </Typography>
          </Box>
        ) : null}
      </Box>
      {!readOnly ? (
        <input
          ref={inputRef}
          id={inputId}
          type="file"
          className={styles.hiddenInput}
          accept={accept}
          onChange={handleInputChange}
        />
      ) : null}
      {error || hasPickError ? (
        <Typography variant="caption" color="error">
          {pickErrorMessage ?? invalidLabel}
        </Typography>
      ) : null}
      <EntityModalShell
        open={isPreviewDialogOpen && previewUrl != null}
        onClose={handleClosePreviewDialog}
        title={previewSource?.name ?? ""}
        titleClassName={styles.previewDialogLatinTitle}
        subtitle="پیش‌نمایش فایل انتخاب‌شده"
        maxWidth="lg"
        showVisibleScrollbar
        footer={
          <ModalFooterActions
            actions={[
              {
                key: "close",
                isCloseButton: true,
                onClick: handleClosePreviewDialog,
              },
            ]}
          />
        }
      >
        {previewUrl && previewMediaKind === "image" ? (
          <Box
            className={styles.previewDialogFrame}
            sx={{
              display: "grid",
              placeItems: "center",
              flex: isCompact ? 1 : undefined,
              minHeight: isCompact ? 0 : { xs: "18rem", md: "28rem" },
              width: "100%",
              borderRadius: isCompact ? 0 : 2,
              overflow: "hidden",
            }}
          >
            <Box
              component="img"
              src={previewUrl}
              alt={previewSource?.name ?? ""}
              sx={{
                display: "block",
                inlineSize: "100%",
                blockSize: isCompact ? "100%" : "auto",
                maxBlockSize: isCompact ? "100%" : "min(72vh, 46rem)",
                objectFit: "contain",
              }}
            />
          </Box>
        ) : null}
        {previewUrl && previewMediaKind === "video" ? (
          <Box
            className={styles.previewDialogFrame}
            sx={{
              display: "grid",
              placeItems: "center",
              flex: isCompact ? 1 : undefined,
              minHeight: isCompact ? 0 : { xs: "18rem", md: "28rem" },
              width: "100%",
              borderRadius: isCompact ? 0 : 2,
              overflow: "hidden",
            }}
          >
            <Box
              component="video"
              ref={popupVideoRef}
              src={previewUrl}
              controls
              controlsList={nativeMediaControlsList}
              playsInline
              sx={{
                display: "block",
                inlineSize: "100%",
                blockSize: isCompact ? "100%" : "auto",
                maxBlockSize: isCompact ? "100%" : "min(72vh, 46rem)",
                objectFit: "contain",
              }}
            />
          </Box>
        ) : null}
        {previewUrl && previewMediaKind === "audio" ? (
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 2,
              flex: isCompact ? 1 : undefined,
              minHeight: isCompact ? 0 : { xs: "12rem", md: "16rem" },
              width: "100%",
              px: 2,
              py: isCompact ? 2 : 3,
            }}
          >
            <AudiotrackRounded sx={{ fontSize: "4rem", color: "text.secondary" }} />
            <Box
              component="audio"
              ref={popupAudioRef}
              src={previewUrl}
              controls
              controlsList={nativeMediaControlsList}
              style={{ width: "100%", maxWidth: "32rem" }}
            />
          </Box>
        ) : null}
        {pdfDialogUrl ? (
          <Box
            className={[
              styles.previewDialogDocument,
              readOnly ? styles.previewDialogDocumentReadOnly : "",
            ]
              .filter(Boolean)
              .join(" ")}
          >
            <Box
              component="iframe"
              src={pdfDialogUrl}
              title={previewSource?.name ?? "PDF preview"}
              className={[
                styles.previewDialogDocumentBody,
                readOnly ? styles.previewDialogDocumentBodyReadOnly : "",
              ]
                .filter(Boolean)
                .join(" ")}
            />
          </Box>
        ) : null}
        {previewMediaKind === "text" ? (
          <Box className={styles.previewDialogDocument}>
            {textPreviewLoading ? (
              <Box className={styles.previewDialogDocumentState}>
                <Typography variant="body2" color="text.secondary">
                  در حال بارگذاری...
                </Typography>
              </Box>
            ) : null}
            {textPreviewError ? (
              <Box className={styles.previewDialogDocumentState}>
                <Typography variant="body2" color="error">
                  {textPreviewError}
                </Typography>
              </Box>
            ) : null}
            {!textPreviewLoading && !textPreviewError && textPreviewContent != null ? (
              <Box component="pre" className={styles.previewDialogDocumentText}>
                {textPreviewContent}
              </Box>
            ) : null}
          </Box>
        ) : null}
      </EntityModalShell>
      <MediaCompressDialog
        open={isMediaCompressOpen}
        source={mediaCompressSource}
        onClose={handleCloseMediaCompress}
        onSuccess={(fileAccessUrl) => {
          onMediaCompressSuccess?.(fileAccessUrl);
        }}
      />
    </Box>
  );
};

export default FileUploadField;
