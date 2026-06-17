import type { ReactElement } from "react";
import {
  FormControl,
  FormControlLabel,
  Grid,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Switch,
  TextField,
  Typography,
} from "@mui/material";
import FileUploadField from "../../../shared/forms/FileUploadField";
import type { ExistingFilePreview } from "../../../utils/fileAccessUrl.util";
import CourseTagInput from "../CourseTagInput";
import type { DiscountKind } from "./types";
import styles from "./styles/MainInfoSection.module.scss";

type MainInfoSectionProps = {
  readonly title: string;
  readonly onTitleChange: (value: string) => void;
  readonly description: string;
  readonly onDescriptionChange: (value: string) => void;
  readonly coverImageFile: File | null;
  readonly onCoverImageFileChange: (file: File | null) => void;
  readonly coverImageExistingFile: ExistingFilePreview | null;
  readonly onCoverImageExistingFileClear: () => void;
  readonly priceIrt: string;
  readonly onPriceIrtChange: (value: string) => void;
  readonly tags: string[];
  readonly onTagsChange: (value: string[]) => void;
  readonly isActive: boolean;
  readonly onIsActiveChange: (value: boolean) => void;
  readonly hasPositivePrice: boolean;
  readonly discountEnabled: boolean;
  readonly onDiscountEnabledChange: (value: boolean) => void;
  readonly discountKind: DiscountKind;
  readonly onDiscountKindChange: (value: DiscountKind) => void;
  readonly discountValue: string;
  readonly onDiscountValueChange: (value: string) => void;
  readonly formatIntegerWithThousands: (value: string) => string;
  readonly sanitizePercentageValue: (value: string) => string;
};

const MainInfoSection = ({
  title,
  onTitleChange,
  description,
  onDescriptionChange,
  coverImageFile,
  onCoverImageFileChange,
  coverImageExistingFile,
  onCoverImageExistingFileClear,
  priceIrt,
  onPriceIrtChange,
  tags,
  onTagsChange,
  isActive,
  onIsActiveChange,
  hasPositivePrice,
  discountEnabled,
  onDiscountEnabledChange,
  discountKind,
  onDiscountKindChange,
  discountValue,
  onDiscountValueChange,
  formatIntegerWithThousands,
  sanitizePercentageValue,
}: MainInfoSectionProps): ReactElement => (
  <section className={styles.section}>
    <Typography className={styles.sectionTitle}>اطلاعات اصلی</Typography>
    <Grid container spacing={1.25}>
      <Grid item xs={12} md={6}>
        <TextField
          fullWidth
          required
          label="عنوان دوره"
          value={title}
          onChange={(event) => onTitleChange(event.target.value)}
        />
      </Grid>
      <Grid item xs={12}>
        <TextField
          fullWidth
          multiline
          minRows={2}
          label="توضیحات"
          value={description}
          onChange={(event) => onDescriptionChange(event.target.value)}
        />
      </Grid>
      <Grid item xs={12} md={3}>
        <TextField
          fullWidth
          label="قیمت (تومان)"
          value={priceIrt}
          onChange={(event) => onPriceIrtChange(formatIntegerWithThousands(event.target.value))}
          inputProps={{ inputMode: "numeric" }}
        />
      </Grid>
      <Grid item xs={12} md={9}>
        <CourseTagInput
          label="برچسب‌ها"
          value={tags}
          onChange={onTagsChange}
          placeholder="برچسب را بنویسید و Enter بزنید"
        />
      </Grid>
      <Grid item xs={12}>
        <div className={styles.uploaderRow}>
          <FileUploadField
            label="فایل کاور دوره"
            file={coverImageFile}
            onChange={onCoverImageFileChange}
            existingFile={coverImageExistingFile}
            onExistingFileClear={onCoverImageExistingFileClear}
            accept="image/*"
            allowedFormatsLabel="فرمت مجاز: تصویر"
            maxSizeLabel="حداکثر: ۲۰MB"
            dropTitle="انتخاب یا رها کردن کاور"
            mobileDropTitle="انتخاب کاور"
            dropHint="هنگام ایجاد دوره آپلود می‌شود"
            mobileDropHint="هنگام ایجاد دوره آپلود می‌شود"
            removeLabel="حذف فایل"
            invalidLabel="فایل انتخاب شده معتبر نیست"
          />
        </div>
      </Grid>
      <Grid item xs={12}>
        <Paper variant="outlined" className={styles.settingsBox}>
          <div className={styles.settingsHeader}>
            <Typography className={styles.settingsTitle}>تنظیمات</Typography>
          </div>
          <Grid container spacing={1.25}>
            <Grid item xs={12} md={4}>
              <FormControlLabel
                control={
                  <Switch
                    checked={isActive}
                    onChange={(event) => onIsActiveChange(event.target.checked)}
                  />
                }
                label="دوره فعال باشد."
              />
            </Grid>
            {hasPositivePrice ? (
              <Grid item xs={12} md={2}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={discountEnabled}
                      onChange={(event) => onDiscountEnabledChange(event.target.checked)}
                    />
                  }
                  label="تخفیف"
                />
              </Grid>
            ) : null}
            {hasPositivePrice && discountEnabled ? (
              <Grid item xs={12}>
                <Grid container spacing={1.25}>
                  <Grid item xs={12} md={3}>
                    <FormControl fullWidth required>
                      <InputLabel required>نوع تخفیف</InputLabel>
                      <Select
                        value={discountKind}
                        label="نوع تخفیف"
                        onChange={(event) => onDiscountKindChange(event.target.value as DiscountKind)}
                      >
                        <MenuItem value="PERCENTAGE">درصدی</MenuItem>
                        <MenuItem value="FIXED_AMOUNT_IRT">مبلغ ثابت (تومان)</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <TextField
                      fullWidth
                      required
                      label={discountKind === "PERCENTAGE" ? "مقدار درصد" : "مقدار (تومان)"}
                      value={discountValue}
                      onChange={(event) =>
                        onDiscountValueChange(
                          discountKind === "PERCENTAGE"
                            ? sanitizePercentageValue(event.target.value)
                            : formatIntegerWithThousands(event.target.value),
                        )
                      }
                      inputProps={{ inputMode: "decimal" }}
                    />
                  </Grid>
                </Grid>
              </Grid>
            ) : null}
          </Grid>
        </Paper>
      </Grid>
    </Grid>
  </section>
);

export default MainInfoSection;
