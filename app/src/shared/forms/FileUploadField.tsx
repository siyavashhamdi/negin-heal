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
import { Box, IconButton, Typography, useMediaQuery } from "@mui/material";
import {
  ArticleRounded,
  AudiotrackRounded,
  CloseFullscreenOutlined,
  CloudUploadOutlined,
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
  type ExistingFilePreview,
} from "../../utils/fileAccessUrl.util";
import { useMobileDialogProps } from "../../hooks/useMobileDialogProps";
import EntityModalShell from "../crud/EntityModalShell";
import ModalFooterActions from "../crud/ModalFooterActions";
import styles from "./FileUploadField.module.scss";

export type FileUploadPreviewAction = "play" | "view" | "download" | "maximize" | "remove";

export type FileUploadPreviewActionContext = {
  mediaKind: "image" | "video" | "audio" | "pdf" | "text" | null;
};

export type FileUploadPreviewActionAccess =
  | Partial<Record<FileUploadPreviewAction, boolean>>
  | ((
      action: FileUploadPreviewAction,
      context: FileUploadPreviewActionContext,
    ) => boolean);

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
  optionalLabel?: string;
  fullWidth?: boolean;
  readOnly?: boolean;
  hideLabel?: boolean;
  previewActionAccess?: FileUploadPreviewActionAccess;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
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
  optionalLabel,
  fullWidth = false,
  readOnly = false,
  hideLabel = false,
  previewActionAccess,
}: FileUploadFieldProps): ReactElement => {
  const { isCompact } = useMobileDialogProps();
  const isMobile = useMediaQuery("(max-width:600px)");
  const inputId = useId();
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
  const selectedPreviewUrl = useMemo(() => (file ? URL.createObjectURL(file) : undefined), [file]);
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
          previewUrl: existingFile.accessUrl,
        }
      : undefined;
  const previewSource = selectedFileSource ?? existingFileSource;
  const isBlockedFile =
    previewSource != null &&
    isExecutableFileType(previewSource.mimeType, previewSource.name);
  const hasFile = previewSource != null;
  const previewMediaKind =
    previewSource && !isBlockedFile
      ? getViewableMediaKind(previewSource.mimeType, previewSource.name)
      : null;
  const previewUrl = previewSource?.previewUrl ?? null;
  const supportsMaximize =
    previewMediaKind === "image" ||
    previewMediaKind === "video" ||
    previewMediaKind === "audio";
  const supportsViewPopup =
    previewMediaKind === "pdf" || previewMediaKind === "text";
  const supportsReadOnlyPreview =
    readOnly && (supportsMaximize || supportsViewPopup);
  const supportsInlinePlay =
    previewMediaKind === "video" || previewMediaKind === "audio";
  const isPreviewDialogOpen =
    (isMaximized && supportsMaximize) || (isViewOpen && supportsViewPopup);

  const isPreviewActionEnabled = useCallback(
    (action: FileUploadPreviewAction): boolean => {
      if (isBlockedFile && action !== "remove") {
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
      supportsInlinePlay,
      supportsMaximize,
      supportsViewPopup,
    ],
  );

  useEffect(() => {
    setIsMaximized(false);
    setIsViewOpen(false);
    setIsPlayingInline(false);
    setTextPreviewContent(null);
    setTextPreviewLoading(false);
    setTextPreviewError(null);
    setHasPickError(false);
  }, [previewUrl, previewMediaKind]);

  useEffect(() => {
    if (!isViewOpen || previewMediaKind !== "text") {
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
  }, [file, isViewOpen, previewMediaKind, previewUrl]);

  useEffect(() => {
    if (!isMaximized) {
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
  }, [isMaximized, previewMediaKind]);

  const handlePick = useCallback(
    (nextFile: File | null) => {
      if (nextFile != null && isExecutableFileType(nextFile.type, nextFile.name)) {
        setHasPickError(true);
        return;
      }

      setHasPickError(false);
      onChange(nextFile);
    },
    [onChange],
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
    stopActionEvent(event);
    pauseMediaElement(inlineVideoRef.current);
    pauseMediaElement(inlineAudioRef.current);
    pauseMediaElement(popupVideoRef.current);
    pauseMediaElement(popupAudioRef.current);
    setIsMaximized(false);
    setIsViewOpen(false);
    setIsPlayingInline(false);
    setHasPickError(false);
    if (file != null) {
      handlePick(null);
      return;
    }
    onExistingFileClear?.();
  };

  const handleToggleMaximize = (event: SyntheticEvent): void => {
    stopActionEvent(event);
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
    setIsViewOpen((open) => !open);
  };

  const handleClosePreviewDialog = (): void => {
    setIsMaximized(false);
    setIsViewOpen(false);
  };

  const handleDownload = (event: SyntheticEvent): void => {
    stopActionEvent(event);
    if (!previewUrl || !previewSource) {
      return;
    }
    triggerFileDownload(previewUrl, previewSource.name);
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
    if (!supportsReadOnlyPreview) {
      return;
    }
    if (supportsMaximize) {
      setIsMaximized(true);
      return;
    }
    if (supportsViewPopup) {
      setIsViewOpen(true);
    }
  };

  const handleDropzoneClick = (): void => {
    if (readOnly) {
      openReadOnlyPreview();
      return;
    }
    openPicker();
  };

  const handleDropzoneKeyDown = (event: KeyboardEvent<HTMLDivElement>): void => {
    if (event.key !== "Enter" && event.key !== " ") {
      return;
    }
    event.preventDefault();
    if (readOnly) {
      openReadOnlyPreview();
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
          className={[
            styles.previewMedia,
            supportsReadOnlyPreview ? styles.previewMediaReadOnly : "",
          ]
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
          className={[
            styles.previewMedia,
            supportsReadOnlyPreview ? styles.previewMediaReadOnly : "",
          ]
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
          {!required && optionalLabel ? (
            <span className={styles.optionalMark}> {optionalLabel}</span>
          ) : null}
        </span>
      ) : null}
      <Box
        role={readOnly && !supportsReadOnlyPreview ? undefined : "button"}
        tabIndex={readOnly && !supportsReadOnlyPreview ? undefined : 0}
        className={[
          styles.dropzone,
          error ? styles.dropzoneError : "",
          hasPickError ? styles.dropzoneError : "",
          hasFile ? styles.dropzoneHasFile : "",
          isDragActive ? styles.dropzoneDragActive : "",
          fullWidth ? styles.dropzoneFullWidth : "",
          readOnly ? styles.dropzoneReadOnly : "",
          supportsReadOnlyPreview ? styles.dropzoneReadOnlyPreviewable : "",
        ]
          .filter(Boolean)
          .join(" ")}
        onClick={handleDropzoneClick}
        onKeyDown={readOnly && !supportsReadOnlyPreview ? undefined : handleDropzoneKeyDown}
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
                <Box className={styles.fileRow}>
                  <Box className={styles.fileInfo}>
                    <Typography variant="body2" className={styles.fileName}>
                      {previewSource.name}
                    </Typography>
                    <Typography variant="caption" className={styles.meta}>
                      {formatFileSize(previewSource.sizeBytes)}
                    </Typography>
                  </Box>
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
                        aria-label={isMaximized ? minimizeLabel : maximizeLabel}
                        onClick={handleToggleMaximize}
                      >
                        {isMaximized ? (
                          <CloseFullscreenOutlined fontSize="small" />
                        ) : (
                          <OpenInFullOutlined fontSize="small" />
                        )}
                      </IconButton>
                    ) : null}
                    {isPreviewActionEnabled("remove") ? (
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
          {invalidLabel}
        </Typography>
      ) : null}
      <EntityModalShell
        open={isPreviewDialogOpen && previewUrl != null}
        onClose={handleClosePreviewDialog}
        title={previewSource?.name ?? ""}
        maxWidth="lg"
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
                style={{ width: "100%", maxWidth: "32rem" }}
              />
            </Box>
          ) : null}
          {previewUrl && previewMediaKind === "pdf" ? (
            <Box
              sx={{
                display: "grid",
                placeItems: "center",
                flex: isCompact ? 1 : undefined,
                minHeight: isCompact ? 0 : { xs: "18rem", md: "28rem" },
                width: "100%",
                borderRadius: isCompact ? 0 : 2,
                bgcolor: "action.hover",
                overflow: "hidden",
              }}
            >
              <Box
                component="iframe"
                src={previewUrl}
                title={previewSource?.name ?? "PDF preview"}
                sx={{
                  display: "block",
                  inlineSize: "100%",
                  blockSize: isCompact ? "100%" : "min(72vh, 46rem)",
                  minBlockSize: isCompact ? 0 : { xs: "18rem", md: "28rem" },
                  border: 0,
                  bgcolor: "background.paper",
                }}
              />
            </Box>
          ) : null}
          {previewMediaKind === "text" ? (
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                flex: isCompact ? 1 : undefined,
                minHeight: isCompact ? 0 : { xs: "18rem", md: "28rem" },
                width: "100%",
                borderRadius: isCompact ? 0 : 2,
                bgcolor: "action.hover",
                overflow: "hidden",
              }}
            >
              {textPreviewLoading ? (
                <Box
                  sx={{
                    display: "grid",
                    placeItems: "center",
                    flex: 1,
                    minHeight: { xs: "18rem", md: "28rem" },
                  }}
                >
                  <Typography variant="body2" color="text.secondary">
                    در حال بارگذاری...
                  </Typography>
                </Box>
              ) : null}
              {textPreviewError ? (
                <Box
                  sx={{
                    display: "grid",
                    placeItems: "center",
                    flex: 1,
                    minHeight: { xs: "18rem", md: "28rem" },
                    px: 2,
                  }}
                >
                  <Typography variant="body2" color="error">
                    {textPreviewError}
                  </Typography>
                </Box>
              ) : null}
              {!textPreviewLoading && !textPreviewError && textPreviewContent != null ? (
                <Box
                  component="pre"
                  sx={{
                    flex: 1,
                    m: 0,
                    p: 2,
                    overflow: "auto",
                    maxBlockSize: isCompact ? "100%" : "min(72vh, 46rem)",
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-word",
                    fontFamily: "monospace",
                    fontSize: "0.875rem",
                    lineHeight: 1.6,
                    bgcolor: "background.paper",
                  }}
                >
                  {textPreviewContent}
                </Box>
              ) : null}
            </Box>
          ) : null}
      </EntityModalShell>
    </Box>
  );
};

export default FileUploadField;
