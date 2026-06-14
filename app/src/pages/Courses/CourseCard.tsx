import {
  useCallback,
  useLayoutEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type PointerEvent,
  type ReactElement,
  type ReactNode,
} from "react";
import AutoStoriesRoundedIcon from "@mui/icons-material/AutoStoriesRounded";
import BoltRoundedIcon from "@mui/icons-material/BoltRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import DoNotDisturbOnRoundedIcon from "@mui/icons-material/DoNotDisturbOnRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import EventRepeatRoundedIcon from "@mui/icons-material/EventRepeatRounded";
import ImageNotSupportedRoundedIcon from "@mui/icons-material/ImageNotSupportedRounded";
import OndemandVideoRoundedIcon from "@mui/icons-material/OndemandVideoRounded";
import PhotoRoundedIcon from "@mui/icons-material/PhotoRounded";
import VolumeUpRoundedIcon from "@mui/icons-material/VolumeUpRounded";
import DeleteRoundedIcon from "@mui/icons-material/DeleteRounded";
import { Button, Chip, Tooltip } from "@mui/material";
import type { CourseItemType, CourseListRecord, CourseReleaseType } from "./courses-list.api";
import { getCourseTagChipSx } from "./course-tag-colors.util";
import styles from "./styles/CourseCard.module.scss";

interface CourseCardProps {
  readonly item: CourseListRecord;
  readonly coverImageUrl?: string;
  readonly variant?: "management" | "public";
  readonly isFlipped?: boolean;
  readonly onOpen: () => void;
  readonly onFlip?: () => void;
  readonly onKeyDown: (event: KeyboardEvent<HTMLElement>) => void;
  readonly onEdit?: (item: CourseListRecord) => void;
  readonly onDelete?: (item: CourseListRecord) => void;
}

const RELEASE_TYPE_LABEL: Record<CourseReleaseType, string> = {
  IMMEDIATE: "فوری",
  GRADUAL: "تدریجی",
};

const ITEM_TYPE_LABEL: Record<CourseItemType, string> = {
  ARTICLE: "مقاله",
  VIDEO: "ویدیو",
  VOICE: "صوت",
  IMAGE: "تصویر",
};

const ITEM_TYPE_ICON: Record<CourseItemType, ReactElement> = {
  ARTICLE: <AutoStoriesRoundedIcon fontSize="small" />,
  VIDEO: <OndemandVideoRoundedIcon fontSize="small" />,
  VOICE: <VolumeUpRoundedIcon fontSize="small" />,
  IMAGE: <PhotoRoundedIcon fontSize="small" />,
};

const RELEASE_TYPE_ICON: Record<CourseReleaseType, ReactElement> = {
  IMMEDIATE: <BoltRoundedIcon fontSize="small" />,
  GRADUAL: <EventRepeatRoundedIcon fontSize="small" />,
};

function formatCoursePrice(priceIrt: number | null): string {
  if (priceIrt == null || priceIrt === 0) {
    return "رایگان";
  }
  return `${priceIrt.toLocaleString("fa-IR").replace(/\u066c/g, ",")} تومان`;
}

function getDiscountedPrice(item: CourseListRecord): number | null {
  const price = item.priceIrt;
  const discount = item.discount;
  if (!price || !discount || discount.value <= 0) {
    return null;
  }

  const discountAmount =
    discount.type === "PERCENTAGE"
      ? price * (Math.min(discount.value, 100) / 100)
      : discount.value;
  const discountedPrice = Math.max(0, Math.round(price - discountAmount));

  return discountedPrice < price ? discountedPrice : null;
}

function formatDiscountLabel(item: CourseListRecord): string | null {
  const discount = item.discount;
  if (!discount || discount.value <= 0) {
    return null;
  }

  if (discount.type === "PERCENTAGE") {
    return `${Math.min(discount.value, 100).toLocaleString("fa-IR")}٪ تخفیف`;
  }

  return `${formatCoursePrice(discount.value)} تخفیف`;
}

