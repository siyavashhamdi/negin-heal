import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
  type ReactElement,
  type SyntheticEvent,
} from "react";
import { Box, Dialog, DialogContent, DialogTitle, IconButton, Typography, useMediaQuery, useTheme } from "@mui/material";
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
} from "@mui/icons-material";
import { getViewableMediaKind } from "../../utils/fileAccessUrl.util";
import type { ExistingFilePreview } from "../../utils/fileAccessUrl.util";
import { useMobileDialogProps } from "../../hooks/useMobileDialogProps";
import { crudModalTitleSx } from "../crud/modalThemeSx";
import styles from "./FileUploadField.module.scss";

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
  invalidLabel: string;
  error?: boolean;
  required?: boolean;
  optionalLabel?: string;
  fullWidth?: boolean;
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
  invalidLabel,
  error = false,
  required = false,
  optionalLabel,
  fullWidth = false,
}: FileUploadFieldProps): ReactElement => {
  const theme = useTheme();
  const { isCompact, dialogProps, getPaperProps, getContentProps } = useMobileDialogProps();
  const isMobile = useMediaQuery("(max-width:600px)");
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const inlineVideoRef = useRef<HTMLVideoElement | null>(null);
  const inlineAudioRef = useRef<HTMLAudioElement | null>(null);
  const popupVideoRef = useRef<HTMLVideoElement | null>(null);
  const [isDragActive, setIsDragActive] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const [isPlayingInline, setIsPlayingInline] = useState(false);
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
  const hasFile = previewSource != null;
  const previewMediaKind = previewSource
    ? getViewableMediaKind(previewSource.mimeType, previewSource.name)
    : null;
  const previewUrl = previewSource?.previewUrl ?? null;
  const supportsMaximize =
    previewMediaKind === "image" || previewMediaKind === "video";
  const supportsInlinePlay =
    previewMediaKind === "video" || previewMediaKind === "audio";

  useEffect(() => {
    setIsMaximized(false);
    setIsPlayingInline(false);
  }, [previewUrl, previewMediaKind]);

  useEffect(() => {
    if (!isMaximized) {
      pauseMediaElement(popupVideoRef.current);
      return;
    }

    pauseMediaElement(inlineVideoRef.current);
    pauseMediaElement(inlineAudioRef.current);
    setIsPlayingInline(false);

    if (previewMediaKind === "video") {
      void popupVideoRef.current?.play().catch(() => undefined);
    }
  }, [isMaximized, previewMediaKind]);

  const handlePick = useCallback(
    (nextFile: File | null) => {
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
    setIsMaximized(false);
    setIsPlayingInline(false);
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
    inputRef.current?.click();
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
          className={styles.previewMedia}
        />
      );
    }

    if (previewMediaKind === "video") {
      return (
        <Box
          component="video"
          ref={inlineVideoRef}
          src={previewUrl}
          className={styles.previewMedia}
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
            className={styles.hiddenMedia}
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

  return (
    <Box className={[styles.root, fullWidth ? styles.rootFullWidth : ""].filter(Boolean).join(" ")}>
      <span className={styles.label}>
        {label}
        {required ? <span className={styles.requiredMark}> *</span> : null}
        {!required && optionalLabel ? (
          <span className={styles.optionalMark}> {optionalLabel}</span>
        ) : null}
      </span>
      <Box
        role="button"
        tabIndex={0}
        className={[
          styles.dropzone,
          error ? styles.dropzoneError : "",
          hasFile ? styles.dropzoneHasFile : "",
          isDragActive ? styles.dropzoneDragActive : "",
          fullWidth ? styles.dropzoneFullWidth : "",
        ]
          .filter(Boolean)
          .join(" ")}
        onClick={openPicker}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            openPicker();
          }
        }}
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
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
            {renderPreviewContent()}
            <Box className={styles.fileRow}>
              <Box>
                <Typography variant="body2" className={styles.fileName}>
                  {previewSource.name}
                </Typography>
                <Typography variant="caption" className={styles.meta}>
                  {formatFileSize(previewSource.sizeBytes)}
                </Typography>
              </Box>
              <Box className={styles.fileActions}>
                {supportsInlinePlay ? (
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
                {supportsMaximize ? (
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
                {!supportsInlinePlay && !supportsMaximize ? (
                  <IconButton
                    size="small"
                    color="primary"
                    aria-label={downloadLabel}
                    onClick={handleDownload}
                  >
                    <FileDownloadOutlined fontSize="small" />
                  </IconButton>
                ) : null}
                <IconButton
                  size="small"
                  color="error"
                  aria-label={removeLabel}
                  onClick={handleRemove}
                >
                  <DeleteOutline fontSize="small" />
                </IconButton>
              </Box>
            </Box>
          </Box>
        )}
      </Box>
      <input
        ref={inputRef}
        id={inputId}
        type="file"
        className={styles.hiddenInput}
        accept={accept}
        onChange={handleInputChange}
      />
      {error ? (
        <Typography variant="caption" color="error">
          {invalidLabel}
        </Typography>
      ) : null}
      <Dialog
        open={isMaximized && previewUrl != null && supportsMaximize}
        onClose={() => setIsMaximized(false)}
        maxWidth="lg"
        {...dialogProps}
        PaperProps={getPaperProps({
          sx: isCompact
            ? {
                display: "flex",
                flexDirection: "column",
              }
            : undefined,
        })}
      >
        <DialogTitle
          sx={{
            ...crudModalTitleSx(theme),
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 1,
            pr: 1,
            flexShrink: 0,
          }}
        >
          <Typography variant="h6" component="span" sx={{ minWidth: 0, wordBreak: "break-word" }}>
            {previewSource?.name ?? ""}
          </Typography>
          <IconButton
            size="small"
            color="primary"
            aria-label={minimizeLabel}
            onClick={() => setIsMaximized(false)}
          >
            <CloseFullscreenOutlined fontSize="small" />
          </IconButton>
        </DialogTitle>
        <DialogContent
          {...getContentProps({
            sx: {
              display: "flex",
              flexDirection: "column",
              ...(isCompact
                ? {
                    flex: 1,
                    minHeight: 0,
                    justifyContent: "center",
                    px: 0,
                    pb: 0,
                  }
                : {}),
            },
          })}
        >
          {previewUrl && previewMediaKind === "image" ? (
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
              sx={{
                display: "grid",
                placeItems: "center",
                flex: isCompact ? 1 : undefined,
                minHeight: isCompact ? 0 : { xs: "18rem", md: "28rem" },
                width: "100%",
                borderRadius: isCompact ? 0 : 2,
                bgcolor: "common.black",
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
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default FileUploadField;
