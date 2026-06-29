import { useEffect, useMemo, type ReactElement, type ReactNode } from "react";
import { useQuery } from "@apollo/client/react";

import { PRODUCT_LIST_QUERY } from "../../graphql/queries/productList.query";
import type {
  ProductListQuery,
  ProductListQueryVariables,
} from "../../pages/Products/product-list.api";
import EntityAutocompleteField from "./EntityAutocompleteField";
import {
  calculateDiscountedProductPrice,
  createFallbackProductPickerOption,
  mapProductRowToPickerOption,
  type ProductPickerOption,
} from "./product-picker.util";

const DEFAULT_PRODUCT_PICKER_LIMIT = 200;

type ProductListFilters = NonNullable<ProductListQueryVariables["input"]["filters"]>;
type ProductListSort = NonNullable<ProductListQueryVariables["input"]["options"]["sort"]>;

type BaseProductPickerFieldProps = {
  readonly enabled: boolean;
  readonly label: string;
  readonly placeholder?: string;
  readonly helperText?: ReactNode;
  readonly noOptionsText?: string;
  readonly loadErrorText?: string;
  readonly required?: boolean;
  readonly disabled?: boolean;
  readonly filters?: ProductListFilters;
  readonly limit?: number;
  readonly sort?: ProductListSort;
  readonly onlyPurchasable?: boolean;
};

export type ProductPickerFieldProps =
  | (BaseProductPickerFieldProps & {
      readonly multiple?: false;
      readonly value: ProductPickerOption | null;
      readonly onChange: (value: ProductPickerOption | null) => void;
    })
  | (BaseProductPickerFieldProps & {
      readonly multiple: true;
      readonly value: readonly string[];
      readonly onChange: (value: string[]) => void;
    });

function ProductPickerField(props: ProductPickerFieldProps): ReactElement {
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
    limit = DEFAULT_PRODUCT_PICKER_LIMIT,
    sort = { title: "ASC" },
    onlyPurchasable = false,
    multiple = false,
    value,
    onChange,
  } = props;

  const variables = useMemo<ProductListQueryVariables>(
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

  const { data, loading, error } = useQuery<ProductListQuery, ProductListQueryVariables>(
    PRODUCT_LIST_QUERY,
    {
      variables,
      skip: !enabled,
      fetchPolicy: multiple ? "cache-and-network" : "network-only",
    }
  );

  const options = useMemo<readonly ProductPickerOption[]>(() => {
    let items = data?.productList.items ?? [];

    if (onlyPurchasable) {
      items = items
        .filter((product) => product.isActive !== false)
        .filter((product) => calculateDiscountedProductPrice(product) > 0);
    }

    return items.map(mapProductRowToPickerOption);
  }, [data?.productList.items, onlyPurchasable]);

  const resolvedNoOptionsText = error ? loadErrorText : noOptionsText;

  const selectedMultipleOptions = useMemo(() => {
    if (!multiple) {
      return [];
    }

    const optionsById = new Map(options.map((option) => [option.id, option]));

    return value.map(
      (productId) => optionsById.get(productId) ?? createFallbackProductPickerOption(productId)
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

export default ProductPickerField;