function OverflowTooltip({
  children,
  className,
  title,
}: {
  readonly children: ReactNode;
  readonly className?: string;
  readonly title: string;
}): ReactElement {
  const contentRef = useRef<HTMLSpanElement>(null);
  const [isOverflowing, setIsOverflowing] = useState(false);

  const updateOverflowState = useCallback((): void => {
    const element = contentRef.current;
    if (!element) {
      return;
    }
    setIsOverflowing(element.scrollWidth > element.clientWidth + 1 || element.scrollHeight > element.clientHeight + 1);
  }, []);

  useLayoutEffect(() => {
    updateOverflowState();
    const element = contentRef.current;
    if (!element) {
      return;
    }
    const resizeObserver = new ResizeObserver(updateOverflowState);
    resizeObserver.observe(element);
    return () => {
      resizeObserver.disconnect();
    };
  }, [children, updateOverflowState]);

  return (
    <Tooltip
      title={title}
      arrow
      disableHoverListener={!isOverflowing}
      disableFocusListener={!isOverflowing}
      disableTouchListener={!isOverflowing}
    >
      <span ref={contentRef} className={className}>
        {children}
      </span>
    </Tooltip>
  );
}

const CourseCard = ({
  item,
  coverImageUrl,
  variant = "management",
  isFlipped = false,
  onOpen,
  onFlip,
  onKeyDown,
  onEdit,
  onDelete,
}: CourseCardProps): ReactElement => {
  const isManagement = variant === "management";
  const releaseTypeChipClass =
    item.releaseType === "GRADUAL" ? styles.releaseGradual : styles.releaseImmediate;
  const statusChipClass = item.isActive ? styles.statusActive : styles.statusInactive;
  const tagRowRef = useRef<HTMLDivElement>(null);
  const tagDragStateRef = useRef({ pointerId: -1, startX: 0, startScrollLeft: 0 });
  const discountedPrice = getDiscountedPrice(item);
  const discountLabel = discountedPrice == null ? null : formatDiscountLabel(item);

  const handleTagPointerDown = (event: PointerEvent<HTMLDivElement>): void => {
    const tagRow = tagRowRef.current;
    if (!tagRow) {
      return;
    }
    event.stopPropagation();
    tagRow.setPointerCapture(event.pointerId);
    tagDragStateRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startScrollLeft: tagRow.scrollLeft,
    };
  };

  const handleTagPointerMove = (event: PointerEvent<HTMLDivElement>): void => {
    const tagRow = tagRowRef.current;
    const dragState = tagDragStateRef.current;
    if (!tagRow || dragState.pointerId !== event.pointerId) {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    tagRow.scrollLeft = dragState.startScrollLeft + dragState.startX - event.clientX;
  };

  const handleTagPointerEnd = (event: PointerEvent<HTMLDivElement>): void => {
    const tagRow = tagRowRef.current;
    if (tagDragStateRef.current.pointerId !== event.pointerId) {
      return;
    }
    event.stopPropagation();
    tagRow?.releasePointerCapture(event.pointerId);
    tagDragStateRef.current = { pointerId: -1, startX: 0, startScrollLeft: 0 };
  };

  return (
    <article
      data-card-id={item.id}
      className={`${styles.flipCard}${isManagement && isFlipped ? ` ${styles.isFlipped}` : ""}`}
      role="button"
      tabIndex={0}
      onClick={isManagement ? onFlip : onOpen}
      onKeyDown={onKeyDown}
      aria-label={item.title}
    >
      <div className={styles.flipInner}>
        <div className={`${styles.flipFace} ${styles.flipFaceFront}`}>
          <div className={styles.coverWrap}>
            {coverImageUrl ? (
              <img src={coverImageUrl} alt={item.title} className={styles.coverImage} loading="lazy" />
            ) : (
              <span className={styles.defaultCoverIcon}>
                <ImageNotSupportedRoundedIcon />
              </span>
            )}
            <Tooltip title="نوع انتشار" arrow>
              <span className={styles.releaseTypeChipWrap} onClick={(event) => event.stopPropagation()}>
                <Chip
                  size="small"
                  icon={RELEASE_TYPE_ICON[item.releaseType]}
                  label={RELEASE_TYPE_LABEL[item.releaseType]}
                  className={`${styles.releaseTypeChip} ${releaseTypeChipClass}`}
                />
              </span>
            </Tooltip>
            {isManagement ? (
              <Tooltip title="وضعیت" arrow>
                <span className={styles.statusChipWrap} onClick={(event) => event.stopPropagation()}>
                  <Chip
                    size="small"
                    icon={item.isActive ? <CheckCircleRoundedIcon /> : <DoNotDisturbOnRoundedIcon />}
                    label={item.isActive ? "فعال" : "غیرفعال"}
                    className={`${styles.statusChip} ${statusChipClass}`}
                  />
                </span>
              </Tooltip>
            ) : null}
            <div className={styles.coverStats}>
              <span>{item.chapterCount} فصل</span>
              <span className={styles.coverStatsSeparator}>/</span>
              <span>{item.itemCount} آیتم</span>
            </div>
          </div>

          <div className={styles.frontBody}>
            <h3>
              <OverflowTooltip className={styles.titleText} title={item.title}>
                {item.title}
              </OverflowTooltip>
            </h3>
            <p>
              <OverflowTooltip className={styles.descriptionText} title={item.description || "بدون توضیحات"}>
                {item.description || "بدون توضیحات"}
              </OverflowTooltip>
            </p>
            <div className={styles.itemTypeChips}>
              {item.itemTypes.map((type) => (
                <Chip
                  key={`${item.id}-${type}`}
                  size="small"
                  icon={ITEM_TYPE_ICON[type]}
                  label={ITEM_TYPE_LABEL[type]}
                  variant="outlined"
                  className={styles.itemTypeChip}
                />
              ))}
            </div>
            <div
              ref={tagRowRef}
              className={styles.tagRow}
              onClick={(event) => event.stopPropagation()}
              onPointerDown={handleTagPointerDown}
              onPointerMove={handleTagPointerMove}
              onPointerUp={handleTagPointerEnd}
              onPointerCancel={handleTagPointerEnd}
            >
              {item.tags.map((tag) => (
                <Chip
                  key={`${item.id}-tag-${tag}`}
                  size="small"
                  label={
                    <OverflowTooltip className={styles.tagText} title={tag}>
                      {tag}
                    </OverflowTooltip>
                  }
                  variant="outlined"
                  className={styles.tagChip}
                  sx={getCourseTagChipSx(tag)}
                />
              ))}
            </div>
            <div
              className={`${styles.priceBar}${
                item.isPurchased
                  ? ` ${styles.priceBarPurchased}`
                  : discountedPrice == null
                    ? ""
                    : ` ${styles.priceBarDiscounted}`
              }`}
              aria-label={
                item.isPurchased
                  ? "وضعیت: خریداری شده"
                  : `قیمت: ${formatCoursePrice(discountedPrice ?? item.priceIrt)}`
              }
            >
              {item.isPurchased ? (
                <>
                  <span className={styles.priceBarLabel}>وضعیت دوره</span>
                  <span className={styles.purchasedContent}>
                    <CheckCircleRoundedIcon fontSize="small" />
                    <span>خریداری شده</span>
                  </span>
                </>
              ) : (
                <>
                  <span className={styles.priceBarLabel}>قیمت دوره</span>
                  <span className={styles.priceContent}>
                    {discountedPrice == null ? null : (
                      <span className={styles.originalPriceRow}>
                        {discountLabel ? <span className={styles.discountBadge}>{discountLabel}</span> : null}
                        <span className={styles.originalPriceText}>
                          {formatCoursePrice(item.priceIrt)}
                        </span>
                      </span>
                    )}
                    <span className={styles.priceText}>
                      {formatCoursePrice(discountedPrice ?? item.priceIrt)}
                    </span>
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {isManagement ? (
          <div className={`${styles.flipFace} ${styles.flipFaceBack}`}>
            <div className={styles.backActions}>
              <Button
                type="button"
                variant="outlined"
                startIcon={<EditRoundedIcon />}
                onClick={(event) => {
                  event.stopPropagation();
                  onEdit?.(item);
                }}
              >
                ویرایش
              </Button>
              <Button
                type="button"
                variant="contained"
                color="error"
                startIcon={<DeleteRoundedIcon />}
                onClick={(event) => {
                  event.stopPropagation();
                  onDelete?.(item);
                }}
              >
                حذف
              </Button>
            </div>
          </div>
        ) : null}
      </div>
    </article>
  );
};

export default CourseCard;
