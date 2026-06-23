import { Chip } from "@mui/material";
import { type ReactElement } from "react";

import { COURSE_REVIEW_STAR_FILTER_OPTIONS } from "./course-reviews.api";
import styles from "./styles/CourseReviewsSection.module.scss";

type CourseReviewStarFiltersProps = {
  readonly activeStars: number | null;
  readonly onChange: (stars: number | null) => void;
  readonly disabled?: boolean;
};

const CourseReviewStarFilters = ({
  activeStars,
  onChange,
  disabled = false,
}: CourseReviewStarFiltersProps): ReactElement => {
  return (
    <div className={styles.starFilters} role="group" aria-label="فیلتر امتیاز">
      {COURSE_REVIEW_STAR_FILTER_OPTIONS.map((option) => {
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

export default CourseReviewStarFilters;
