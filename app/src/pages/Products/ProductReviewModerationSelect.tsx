import { FormControl, MenuItem, Select } from "@mui/material";
import { type ReactElement } from "react";

import {
  PRODUCT_REVIEW_VISIBILITY_OPTIONS,
  type ProductReviewVisibility,
} from "./product-reviews.api";
import styles from "./styles/ProductReviewsSection.module.scss";

type ProductReviewModerationSelectProps = {
  readonly value: ProductReviewVisibility;
  readonly disabled?: boolean;
  readonly options?: ReadonlyArray<{
    readonly value: ProductReviewVisibility;
    readonly label: string;
  }>;
  readonly onChange: (visibility: ProductReviewVisibility) => void;
};

const ProductReviewModerationSelect = ({
  value,
  disabled = false,
  options = PRODUCT_REVIEW_VISIBILITY_OPTIONS,
  onChange,
}: ProductReviewModerationSelectProps): ReactElement => {
  return (
    <FormControl
      size="small"
      className={styles.reviewModerationSelect}
      disabled={disabled}
      dir="rtl"
    >
      <Select
        value={value}
        variant="outlined"
        onChange={(event) => onChange(event.target.value as ProductReviewVisibility)}
        className={styles.reviewModerationSelectInput}
        classes={{
          select: styles.reviewModerationSelectValue,
        }}
        MenuProps={{
          PaperProps: {
            className: styles.reviewModerationSelectMenu,
          },
        }}
        inputProps={{
          "aria-label": "وضعیت نمایش",
        }}
      >
        {options.map((option) => (
          <MenuItem
            key={option.value}
            value={option.value}
            className={styles.reviewModerationSelectMenuItem}
          >
            {option.label}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
};

export default ProductReviewModerationSelect;
