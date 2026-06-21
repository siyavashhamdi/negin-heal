import { useEffect, useRef, type DragEvent, type ReactElement } from "react";
import {
  Button,
  Divider,
  FormControl,
  FormControlLabel,
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Switch,
  TextField,
  Typography,
} from "@mui/material";
import { OverflowTooltip } from "../../../shared/OverflowTooltip";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import MenuBookRoundedIcon from "@mui/icons-material/MenuBookRounded";
import ItemsSection from "./ItemsSection";
import { setDragTransferData } from "./reorder-drag.util";
import type {
  DraftChapter,
  DraftItem,
  ExpandedItemByChapter,
  VisibleAfterUnit,
} from "./types";
import type { UploadProgressEntry } from "../../../utils/uploadProgress.util";
import styles from "./styles/ChaptersSection.module.scss";

type ChaptersSectionProps = {
  readonly chapters: DraftChapter[];
  readonly activeChapter: DraftChapter | undefined;
  readonly activeChapterIndex: number;
  readonly expandedItemByChapter: ExpandedItemByChapter;
  readonly hasPositivePrice: boolean;
  readonly onAddChapter: () => void;
  readonly onSelectChapterIndex: (nextIndex: number) => void;
  readonly onSetDraggedChapterId: (chapterId: string | null) => void;
  readonly onChapterDragOver: (
    event: DragEvent<HTMLButtonElement>,
    targetChapterId: string,
  ) => void;
  readonly onRemoveChapter: (chapterId: string) => void;
  readonly onUpdateChapter: (chapterId: string, patch: Partial<DraftChapter>) => void;
  readonly onSetExpandedItemByChapter: (chapterId: string, itemId: string | null) => void;
  readonly onSetDraggedItemId: (itemId: string | null) => void;
  readonly onItemDragOver: (
    event: DragEvent<HTMLDivElement>,
    chapterId: string,
    targetItemId: string,
  ) => void;
  readonly onUpdateItem: (chapterId: string, itemId: string, patch: Partial<DraftItem>) => void;
  readonly onAddItem: (chapterId: string) => void;
  readonly onRemoveItem: (chapterId: string, itemId: string) => void;
  readonly stripNumberSeparators: (value: string) => string;
  readonly uploadProgressByFieldId?: Readonly<Record<string, UploadProgressEntry>>;
};

