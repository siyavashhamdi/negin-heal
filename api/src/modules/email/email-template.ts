type EmailTemplatePrimitive = string | number | boolean | null | undefined;

export type EmailTemplateInputs = Record<string, EmailTemplatePrimitive>;

type EmailTemplateOptions = {
  escapeHtml?: boolean;
};

export class EmailTemplate<TInputs extends EmailTemplateInputs> {
  private static readonly PLACEHOLDER_REGEX = /@@@<([A-Z0-9_]+)>@@@/g;
  private readonly normalizedInputs: Record<string, string>;

  constructor(
    private readonly template: string,
    inputs: TInputs,
    options: EmailTemplateOptions = {},
  ) {
    const shouldEscapeHtml = options.escapeHtml ?? true;
    this.normalizedInputs = Object.entries(inputs).reduce<
      Record<string, string>
    >((accumulator, [key, value]) => {
      accumulator[key.toUpperCase()] = shouldEscapeHtml
        ? this.escapeHtml(value)
        : this.stringify(value);
      return accumulator;
    }, {});
  }

  render(): string {
    return this.template.replace(
      EmailTemplate.PLACEHOLDER_REGEX,
      (placeholder, key: string) => {
        return Object.prototype.hasOwnProperty.call(this.normalizedInputs, key)
          ? this.normalizedInputs[key]
          : placeholder;
      },
    );
  }

  private stringify(value: EmailTemplatePrimitive): string {
    return value == null ? "" : String(value);
  }

  private escapeHtml(value: EmailTemplatePrimitive): string {
    return this.stringify(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }
}
