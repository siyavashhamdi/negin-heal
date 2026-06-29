import { Chip } from "@mui/material";
import { type ReactElement } from "react";

import { PRODUCT_REVIEW_STAR_FILTER_OPTIONS } from "./product-reviews.api";
import styles from "./styles/ProductReviewsSection.module.scss";

type ProductReviewStarFiltersProps = {
  readonly activeStars: number | null;
  readonly onChange: (stars: number | null) => void;
  readonly disabled?: boolean;
};

const ProductReviewStarFilters = ({
  activeStars,
  onChange,
  disabled = false,
}: ProductReviewStarFiltersProps): ReactElement => {
  return (
    <div className={styles.starFilters} role="group" aria-label="فیلتر امتیاز">
      {PRODUCT_REVIEW_STAR_FILTER_OPTIONS.map((option) => {
        const isActive = activeStars === option.value;

        return (
          <Chip
            key={option.label}
            label={option.label}
            size="small"
            clickable={!disabled}
            disabled={disabled}
            color={isActive ? "primary" : "default"}
            variant={isActive ? "filled" : "outlined"}
            onClick={() => onChange(option.value)}
          />
        );
      })}
    </div>
  );
};

export default ProductReviewStarFilters;