const ChaptersSection = ({
  chapters,
  activeChapter,
  activeChapterIndex,
  expandedItemByChapter,
  hasPositivePrice,
  onAddChapter,
  onSelectChapterIndex,
  onSetDraggedChapterId,
  onChapterDragOver,
  onRemoveChapter,
  onUpdateChapter,
  onSetExpandedItemByChapter,
  onSetDraggedItemId,
  onItemDragOver,
  onUpdateItem,
  onAddItem,
  onRemoveItem,
  stripNumberSeparators,
  uploadProgressByFieldId = {},
}: ChaptersSectionProps): ReactElement => {
  const chapterStepsRailRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const scrollActiveChapterStepIntoView = (): void => {
      const rail = chapterStepsRailRef.current;
      if (!rail) {
        return;
      }

      const activeStep = rail.querySelector(`.${styles.chapterStepButtonActive}`);
      if (!(activeStep instanceof HTMLElement)) {
        return;
      }

      const railRect = rail.getBoundingClientRect();
      const stepRect = activeStep.getBoundingClientRect();
      const isRtl = getComputedStyle(rail).direction === "rtl";
      const inlineEndDelta = isRtl
        ? stepRect.left - railRect.left
        : stepRect.right - railRect.right;

      if (Math.abs(inlineEndDelta) < 1) {
        return;
      }

      rail.scrollTo({ left: rail.scrollLeft + inlineEndDelta, behavior: "smooth" });
    };

    scrollActiveChapterStepIntoView();
    const rafId = requestAnimationFrame(scrollActiveChapterStepIntoView);

    return () => {
      cancelAnimationFrame(rafId);
    };
  }, [activeChapterIndex, chapters.length]);

  const updateActiveChapter = (patch: Partial<DraftChapter>): void => {
    if (!activeChapter) {
      return;
    }
    onUpdateChapter(activeChapter.id, patch);
  };

  const handleVisibleAfterMinutesChange = (value: string): void => {
    updateActiveChapter({
      visibleAfterMinutes: stripNumberSeparators(value).replace(/\D/g, ""),
    });
  };

  const handleVisibleAfterUnitChange = (unit: VisibleAfterUnit): void => {
    updateActiveChapter({ visibleAfterUnit: unit });
  };

  const handleExpandedItemChange = (itemId: string | null): void => {
    if (!activeChapter) {
      return;
    }
    onSetExpandedItemByChapter(activeChapter.id, itemId);
  };

  return (
    <section className={styles.section}>
      <div className={styles.sectionHead}>
        <Typography className={styles.sectionTitle}>فصل‌ها</Typography>
        <Button
          variant="outlined"
          size="small"
          startIcon={<MenuBookRoundedIcon />}
          onClick={onAddChapter}
        >
          افزودن فصل
        </Button>
      </div>

      <div ref={chapterStepsRailRef} className={styles.chapterStepsRail}>
        {chapters.map((chapter, index) => (
          <div
            key={chapter.id}
            className={`${styles.chapterStepWrap}${index <= activeChapterIndex ? ` ${styles.isReached}` : ""}`}
          >
            {index > 0 ? (
              <span
                className={`${styles.stepConnector}${index <= activeChapterIndex ? ` ${styles.stepConnectorActive}` : ""}`}
              />
            ) : null}
            <button
              type="button"
              className={`${styles.chapterStepButton}${
                index === activeChapterIndex ? ` ${styles.chapterStepButtonActive}` : ""
              }`}
              onClick={() => onSelectChapterIndex(index)}
              draggable
              onDragStart={(event) => {
                setDragTransferData(event, chapter.id);
                onSetDraggedChapterId(chapter.id);
              }}
              onDragOver={(event) => {
                onChapterDragOver(event, chapter.id);
              }}
              onDrop={(event) => {
                event.preventDefault();
                onSetDraggedChapterId(null);
              }}
              onDragEnd={() => onSetDraggedChapterId(null)}
            >
              <span className={styles.chapterStepNumber}>{index + 1}</span>
              <OverflowTooltip
                className={styles.chapterStepTitle}
                title={chapter.title.trim() || `فصل ${index + 1}`}
              >
                {chapter.title.trim() || `فصل ${index + 1}`}
              </OverflowTooltip>
            </button>
          </div>
        ))}
      </div>

      {activeChapter ? (
        <Paper variant="outlined" className={styles.chapterPanel}>
          <div className={styles.chapterHead}>
            <IconButton
              size="small"
              color="error"
              onClick={() => onRemoveChapter(activeChapter.id)}
              disabled={chapters.length <= 1}
            >
              <DeleteOutlineRoundedIcon fontSize="small" />
            </IconButton>
          </div>
          <Grid container spacing={1.25}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                required
                label="عنوان فصل"
                value={activeChapter.title}
                onChange={(event) => updateActiveChapter({ title: event.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                minRows={2}
                label="توضیحات فصل"
                value={activeChapter.description}
                onChange={(event) => updateActiveChapter({ description: event.target.value })}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <Grid container spacing={1}>
                <Grid item xs={7}>
                  <TextField
                    fullWidth
                    label="نمایش بعد از"
                    value={activeChapter.visibleAfterMinutes}
                    onChange={(event) => handleVisibleAfterMinutesChange(event.target.value)}
                    inputProps={{ inputMode: "numeric" }}
                  />
                </Grid>
                <Grid item xs={5}>
                  <FormControl fullWidth>
                    <InputLabel>واحد</InputLabel>
                    <Select
                      value={activeChapter.visibleAfterUnit}
                      label="واحد"
                      onChange={(event) =>
                        handleVisibleAfterUnitChange(event.target.value as VisibleAfterUnit)
                      }
                    >
                      <MenuItem value="MINUTES">دقیقه</MenuItem>
                      <MenuItem value="HOURS">ساعت</MenuItem>
                      <MenuItem value="DAYS">روز</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            </Grid>
            {hasPositivePrice ? (
              <Grid item xs={12} md={3}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={activeChapter.isFree}
                      onChange={(event) => updateActiveChapter({ isFree: event.target.checked })}
                    />
                  }
                  label="فصل رایگان"
                />
              </Grid>
            ) : null}
          </Grid>

          <Divider className={styles.innerDivider} />

          <ItemsSection
            chapter={activeChapter}
            expandedItemId={expandedItemByChapter[activeChapter.id] ?? null}
            onExpandedItemChange={handleExpandedItemChange}
            onSetDraggedItemId={onSetDraggedItemId}
            onItemDragOver={onItemDragOver}
            onUpdateItem={onUpdateItem}
            onAddItem={onAddItem}
            onRemoveItem={onRemoveItem}
            uploadProgressByFieldId={uploadProgressByFieldId}
          />
        </Paper>
      ) : null}
    </section>
  );
};

export default ChaptersSection;
