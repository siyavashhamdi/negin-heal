import { Fragment, type ReactElement } from "react";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Button,
  Divider,
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
import FileUploadField from "../../../shared/forms/FileUploadField";
import { buildExistingFilePreview } from "../../../utils/fileAccessUrl.util";
import RichTextBox from "../../../shared/forms/RichTextBox";
import type { DraftChapter, DraftItem, DraftItemContentType } from "./types";
import styles from "./styles/ItemsSection.module.scss";

type ItemsSectionProps = {
  readonly chapter: DraftChapter;
  readonly expandedItemId: string | null;
  readonly onExpandedItemChange: (itemId: string | null) => void;
  readonly onSetDraggedItemId: (itemId: string | null) => void;
  readonly onItemDragOver: (chapterId: string, targetItemId: string) => void;
  readonly onUpdateItem: (chapterId: string, itemId: string, patch: Partial<DraftItem>) => void;
  readonly onAddItem: (chapterId: string) => void;
  readonly onRemoveItem: (chapterId: string, itemId: string) => void;
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
            <Fragment key={item.id}>
              {index > 0 ? <Divider className={styles.itemSeparator} /> : null}
              <Accordion
                elevation={0}
                className={styles.itemCard}
                expanded={isExpanded}
                onDragOver={(event) => {
                  event.preventDefault();
                  onItemDragOver(chapter.id, item.id);
                }}
                onDrop={(event) => {
                  event.preventDefault();
                  onSetDraggedItemId(null);
                }}
                onDragEnd={() => onSetDraggedItemId(null)}
              >
                <AccordionSummary className={styles.itemSummary}>
                  <div className={styles.itemHead}>
                    <Typography className={styles.itemTitle}>آیتم {index + 1}</Typography>
                    <Typography className={styles.itemSubtitle}>
                      {item.title.trim() || "بدون عنوان"}
                    </Typography>
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
                          onSetDraggedItemId(item.id);
                          event.dataTransfer.effectAllowed = "move";
                          event.dataTransfer.setData("text/plain", item.id);
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
                            label="فایل آیتم"
                            file={item.file}
                            onChange={(file) => updateCurrentItem({ file })}
                            existingFile={buildExistingFilePreview(
                              item.fileAccessUrl,
                              item.title.trim() || "فایل آیتم",
                            )}
                            onExistingFileClear={() =>
                              updateCurrentItem({ fileAccessUrl: null })
                            }
                            accept="*/*"
                            allowedFormatsLabel="فرمت مجاز: همه"
                            maxSizeLabel="حداکثر: ۵۰MB"
                            dropTitle="انتخاب فایل آیتم"
                            mobileDropTitle="انتخاب فایل آیتم"
                            dropHint="هنگام ایجاد دوره آپلود می‌شود"
                            mobileDropHint="هنگام ایجاد دوره آپلود می‌شود"
                            removeLabel="حذف فایل"
                            invalidLabel="فایل معتبر نیست"
                            required
                          />
                        </div>
                      </Grid>
                    ) : null}
                    {item.contentType === "ARTICLE" ? (
                      <Grid item xs={12}>
                        <RichTextBox
                          label="متن مقاله"
                          value={item.article}
                          onChange={(nextValue) => updateCurrentItem({ article: nextValue })}
                          placeholder="متن مقاله را وارد کنید"
                          minRows={12}
                          required
                        />
                      </Grid>
                    ) : null}
                  </Grid>
                </AccordionDetails>
              </Accordion>
            </Fragment>
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
