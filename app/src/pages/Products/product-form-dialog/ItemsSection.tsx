import { type DragEvent, type ReactElement } from "react";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Button,
  FormControl,
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
} from "@mui/material";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import DragIndicatorRoundedIcon from "@mui/icons-material/DragIndicatorRounded";
import ExpandMoreRoundedIcon from "@mui/icons-material/ExpandMoreRounded";
import PlaylistAddRoundedIcon from "@mui/icons-material/PlaylistAddRounded";
import { OverflowTooltip } from "../../../shared/OverflowTooltip";
import FileUploadField from "../../../shared/forms/FileUploadField";
import { FILE_UPLOAD_POLICY_MAX_SIZE_BYTES } from "../../../constants/fileUploadPolicies";
import {
  buildExistingFilePreview,
  getFileIdFromAccessUrl,
} from "../../../utils/fileAccessUrl.util";
import {
  getFieldUploadPercent,
  type UploadProgressEntry,
} from "../../../utils/uploadProgress.util";
import RichTextBox from "../../../shared/forms/RichTextBox";
import { MULTILINE_TEXTAREA_MIN_ROWS } from "../../../constants/multilineTextarea.constants";
import type { DraftChapter, DraftItem, DraftItemContentType } from "./types";
import { setDragTransferData } from "./reorder-drag.util";
import styles from "./styles/ItemsSection.module.scss";

type ItemsSectionProps = {
  readonly chapter: DraftChapter;
  readonly expandedItemId: string | null;
  readonly onExpandedItemChange: (itemId: string | null) => void;
  readonly onSetDraggedItemId: (itemId: string | null) => void;
  readonly onItemDragOver: (
    event: DragEvent<HTMLDivElement>,
    chapterId: string,
    targetItemId: string
  ) => void;
  readonly onUpdateItem: (chapterId: string, itemId: string, patch: Partial<DraftItem>) => void;
  readonly onAddItem: (chapterId: string) => void;
  readonly onRemoveItem: (chapterId: string, itemId: string) => void;
  readonly uploadProgressByFieldId?: Readonly<Record<string, UploadProgressEntry>>;
  readonly enableMediaCompress?: boolean;
};

function getContentTypePatch(nextContentType: DraftItemContentType): Partial<DraftItem> {
  return nextContentType === "FILE"
    ? {
        contentType: nextContentType,
        article: "",
      }
    : {
        contentType: nextContentType,
        file: null,
        fileAccessUrl: null,
      };
}

