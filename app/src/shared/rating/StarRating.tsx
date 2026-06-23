import StarRoundedIcon from "@mui/icons-material/StarRounded";
import StarBorderRoundedIcon from "@mui/icons-material/StarBorderRounded";
import { type CSSProperties, type ReactElement } from "react";

import { toPersianDigits } from "../../utilities/persian-digits.util";
import styles from "./StarRating.module.scss";

type StarRatingBaseProps = {
  readonly value: number;
  readonly max?: number;
  readonly size?: "small" | "medium" | "large";
  readonly className?: string;
  readonly ariaLabel?: string;
};

type StarRatingDisplayProps = StarRatingBaseProps & {
  readonly mode?: "display";
};

type StarRatingInputProps = StarRatingBaseProps & {
  readonly mode: "input";
  readonly onChange: (value: number) => void;
  readonly disabled?: boolean;
};

export type StarRatingProps = StarRatingDisplayProps | StarRatingInputProps;

function buildStarRatingLabel(value: number, max: number): string {
  const formatted = Number.isInteger(value)
    ? toPersianDigits(value)
    : toPersianDigits(value.toFixed(1));

  return `${formatted} از ${toPersianDigits(max)} ستاره`;
}

function getStarFillFraction(rating: number, starIndex: number): number {
  return Math.min(1, Math.max(0, rating - starIndex));
}

export function StarRating(props: StarRatingProps): ReactElement {
  const max = props.max ?? 5;
  const size = props.size ?? "medium";
  const isInput = props.mode === "input";
  const sizeClass =
    size === "small" ? styles.small : size === "large" ? styles.large : styles.medium;

  return (
    <div
      className={[styles.root, sizeClass, props.className].filter(Boolean).join(" ")}
      role={isInput ? "radiogroup" : "img"}
      aria-label={props.ariaLabel ?? buildStarRatingLabel(props.value, max)}
    >
      {Array.from({ length: max }, (_, index) => {
        const starValue = index + 1;
        const fillFraction = getStarFillFraction(props.value, index);
        const isFilled = fillFraction >= 1;
        const Icon = isFilled ? StarRoundedIcon : StarBorderRoundedIcon;

        if (isInput) {
          return (
            <button
              key={starValue}
              type="button"
              role="radio"
              aria-checked={props.value === starValue}
              aria-label={buildStarRatingLabel(starValue, max)}
              className={`${styles.starButton}${isFilled ? ` ${styles.starButtonFilled}` : ""}`}
              disabled={props.disabled}
              onClick={() => props.onChange(starValue)}
            >
              <Icon fontSize="inherit" />
            </button>
          );
        }

        if (fillFraction > 0 && fillFraction < 1) {
          return (
            <span key={starValue} className={styles.starIcon} aria-hidden="true">
              <StarBorderRoundedIcon fontSize="inherit" />
              <span
                className={styles.starFill}
                style={{ "--star-fill": String(fillFraction) } as CSSProperties}
              >
                <StarRoundedIcon fontSize="inherit" />
              </span>
            </span>
          );
        }

        return (
          <span
            key={starValue}
            className={`${styles.starIcon}${isFilled ? ` ${styles.starIconFilled}` : ""}`}
            aria-hidden="true"
          >
            <Icon fontSize="inherit" />
          </span>
        );
      })}
    </div>
  );
}

export default StarRating;
