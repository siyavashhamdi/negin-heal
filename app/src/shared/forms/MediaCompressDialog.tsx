import { useEffect, useMemo, useState, type FormEvent, type ReactElement } from "react";
import {
  Alert,
  FormControl,
  FormControlLabel,
  InputLabel,
  MenuItem,
  Radio,
  RadioGroup,
  Select,
  Stack,
  Typography,
} from "@mui/material";
import AudiotrackRoundedIcon from "@mui/icons-material/AudiotrackRounded";
import CompressRoundedIcon from "@mui/icons-material/CompressRounded";

import { FILE_COMPRESS_MEDIA_MUTATION } from "../../graphql/mutations/fileCompressMedia.mutation";
import {
  AUDIO_OUTPUT_EXTENSION_LABELS,
  AUDIO_OUTPUT_EXTENSION_OPTIONS,
  MEDIA_COMPRESSION_QUALITY_LABELS,
  MEDIA_COMPRESSION_SKIP_REASON_LABELS,
  MEDIA_COMPRESSION_TARGET_QUALITIES,
  MEDIA_TYPE_LABELS,
  VIDEO_OUTPUT_EXTENSION_LABELS,
  VIDEO_OUTPUT_EXTENSION_OPTIONS,
} from "../../constants/mediaCompression.constants";
import { useMutationWithSnackbar } from "../../hooks/useMutationWithSnackbar";
import { formatUploadFileSize } from "../../utils/fileUploadValidation.util";
import { useCachedFileUrl } from "../../hooks/useCachedFileAccessUrl";
import { resolveFileAccessUrl, type FileAccessUrl } from "../../utils/fileAccessUrl.util";
import EntityModalShell from "../crud/EntityModalShell";
import ModalFooterActions from "../crud/ModalFooterActions";
import MediaTrimRangeInput from "./MediaTrimRangeInput";
import { durationPartsToSeconds, formatDurationFriendly } from "./durationTimeInput.util";
import {
  buildDefaultMediaCompressForm,
  mapCompressMediaAccessUrl,
  type MediaCompressDialogSource,
  type MediaCompressFormState,
  type FileCompressMediaMutation,
  type FileCompressMediaMutationResult,
  type FileCompressMediaMutationVariables,
} from "./media-compression.api";
import styles from "./MediaCompressDialog.module.scss";

type MediaCompressDialogProps = {
  readonly open: boolean;
  readonly source: MediaCompressDialogSource | null;
  readonly onClose: () => void;
  readonly onSuccess: (
    fileAccessUrl: FileAccessUrl,
    result: FileCompressMediaMutationResult
  ) => void;
};

function formatDurationMs(durationMs: number): string {
  if (durationMs < 1000) {
    return `${durationMs} میلی‌ثانیه`;
  }

  const totalSeconds = durationMs / 1000;
  if (totalSeconds < 60) {
    return `${totalSeconds.toFixed(1)} ثانیه`;
  }

  return formatDurationFriendly(totalSeconds);
}

function formatResolution(width: number, height: number): string {
  if (width <= 0 || height <= 0) {
    return "—";
  }

  return `${width} × ${height}`;
}

function formatBitrate(value: number | null | undefined): string {
  if (value == null || value <= 0) {
    return "—";
  }

  return `${value} kbps`;
}

function formatAppliedTrim(trim: FileCompressMediaMutationResult["trim"]): string {
  const hasTrim = trim.requested.startSeconds != null || trim.requested.endSeconds != null;

  if (!hasTrim) {
    return "—";
  }

  return `${formatDurationFriendly(trim.applied.startSeconds)} تا ${formatDurationFriendly(trim.applied.endSeconds)}`;
}

function buildMutationVariables(
  source: MediaCompressDialogSource,
  form: MediaCompressFormState
): FileCompressMediaMutationVariables["input"] {
  const startSeconds = durationPartsToSeconds(form.trim.start);
  const endSeconds = durationPartsToSeconds(form.trim.end);

  if (startSeconds != null && endSeconds != null && endSeconds <= startSeconds) {
    throw new Error("زمان پایان باید بعد از زمان شروع باشد.");
  }

  const useAudioOutput =
    source.mediaKind === "audio" || (source.mediaKind === "video" && form.outputMode === "audio");

  return {
    fileId: source.fileId,
    targetQuality: form.targetQuality,
    videoOutputExtension: useAudioOutput ? null : form.videoOutputExtension,
    audioOutputExtension: useAudioOutput ? form.audioOutputExtension : null,
    trim:
      startSeconds != null || endSeconds != null
        ? {
            startSeconds,
            endSeconds,
          }
        : null,
  };
}