const ItemsSection = ({
  chapter,
  expandedItemId,
  onExpandedItemChange,
  onSetDraggedItemId,
  onItemDragOver,
  onUpdateItem,
  onAddItem,
  onRemoveItem,
  uploadProgressByFieldId = {},
  enableMediaCompress = false,
}: ItemsSectionProps): ReactElement => {
  return (
    <>
      <div className={styles.sectionHead}>
        <Typography className={styles.itemsTitle}>آیتم‌های این فصل</Typography>
      </div>

      <div className={styles.itemsStack}>
        {chapter.items.map((item, index) => {
          const isExpanded = expandedItemId === item.id;
          const updateCurrentItem = (patch: Partial<DraftItem>): void => {
            onUpdateItem(chapter.id, item.id, patch);
          };

          return (
            <Accordion
              key={item.id}
              elevation={0}
              className={styles.itemCard}
              expanded={isExpanded}
              onChange={(_event, nextExpanded) => {
                onExpandedItemChange(nextExpanded ? item.id : null);
              }}
              onDragOver={(event) => {
                onItemDragOver(event, chapter.id, item.id);
              }}
              onDrop={(event) => {
                event.preventDefault();
                onSetDraggedItemId(null);
              }}
              onDragEnd={() => onSetDraggedItemId(null)}
            >
              <AccordionSummary className={styles.itemSummary} expandIcon={null}>
                <div className={styles.itemHead}>
                  <Typography className={styles.itemTitle}>آیتم {index + 1}</Typography>
                  <OverflowTooltip
                    className={styles.itemSubtitle}
                    title={item.title.trim() || "بدون عنوان"}
                  >
                    {item.title.trim() || "بدون عنوان"}
                  </OverflowTooltip>
                  <div className={styles.itemActions}>
                    <IconButton
                      size="small"
                      className={`${styles.expandHandle}${
                        isExpanded ? ` ${styles.expandHandleOpen}` : ""
                      }`}
                      onClick={(event) => {
                        event.stopPropagation();
                        onExpandedItemChange(isExpanded ? null : item.id);
                      }}
                      aria-label={isExpanded ? "بستن آیتم" : "باز کردن آیتم"}
                    >
                      <ExpandMoreRoundedIcon fontSize="small" />
                    </IconButton>
                    <IconButton
                      size="small"
                      className={styles.dragHandle}
                      draggable
                      onClick={(event) => event.stopPropagation()}
                      onDragStart={(event) => {
                        event.stopPropagation();
                        setDragTransferData(event, item.id);
                        onSetDraggedItemId(item.id);
                      }}
                      onDragEnd={() => onSetDraggedItemId(null)}
                    >
                      <DragIndicatorRoundedIcon fontSize="small" />
                    </IconButton>
                    <IconButton
                      size="small"
                      color="error"
                      onClick={(event) => {
                        event.stopPropagation();
                        onRemoveItem(chapter.id, item.id);
                      }}
                      disabled={chapter.items.length <= 1}
                    >
                      <DeleteOutlineRoundedIcon fontSize="small" />
                    </IconButton>
                  </div>
                </div>
              </AccordionSummary>
              <AccordionDetails>
                <Grid container spacing={1.25}>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      required
                      label="عنوان آیتم"
                      value={item.title}
                      onChange={(event) => updateCurrentItem({ title: event.target.value })}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <FormControl fullWidth required>
                      <InputLabel required>نوع محتوای آیتم</InputLabel>
                      <Select
                        value={item.contentType}
                        label="نوع محتوای آیتم"
                        onChange={(event) => {
                          const nextContentType = event.target.value as DraftItemContentType;
                          updateCurrentItem(getContentTypePatch(nextContentType));
                        }}
                      >
                        <MenuItem value="FILE">آپلود فایل</MenuItem>
                        <MenuItem value="ARTICLE">متن مقاله</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  {item.contentType === "FILE" ? (
                    <Grid item xs={12}>
                      <div className={styles.uploaderRow}>
                        <FileUploadField
                          previewId={`product-item-file-${item.id}`}
                          label="فایل آیتم"
                          file={item.file}
                          onChange={(file) =>
                            updateCurrentItem({
                              file,
                              ...(file != null ? { fileAccessUrl: null } : {}),
                            })
                          }
                          existingFile={buildExistingFilePreview(
                            item.fileAccessUrl,
                            item.title.trim() || "فایل آیتم"
                          )}
                          onExistingFileClear={() => updateCurrentItem({ fileAccessUrl: null })}
                          accept="*/*"
                          allowedFormatsLabel="فرمت مجاز: همه"
                          maxSizeLabel="حداکثر: ۵۰ مگابایت"
                          maxSizeBytes={FILE_UPLOAD_POLICY_MAX_SIZE_BYTES.PRODUCT_ITEM}
                          dropTitle="انتخاب فایل آیتم"
                          mobileDropTitle="انتخاب فایل آیتم"
                          dropHint="هنگام ایجاد دوره آپلود می‌شود"
                          mobileDropHint="هنگام ایجاد دوره آپلود می‌شود"
                          removeLabel="حذف فایل"
                          invalidLabel="فایل معتبر نیست"
                          required
                          uploading={`product-item-file-${item.id}` in uploadProgressByFieldId}
                          uploadProgress={getFieldUploadPercent(
                            uploadProgressByFieldId[`product-item-file-${item.id}`]
                          )}
                          enableMediaCompress={enableMediaCompress}
                          mediaCompressFileId={getFileIdFromAccessUrl(item.fileAccessUrl)}
                          onMediaCompressSuccess={(fileAccessUrl) =>
                            updateCurrentItem({
                              fileAccessUrl,
                              file: null,
                            })
                          }
                          mediaCompressLabel="فشرده‌سازی رسانه"
                        />
                      </div>
                    </Grid>
                  ) : null}
                  {item.contentType === "ARTICLE" ? (
                    <Grid item xs={12}>
                      <RichTextBox
                        previewId={`product-item-article-${chapter.id}-${index}`}
                        label="متن مقاله"
                        value={item.article}
                        onChange={(nextValue) => updateCurrentItem({ article: nextValue })}
                        placeholder="متن مقاله را وارد کنید"
                        minRows={MULTILINE_TEXTAREA_MIN_ROWS}
                        required
                      />
                    </Grid>
                  ) : null}
                </Grid>
              </AccordionDetails>
            </Accordion>
          );
        })}
        <div className={styles.addItemFooter}>
          <Button
            variant="outlined"
            size="small"
            startIcon={<PlaylistAddRoundedIcon />}
            onClick={() => onAddItem(chapter.id)}
          >
            افزودن آیتم
          </Button>
        </div>
      </div>
    </>
  );
};

export default ItemsSection;
