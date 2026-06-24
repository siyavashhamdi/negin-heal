export type TfLabelVariant = "yesNo" | "hasNot";

type TFunction = (key: string) => string;

const TF_VARIANT_I18N_KEY: Record<TfLabelVariant, { yes: string; no: string }> = {
  yesNo: {
    yes: "table.tfFlags.yesNo.yes",
    no: "table.tfFlags.yesNo.no",
  },
  hasNot: {
    yes: "table.tfFlags.hasNot.yes",
    no: "table.tfFlags.hasNot.no",
  },
};

/** Infer بلی/خیر vs دارد/ندارد from field/column name. */
export function inferTfLabelVariant(fieldName: string): TfLabelVariant {
  const lower = fieldName.trim().toLowerCase();

  if (
    lower.startsWith("has") ||
    lower.startsWith("enable") ||
    lower === "torefer" ||
    lower.endsWith("debt")
  ) {
    return "hasNot";
  }

  return "yesNo";
}

export function normalizeTfValue(value: string | null | undefined): "t" | "f" | null {
  const v = (value ?? "").trim().toLowerCase();
  if (v === "t" || v === "y" || v === "1" || v === "true") {
    return "t";
  }
  if (v === "f" || v === "n" || v === "0" || v === "false") {
    return "f";
  }
  return null;
}

export function parseTfFlag(raw: string | null | undefined): boolean | null {
  const normalized = normalizeTfValue(raw);
  if (normalized === "t") {
    return true;
  }
  if (normalized === "f") {
    return false;
  }
  return null;
}

function resolveVariant(variant?: TfLabelVariant, fieldName?: string): TfLabelVariant {
  if (variant != null) {
    return variant;
  }
  return inferTfLabelVariant(fieldName ?? "");
}

export function tfFlagLabel(
  value: string | null | undefined,
  t: TFunction,
  options?: { variant?: TfLabelVariant; fieldName?: string; empty?: string }
): string {
  const empty = options?.empty ?? "—";
  const variant = resolveVariant(options?.variant, options?.fieldName);
  const normalized = normalizeTfValue(value);
  if (normalized === "t") {
    return t(TF_VARIANT_I18N_KEY[variant].yes);
  }
  if (normalized === "f") {
    return t(TF_VARIANT_I18N_KEY[variant].no);
  }
  return empty;
}

export function tfFlagFilterOptions(
  t: TFunction,
  variantOrFieldName?: TfLabelVariant | string
): { value: string; label: string }[] {
  const variant =
    variantOrFieldName === "yesNo" || variantOrFieldName === "hasNot"
      ? variantOrFieldName
      : inferTfLabelVariant(variantOrFieldName ?? "");
  return [
    { value: "t", label: t(TF_VARIANT_I18N_KEY[variant].yes) },
    { value: "f", label: t(TF_VARIANT_I18N_KEY[variant].no) },
  ];
}

export function tfFlagColumnFilterFn(rowValue: unknown, filterValue: unknown): boolean {
  if (filterValue == null) {
    return true;
  }
  const rowTf = normalizeTfValue(String(rowValue));
  if (rowTf == null) {
    return false;
  }
  if (Array.isArray(filterValue)) {
    if (filterValue.length === 0) {
      return true;
    }
    return filterValue.some((fv) => normalizeTfValue(String(fv)) === rowTf);
  }
  if (String(filterValue).trim() === "") {
    return true;
  }
  const filterTf = normalizeTfValue(String(filterValue));
  if (filterTf == null) {
    return false;
  }
  return rowTf === filterTf;
}