function MediaCompressPreview({
  source,
}: {
  readonly source: MediaCompressDialogSource;
}): ReactElement {
  const { url: previewUrl } = useCachedFileUrl({
    fileId: source.fileId,
    networkUrl: source.previewUrl,
    mimeType: source.mimeType,
    fileName: source.fileName,
  });

  return (
    <div className={styles.previewPanel}>
      <div className={styles.previewFrame}>
        {source.mediaKind === "video" ? (
          <video
            className={styles.previewVideo}
            src={previewUrl ?? source.previewUrl}
            controls
            playsInline
            preload="metadata"
          />
        ) : (
          <div className={styles.previewAudioWrap}>
            <AudiotrackRoundedIcon sx={{ fontSize: "3.5rem", color: "text.secondary" }} />
            <audio
              className={styles.previewAudio}
              src={previewUrl ?? source.previewUrl}
              controls
              preload="metadata"
            />
          </div>
        )}
      </div>
      <div className={styles.previewCaption}>
        <Typography className={styles.previewName}>{source.fileName}</Typography>
        <Typography className={styles.previewSize}>
          {formatUploadFileSize(source.sizeBytes)}
        </Typography>
        <Typography className={styles.previewMeta}>
          {source.mediaKind === "video" ? "ویدیو" : "صوت"} · {source.mimeType}
        </Typography>
      </div>
    </div>
  );
}

function MediaCompressResultPanel({
  result,
  previewUrl,
  previewName,
  previewMimeType,
  mediaKind,
}: {
  readonly result: FileCompressMediaMutationResult;
  readonly previewUrl: string | null;
  readonly previewName: string;
  readonly previewMimeType: string;
  readonly mediaKind: "video" | "audio";
}): ReactElement {
  const savedPercent =
    result.previousSizeBytes > 0 ? Math.max(0, Math.round((1 - result.compressionRatio) * 100)) : 0;

  return (
    <div className={styles.resultPanel}>
      {previewUrl ? (
        <MediaCompressPreview
          source={{
            fileId: result.fileId,
            fileName: previewName,
            mimeType: previewMimeType,
            mediaKind,
            previewUrl,
            sizeBytes: result.currentSizeBytes,
          }}
        />
      ) : null}

      <Alert severity={result.wasCompressed ? "success" : "info"}>
        {result.wasCompressed
          ? "فشرده‌سازی با موفقیت انجام شد و فایل جدید جایگزین فایل قبلی شد."
          : (MEDIA_COMPRESSION_SKIP_REASON_LABELS[result.skipReason] ??
            "فشرده‌سازی انجام نشد و فایل قبلی بدون تغییر باقی ماند.")}
      </Alert>

      <div className={styles.resultSummary}>
        <div className={styles.resultCard}>
          <span className={styles.resultLabel}>زمان پردازش</span>
          <span className={styles.resultValue}>{formatDurationMs(result.durationMs)}</span>
        </div>
        <div className={styles.resultCard}>
          <span className={styles.resultLabel}>نوع خروجی</span>
          <span className={styles.resultValue}>
            {MEDIA_TYPE_LABELS[result.mediaType] ?? result.mediaType}
          </span>
        </div>
        <div className={styles.resultCard}>
          <span className={styles.resultLabel}>کیفیت قبلی</span>
          <span className={styles.resultValue}>
            {MEDIA_COMPRESSION_QUALITY_LABELS[
              result.previousQuality as keyof typeof MEDIA_COMPRESSION_QUALITY_LABELS
            ] ?? result.previousQuality}
          </span>
        </div>
        <div className={styles.resultCard}>
          <span className={styles.resultLabel}>کیفیت فعلی</span>
          <span className={styles.resultValue}>
            {MEDIA_COMPRESSION_QUALITY_LABELS[
              result.currentQuality as keyof typeof MEDIA_COMPRESSION_QUALITY_LABELS
            ] ?? result.currentQuality}
          </span>
        </div>
        <div className={styles.resultCard}>
          <span className={styles.resultLabel}>حجم قبلی</span>
          <span className={styles.resultValue}>
            {formatUploadFileSize(result.previousSizeBytes)}
          </span>
        </div>
        <div className={styles.resultCard}>
          <span className={styles.resultLabel}>حجم فعلی</span>
          <span className={`${styles.resultValue} ${styles.resultHighlight}`}>
            {formatUploadFileSize(result.currentSizeBytes)}
          </span>
        </div>
        <div className={styles.resultCard}>
          <span className={styles.resultLabel}>کاهش حجم</span>
          <span className={styles.resultValue}>
            {result.wasCompressed ? `${savedPercent}%` : "—"}
          </span>
        </div>
        <div className={styles.resultCard}>
          <span className={styles.resultLabel}>مدت رسانه</span>
          <span className={styles.resultValue}>
            {formatDurationFriendly(result.mediaDurationSeconds)}
          </span>
        </div>
        <div className={styles.resultCard}>
          <span className={styles.resultLabel}>پسوند / کدک</span>
          <span className={`${styles.resultValue} ${styles.latinResultValue}`}>
            {result.previousExtension} → {result.currentExtension} ({result.previousCodec} →{" "}
            {result.currentCodec})
          </span>
        </div>
        <div className={styles.resultCard}>
          <span className={styles.resultLabel}>رزولوشن</span>
          <span className={`${styles.resultValue} ${styles.latinResultValue}`}>
            {formatResolution(result.previousResolution.width, result.previousResolution.height)} →{" "}
            {formatResolution(result.currentResolution.width, result.currentResolution.height)}
          </span>
        </div>
        <div className={styles.resultCard}>
          <span className={styles.resultLabel}>bitrate</span>
          <span className={`${styles.resultValue} ${styles.latinResultValue}`}>
            {formatBitrate(result.previousBitrateKbps)} → {formatBitrate(result.currentBitrateKbps)}
          </span>
        </div>
        <div className={styles.resultCard}>
          <span className={styles.resultLabel}>برش اعمال‌شده</span>
          <span className={styles.resultValue}>{formatAppliedTrim(result.trim)}</span>
        </div>
      </div>
    </div>
  );
}

