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
} from "react";
import { useQuery } from "@apollo/client/react";
import { Box, CircularProgress, IconButton, Typography, useMediaQuery } from "@mui/material";
import {
  ArticleRounded,
  AudiotrackRounded,
  CloudUploadOutlined,
  DeleteOutline,
  ImageRounded,
  InsertDriveFileRounded,
  MovieRounded,
  PictureAsPdfRounded,
} from "@mui/icons-material";
import { FILE_DETAIL_QUERY } from "../../graphql/queries/fileDetail.query";
import styles from "./FileUploadField.module.scss";

type FileDetailResponse = {
  fileDetail: {
    id: string;
    name: string;
    mimeType: string;
    sizeBytes: number;
    path: string;
    uploadedAt?: string | null;
    accessUrl?: string | null;
  };
};

type FileDetailVariables = {
  input: {
    id: string;
  };
};

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
  existingFileId?: string | null;
  onExistingFileClear?: () => void;
  accept: string;
  allowedFormatsLabel: string;
  maxSizeLabel: string;
  dropTitle: string;
  mobileDropTitle?: string;
  dropHint: string;
  mobileDropHint?: string;
  removeLabel: string;
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

function renderPreview(source: FilePreviewSource): ReactElement {
  if (source.previewUrl && isImageMimeType(source.mimeType)) {
    return (
      <Box
        component="img"
        src={source.previewUrl}
        alt={source.name}
        className={styles.previewMedia}
      />
    );
  }

  if (source.previewUrl && isVideoMimeType(source.mimeType)) {
    return (
      <Box
        component="video"
        src={source.previewUrl}
        className={styles.previewMedia}
        muted
        playsInline
        preload="metadata"
      />
    );
  }

  return <Box className={styles.previewIcon}>{getFileIcon(source.mimeType)}</Box>;
}

const FileUploadField = ({
  label,
  file,
  onChange,
  existingFileId,
  onExistingFileClear,
  accept,
  allowedFormatsLabel,
  maxSizeLabel,
  dropTitle,
  mobileDropTitle,
  dropHint,
  mobileDropHint,
  removeLabel,
  invalidLabel,
  error = false,
  required = false,
  optionalLabel,
  fullWidth = false,
}: FileUploadFieldProps): ReactElement => {
  const isMobile = useMediaQuery("(max-width:600px)");
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [isDragActive, setIsDragActive] = useState(false);
  const selectedPreviewUrl = useMemo(() => (file ? URL.createObjectURL(file) : undefined), [file]);
  const effectiveDropTitle = isMobile ? mobileDropTitle : dropTitle;
  const effectiveDropHint = isMobile ? mobileDropHint : dropHint;

  const { data, loading: existingFileLoading } = useQuery<FileDetailResponse, FileDetailVariables>(
    FILE_DETAIL_QUERY,
    {
      variables: { input: { id: existingFileId ?? "" } },
      skip: !existingFileId || file != null,
      fetchPolicy: "cache-first",
    }
  );

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
    file == null && data?.fileDetail
      ? {
          name: data.fileDetail.name,
          mimeType: data.fileDetail.mimeType,
          sizeBytes: data.fileDetail.sizeBytes,
          previewUrl: data.fileDetail.accessUrl,
        }
      : undefined;
  const previewSource = selectedFileSource ?? existingFileSource;
  const hasFile = previewSource != null || existingFileLoading;

  const handlePick = useCallback(
    (nextFile: File | null) => {
      onChange(nextFile);
    },
    [onChange]
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

  const handleRemove = (event: { stopPropagation: () => void }): void => {
    event.stopPropagation();
    if (file != null) {
      handlePick(null);
      return;
    }
    onExistingFileClear?.();
  };

  const openPicker = (): void => {
    inputRef.current?.click();
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
        {existingFileLoading ? (
          <Box className={styles.loadingState}>
            <CircularProgress size={22} />
          </Box>
        ) : previewSource == null ? (
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
            {renderPreview(previewSource)}
            <Box className={styles.fileRow}>
              <Box>
                <Typography variant="body2" className={styles.fileName}>
                  {previewSource.name}
                </Typography>
                <Typography variant="caption" className={styles.meta}>
                  {formatFileSize(previewSource.sizeBytes)}
                </Typography>
              </Box>
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
    </Box>
  );
};

export default FileUploadField;
