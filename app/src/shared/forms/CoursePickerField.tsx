import { useEffect, useMemo, type ReactElement, type ReactNode } from "react";
import { useQuery } from "@apollo/client/react";

import { COURSE_LIST_QUERY } from "../../graphql/queries/courseList.query";
import type {
  CourseListQuery,
  CourseListQueryVariables,
} from "../../pages/Courses/courses-list.api";
import EntityAutocompleteField from "./EntityAutocompleteField";
import {
  calculateDiscountedCoursePrice,
  createFallbackCoursePickerOption,
  mapCourseRowToPickerOption,
  type CoursePickerOption,
} from "./course-picker.util";

const DEFAULT_COURSE_PICKER_LIMIT = 200;

type CourseListFilters = NonNullable<CourseListQueryVariables["input"]["filters"]>;
type CourseListSort = NonNullable<CourseListQueryVariables["input"]["options"]["sort"]>;

type BaseCoursePickerFieldProps = {
  readonly enabled: boolean;
  readonly label: string;
  readonly placeholder?: string;
  readonly helperText?: ReactNode;
  readonly noOptionsText?: string;
  readonly loadErrorText?: string;
  readonly required?: boolean;
  readonly disabled?: boolean;
  readonly filters?: CourseListFilters;
  readonly limit?: number;
  readonly sort?: CourseListSort;
  readonly onlyPurchasable?: boolean;
};

export type CoursePickerFieldProps =
  | (BaseCoursePickerFieldProps & {
      readonly multiple?: false;
      readonly value: CoursePickerOption | null;
      readonly onChange: (value: CoursePickerOption | null) => void;
    })
  | (BaseCoursePickerFieldProps & {
      readonly multiple: true;
      readonly value: readonly string[];
      readonly onChange: (value: string[]) => void;
    });

function CoursePickerField(props: CoursePickerFieldProps): ReactElement {
  const {
    enabled,
    label,
    placeholder,
    helperText,
    noOptionsText = "دوره‌ای پیدا نشد.",
    loadErrorText = "دریافت فهرست دوره‌ها انجام نشد.",
    required = false,
    disabled = false,
    filters,
    limit = DEFAULT_COURSE_PICKER_LIMIT,
    sort = { title: "ASC" },
    onlyPurchasable = false,
    multiple = false,
    value,
    onChange,
  } = props;

  const variables = useMemo<CourseListQueryVariables>(
    () => ({
      input: {
        filters: filters ?? {},
        options: {
          limit,
          sort,
        },
      },
    }),
    [filters, limit, sort]
  );

  const { data, loading, error } = useQuery<CourseListQuery, CourseListQueryVariables>(
    COURSE_LIST_QUERY,
    {
      variables,
      skip: !enabled,
      fetchPolicy: multiple ? "cache-and-network" : "network-only",
    }
  );

  const options = useMemo<readonly CoursePickerOption[]>(() => {
    let items = data?.courseList.items ?? [];

    if (onlyPurchasable) {
      items = items
        .filter((course) => course.isActive !== false)
        .filter((course) => calculateDiscountedCoursePrice(course) > 0);
    }

    return items.map(mapCourseRowToPickerOption);
  }, [data?.courseList.items, onlyPurchasable]);

  const resolvedNoOptionsText = error ? loadErrorText : noOptionsText;

  const selectedMultipleOptions = useMemo(() => {
    if (!multiple) {
      return [];
    }

    const optionsById = new Map(options.map((option) => [option.id, option]));

    return value.map(
      (courseId) => optionsById.get(courseId) ?? createFallbackCoursePickerOption(courseId)
    );
  }, [multiple, options, value]);

  useEffect(() => {
    if (multiple || !value || loading || options.length === 0) {
      return;
    }

    if (!options.some((option) => option.id === value.id)) {
      onChange(null);
    }
  }, [loading, multiple, onChange, options, value]);

  if (multiple) {
    return (
      <EntityAutocompleteField
        multiple
        options={options}
        value={selectedMultipleOptions}
        onChange={(nextValue) => onChange(nextValue.map((option) => option.id))}
        label={label}
        placeholder={placeholder}
        helperText={helperText}
        noOptionsText={resolvedNoOptionsText}
        loading={loading}
        required={required}
        disabled={disabled}
        imageVariant="rounded"
      />
    );
  }

  return (
    <EntityAutocompleteField
      options={options}
      value={value}
      onChange={onChange}
      label={label}
      placeholder={placeholder}
      helperText={helperText}
      noOptionsText={resolvedNoOptionsText}
      loading={loading}
      required={required}
      disabled={disabled}
      imageVariant="rounded"
    />
  );
}

export default CoursePickerField;
