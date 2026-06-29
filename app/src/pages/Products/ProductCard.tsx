import { useRef, type KeyboardEvent, type PointerEvent, type ReactElement } from "react";
import AutoStoriesRoundedIcon from "@mui/icons-material/AutoStoriesRounded";
import BoltRoundedIcon from "@mui/icons-material/BoltRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import DoNotDisturbOnRoundedIcon from "@mui/icons-material/DoNotDisturbOnRounded";
import EventRepeatRoundedIcon from "@mui/icons-material/EventRepeatRounded";
import OndemandVideoRoundedIcon from "@mui/icons-material/OndemandVideoRounded";
import PhotoRoundedIcon from "@mui/icons-material/PhotoRounded";
import VolumeUpRoundedIcon from "@mui/icons-material/VolumeUpRounded";
import { Chip } from "@mui/material";
import { OverflowTooltip } from "../../shared/OverflowTooltip";
import { CachedFileImage } from "../../shared/display/CachedFileImage";
import type { FileAccessUrl } from "../../utils/fileAccessUrl.util";
import type { ProductItemType, ProductListRecord, ProductReleaseType } from "./product-list.api";
import { getProductTagChipSx } from "./product-tag-colors.util";
import styles from "./styles/ProductCard.module.scss";
import AppTooltip from "../../shared/AppTooltip";

interface ProductCardProps {
  readonly item: ProductListRecord;
  readonly coverImageUrl?: string;
  readonly coverImageAccessUrl?: FileAccessUrl | null;
  readonly variant?: "management" | "public";
  readonly onOpen: () => void;
  readonly onKeyDown: (event: KeyboardEvent<HTMLElement>) => void;
  readonly onEdit?: (item: ProductListRecord) => void;
}

const RELEASE_TYPE_TOOLTIP_LABEL: Record<ProductReleaseType, string> = {
  IMMEDIATE: "نوع انتشار آنی",
  GRADUAL: "نوع انتشار تدریجی",
};

const ITEM_TYPE_LABEL: Record<ProductItemType, string> = {
  ARTICLE: "مقاله",
  VIDEO: "ویدیو",
  VOICE: "صوت",
  IMAGE: "تصویر",
};

const ITEM_TYPE_ICON: Record<ProductItemType, ReactElement> = {
  ARTICLE: <AutoStoriesRoundedIcon fontSize="small" />,
  VIDEO: <OndemandVideoRoundedIcon fontSize="small" />,
  VOICE: <VolumeUpRoundedIcon fontSize="small" />,
  IMAGE: <PhotoRoundedIcon fontSize="small" />,
};

const RELEASE_TYPE_ICON: Record<ProductReleaseType, ReactElement> = {
  IMMEDIATE: <BoltRoundedIcon fontSize="small" />,
  GRADUAL: <EventRepeatRoundedIcon fontSize="small" />,
};

function formatProductPrice(priceIrt: number | null): string {
  if (priceIrt == null || priceIrt === 0) {
    return "رایگان";
  }
  return `${priceIrt.toLocaleString("fa-IR").replace(/\u066c/g, ",")} تومان`;
}

function getDiscountedPrice(item: ProductListRecord): number | null {
  const price = item.priceIrt;
  const discount = item.discount;
  if (!price || !discount || discount.value <= 0) {
    return null;
  }

  const discountAmount =
    discount.type === "PERCENTAGE" ? price * (Math.min(discount.value, 100) / 100) : discount.value;
  const discountedPrice = Math.max(0, Math.round(price - discountAmount));

  return discountedPrice < price ? discountedPrice : null;
}

function formatDiscountLabel(item: ProductListRecord): string | null {
  const discount = item.discount;
  if (!discount || discount.value <= 0) {
    return null;
  }

  if (discount.type === "PERCENTAGE") {
    return `${Math.min(discount.value, 100).toLocaleString("fa-IR")}٪ تخفیف`;
  }

  return `${formatProductPrice(discount.value)} تخفیف`;
}

