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

  static extractPlaceholders(template: string): string[] {
    const placeholders = new Set<string>();

    for (const match of template.matchAll(EmailTemplate.PLACEHOLDER_REGEX)) {
      const key = match[1]?.trim();
      if (key) {
        placeholders.add(key);
      }
    }

    return [...placeholders];
  }

  static findUnresolvedPlaceholders(rendered: string): string[] {
    return EmailTemplate.extractPlaceholders(rendered);
  }

  render(): string {
    const requiredPlaceholders = EmailTemplate.extractPlaceholders(
      this.template,
    );
    const missingInputs = requiredPlaceholders.filter(
      (key) =>
        !Object.prototype.hasOwnProperty.call(this.normalizedInputs, key),
    );

    if (missingInputs.length > 0) {
      throw new Error(
        `Missing email template inputs: ${missingInputs.join(", ")}`,
      );
    }

    const rendered = this.template.replace(
      EmailTemplate.PLACEHOLDER_REGEX,
      (_placeholder, key: string) => this.normalizedInputs[key],
    );

    const unresolvedPlaceholders =
      EmailTemplate.findUnresolvedPlaceholders(rendered);
    if (unresolvedPlaceholders.length > 0) {
      throw new Error(
        `Unresolved email template placeholders: ${unresolvedPlaceholders.join(", ")}`,
      );
    }

    return rendered;
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
