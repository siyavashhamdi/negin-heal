import { FormControl, MenuItem, Select } from "@mui/material";
import { type ReactElement } from "react";

import {
  COURSE_REVIEW_VISIBILITY_OPTIONS,
  type CourseReviewVisibility,
} from "./course-reviews.api";
import styles from "./styles/CourseReviewsSection.module.scss";

type CourseReviewModerationSelectProps = {
  readonly value: CourseReviewVisibility;
  readonly disabled?: boolean;
  readonly options?: ReadonlyArray<{
    readonly value: CourseReviewVisibility;
    readonly label: string;
  }>;
  readonly onChange: (visibility: CourseReviewVisibility) => void;
};

const CourseReviewModerationSelect = ({
  value,
  disabled = false,
  options = COURSE_REVIEW_VISIBILITY_OPTIONS,
  onChange,
}: CourseReviewModerationSelectProps): ReactElement => {
  return (
    <FormControl
      size="small"
      className={styles.reviewModerationSelect}
      disabled={disabled}
    >
      <Select
        value={value}
        variant="outlined"
        onChange={(event) => onChange(event.target.value as CourseReviewVisibility)}
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

export default CourseReviewModerationSelect;