const ProductCard = ({
  item,
  coverImageUrl,
  coverImageAccessUrl,
  variant = "management",
  onOpen,
  onKeyDown,
  onEdit,
}: ProductCardProps): ReactElement => {
  const isManagement = variant === "management";
  const releaseTypeChipClass =
    item.releaseType === "GRADUAL" ? styles.releaseGradual : styles.releaseImmediate;
  const statusChipClass = item.isActive ? styles.statusActive : styles.statusInactive;
  const tagRowRef = useRef<HTMLDivElement>(null);
  const tagDragStateRef = useRef({
    pointerId: -1,
    startX: 0,
    startY: 0,
    startScrollLeft: 0,
    isHorizontalDrag: false,
    decided: false,
  });
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
      startY: event.clientY,
      startScrollLeft: tagRow.scrollLeft,
      isHorizontalDrag: false,
      decided: false,
    };
  };

  const resetTagDragState = (): void => {
    tagDragStateRef.current = {
      pointerId: -1,
      startX: 0,
      startY: 0,
      startScrollLeft: 0,
      isHorizontalDrag: false,
      decided: false,
    };
  };

  const handleTagPointerMove = (event: PointerEvent<HTMLDivElement>): void => {
    const tagRow = tagRowRef.current;
    const dragState = tagDragStateRef.current;
    if (!tagRow || dragState.pointerId !== event.pointerId) {
      return;
    }

    const deltaX = Math.abs(event.clientX - dragState.startX);
    const deltaY = Math.abs(event.clientY - dragState.startY);

    if (!dragState.decided) {
      if (deltaX < 6 && deltaY < 6) {
        return;
      }

      dragState.decided = true;
      dragState.isHorizontalDrag = deltaX > deltaY;

      if (!dragState.isHorizontalDrag) {
        tagRow.releasePointerCapture(event.pointerId);
        resetTagDragState();
        return;
      }
    }

    if (!dragState.isHorizontalDrag) {
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
    resetTagDragState();
  };

  const handleCardClick = (): void => {
    if (isManagement) {
      onEdit?.(item);
      return;
    }

    onOpen();
  };

  return (
    <article
      data-card-id={item.id}
      className={styles.productCard}
      role="button"
      tabIndex={0}
      onMouseDown={(event) => {
        if (event.button === 0) {
          event.preventDefault();
        }
      }}
      onClick={handleCardClick}
      onKeyDown={onKeyDown}
      aria-label={item.title}
    >
      <div className={styles.coverWrap}>
        {(coverImageAccessUrl || coverImageUrl) ? (
          <CachedFileImage
            accessUrl={coverImageAccessUrl}
            networkUrl={coverImageUrl}
            fileId={coverImageAccessUrl?.fileId}
            alt={item.title}
            className={styles.coverImage}
            loading="lazy"
          />
        ) : (
          <>
            <div className={styles.defaultCoverGlow} aria-hidden="true" />
            <span className={styles.defaultCoverIcon}>
              <AutoStoriesRoundedIcon />
            </span>
          </>
        )}

        <div className={styles.topChipsRow} onClick={(event) => event.stopPropagation()}>
          {isManagement ? (
            <AppTooltip
              title={item.isActive ? "وضعیت فعال" : "وضعیت غیرفعال"}
              arrow
              leaveTouchDelay={2200}
            >
              <span className={styles.statusChipWrap}>
                <Chip
                  size="small"
                  icon={
                    item.isActive ? (
                      <CheckCircleRoundedIcon fontSize="small" />
                    ) : (
                      <DoNotDisturbOnRoundedIcon fontSize="small" />
                    )
                  }
                  aria-label={item.isActive ? "وضعیت فعال" : "وضعیت غیرفعال"}
                  className={`${styles.iconOnlyChip} ${styles.statusChip} ${statusChipClass}`}
                />
              </span>
            </AppTooltip>
          ) : null}
          <AppTooltip
            title={RELEASE_TYPE_TOOLTIP_LABEL[item.releaseType]}
            arrow
            leaveTouchDelay={2200}
          >
            <span className={styles.releaseTypeChipWrap}>
              <Chip
                size="small"
                icon={RELEASE_TYPE_ICON[item.releaseType]}
                aria-label={RELEASE_TYPE_TOOLTIP_LABEL[item.releaseType]}
                className={`${styles.iconOnlyChip} ${styles.releaseTypeChip} ${releaseTypeChipClass}`}
              />
            </span>
          </AppTooltip>
        </div>

        <div className={styles.coverContent}>
          <h3>
            <OverflowTooltip className={styles.titleText} title={item.title}>
              {item.title}
            </OverflowTooltip>
          </h3>
          {item.description?.trim() ? (
            <p>
              <OverflowTooltip className={styles.descriptionText} title={item.description.trim()}>
                {item.description.trim()}
              </OverflowTooltip>
            </p>
          ) : null}
          <div className={styles.coverMeta}>
            <span>{item.chapterCount} فصل</span>
            <span className={styles.coverMetaSeparator}>/</span>
            <span>{item.itemCount} آیتم</span>
          </div>
          {item.itemTypes.length > 0 ? (
            <div className={styles.itemTypeChipsRow}>
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
            </div>
          ) : null}
          {item.tags.length > 0 ? (
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
                  className={`${styles.tagChip} ${styles.overlayTagChip}`}
                  sx={getProductTagChipSx(tag)}
                />
              ))}
            </div>
          ) : null}
        </div>

        <div className={styles.priceFooter}>
          <div className={styles.priceBarBackdrop} aria-hidden="true">
            {(coverImageAccessUrl || coverImageUrl) ? (
              <CachedFileImage
                accessUrl={coverImageAccessUrl}
                networkUrl={coverImageUrl}
                fileId={coverImageAccessUrl?.fileId}
                alt=""
                className={styles.priceBarCoverImage}
                loading="eager"
              />
            ) : (
              <span className={styles.priceBarCoverFallback} />
            )}
            <span className={styles.priceBarBackdropScrim} />
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
                : `قیمت: ${formatProductPrice(discountedPrice ?? item.priceIrt)}`
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
                      {discountLabel ? (
                        <span className={styles.discountBadge}>{discountLabel}</span>
                      ) : null}
                      <span className={styles.originalPriceText}>
                        {formatProductPrice(item.priceIrt)}
                      </span>
                    </span>
                  )}
                  <span className={styles.priceText}>
                    {formatProductPrice(discountedPrice ?? item.priceIrt)}
                  </span>
                </span>
              </>
            )}
          </div>
        </div>
      </div>
    </article>
  );
};

export default ProductCard;