const MediaCompressDialog = ({
  open,
  source,
  onClose,
  onSuccess,
}: MediaCompressDialogProps): ReactElement => {
  const [form, setForm] = useState<MediaCompressFormState | null>(null);
  const [result, setResult] = useState<FileCompressMediaMutationResult | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const [compressMedia, compressMediaResult] = useMutationWithSnackbar<
    FileCompressMediaMutation,
    FileCompressMediaMutationVariables
  >(FILE_COMPRESS_MEDIA_MUTATION);

  const isSubmitting = compressMediaResult.loading;

  useEffect(() => {
    if (!open || !source) {
      setForm(null);
      setResult(null);
      setFormError(null);
      return;
    }

    // Keep existing form/result when `source` refreshes after a successful compression.
    setForm((currentForm) => currentForm ?? buildDefaultMediaCompressForm(source));
    setFormError(null);
  }, [open, source]);

  const canSubmit = Boolean(source && form && !isSubmitting && !result);

  const outputModeHint = useMemo(() => {
    if (!source) {
      return "";
    }

    if (source.mediaKind === "audio") {
      return "برای فایل صوتی، خروجی همیشه به‌صورت صوت ذخیره می‌شود.";
    }

    return form?.outputMode === "audio"
      ? "صوت از ویدیو استخراج می‌شود و فایل ویدیویی قبلی حذف خواهد شد."
      : "ویدیو با کیفیت انتخاب‌شده بازفشرده می‌شود.";
  }, [form?.outputMode, source]);

  const resultPreview = useMemo(() => {
    if (!result) {
      return null;
    }

    const accessUrl = mapCompressMediaAccessUrl(result);
    return {
      previewUrl: accessUrl ? resolveFileAccessUrl(accessUrl) : null,
      previewName: result.file.name,
      previewMimeType: result.file.mimeType,
      mediaKind: (result.mediaType === "AUDIO" ? "audio" : "video") as "video" | "audio",
    };
  }, [result]);

  const handleClose = (): void => {
    if (isSubmitting) {
      return;
    }
    onClose();
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    if (!source || !form || result) {
      return;
    }

    try {
      const variables = buildMutationVariables(source, form);
      setFormError(null);
      void compressMedia({
        variables: { input: variables },
        onCompleted: (data) => {
          const nextResult = data.fileCompressMedia;
          setResult(nextResult);

          if (nextResult.wasCompressed) {
            const nextAccessUrl = mapCompressMediaAccessUrl(nextResult);
            if (nextAccessUrl) {
              onSuccess(nextAccessUrl, nextResult);
            }
          }
        },
      });
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "ورودی‌های فرم معتبر نیست.");
    }
  };

  const updateForm = (patch: Partial<MediaCompressFormState>): void => {
    setForm((current) => (current ? { ...current, ...patch } : current));
  };

  return (
    <EntityModalShell
      open={open}
      onClose={handleClose}
      disableClose={isSubmitting}
      title="فشرده‌سازی رسانه"
      subtitle="تنظیم کیفیت، برش و قالب خروجی برای فایل ذخیره‌شده"
      maxWidth="md"
      showVisibleScrollbar
      footer={
        <ModalFooterActions
          actions={
            result
              ? [
                  {
                    key: "close",
                    label: "بستن",
                    isCloseButton: true,
                    onClick: handleClose,
                  },
                ]
              : [
                  {
                    key: "cancel",
                    label: "انصراف",
                    isCloseButton: true,
                    onClick: handleClose,
                    disabled: isSubmitting,
                  },
                  {
                    key: "submit",
                    label: isSubmitting ? "در حال پردازش..." : "شروع فشرده‌سازی",
                    color: "primary",
                    variant: "contained",
                    icon: <CompressRoundedIcon />,
                    disabled: !canSubmit,
                    onClick: () => {
                      const formElement = document.getElementById(
                        "media-compress-form"
                      ) as HTMLFormElement | null;
                      formElement?.requestSubmit();
                    },
                  },
                ]
          }
        />
      }
    >
      {source && form ? (
        <Stack spacing={2.25} component="form" id="media-compress-form" onSubmit={handleSubmit}>
          {!result ? <MediaCompressPreview source={source} /> : null}

          {result ? (
            <MediaCompressResultPanel
              result={result}
              previewUrl={resultPreview?.previewUrl ?? source.previewUrl}
              previewName={resultPreview?.previewName ?? source.fileName}
              previewMimeType={resultPreview?.previewMimeType ?? source.mimeType}
              mediaKind={resultPreview?.mediaKind ?? source.mediaKind}
            />
          ) : null}

          {!result ? (
            <>
              <div className={styles.formGrid}>
                <FormControl fullWidth required>
                  <InputLabel id="media-compress-quality-label">کیفیت هدف</InputLabel>
                  <Select
                    labelId="media-compress-quality-label"
                    label="کیفیت هدف"
                    value={form.targetQuality}
                    onChange={(event) => updateForm({ targetQuality: event.target.value })}
                  >
                    {MEDIA_COMPRESSION_TARGET_QUALITIES.map((quality) => (
                      <MenuItem key={quality} value={quality}>
                        {MEDIA_COMPRESSION_QUALITY_LABELS[quality]}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                {source.mediaKind === "video" ? (
                  <FormControl>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 0.75 }}>
                      نوع خروجی
                    </Typography>
                    <RadioGroup
                      row
                      value={form.outputMode}
                      onChange={(event) =>
                        updateForm({
                          outputMode: event.target.value as MediaCompressFormState["outputMode"],
                        })
                      }
                    >
                      <FormControlLabel value="video" control={<Radio />} label="ویدیو" />
                      <FormControlLabel value="audio" control={<Radio />} label="استخراج صوت" />
                    </RadioGroup>
                  </FormControl>
                ) : null}

                {source.mediaKind === "video" && form.outputMode === "video" ? (
                  <FormControl fullWidth required>
                    <InputLabel id="media-compress-video-extension-label">
                      قالب خروجی ویدیو
                    </InputLabel>
                    <Select
                      labelId="media-compress-video-extension-label"
                      label="قالب خروجی ویدیو"
                      value={form.videoOutputExtension}
                      onChange={(event) => updateForm({ videoOutputExtension: event.target.value })}
                      renderValue={(selected) => (
                        <span className={styles.latinSelectValue}>
                          {VIDEO_OUTPUT_EXTENSION_LABELS[
                            String(selected) as keyof typeof VIDEO_OUTPUT_EXTENSION_LABELS
                          ] ?? String(selected)}
                        </span>
                      )}
                    >
                      {VIDEO_OUTPUT_EXTENSION_OPTIONS.map((extension) => (
                        <MenuItem key={extension} value={extension}>
                          {VIDEO_OUTPUT_EXTENSION_LABELS[extension]}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                ) : null}

                {(source.mediaKind === "audio" ||
                  (source.mediaKind === "video" && form.outputMode === "audio")) && (
                  <FormControl fullWidth required>
                    <InputLabel id="media-compress-audio-extension-label">
                      قالب خروجی صوت
                    </InputLabel>
                    <Select
                      labelId="media-compress-audio-extension-label"
                      label="قالب خروجی صوت"
                      value={form.audioOutputExtension}
                      onChange={(event) => updateForm({ audioOutputExtension: event.target.value })}
                      renderValue={(selected) => (
                        <span className={styles.latinSelectValue}>
                          {AUDIO_OUTPUT_EXTENSION_LABELS[
                            String(selected) as keyof typeof AUDIO_OUTPUT_EXTENSION_LABELS
                          ] ?? String(selected)}
                        </span>
                      )}
                    >
                      {AUDIO_OUTPUT_EXTENSION_OPTIONS.map((extension) => (
                        <MenuItem key={extension} value={extension}>
                          {AUDIO_OUTPUT_EXTENSION_LABELS[extension]}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                )}

                {outputModeHint ? (
                  <Typography variant="body2" color="text.secondary">
                    {outputModeHint}
                  </Typography>
                ) : null}
              </div>

              <MediaTrimRangeInput
                value={form.trim}
                onChange={(trim) => updateForm({ trim })}
                helperText="خالی گذاشتن همه فیلدها یعنی بدون برش"
                disabled={isSubmitting}
              />
            </>
          ) : null}

          {formError ? <Alert severity="error">{formError}</Alert> : null}
        </Stack>
      ) : null}
    </EntityModalShell>
  );
};

export default MediaCompressDialog;
