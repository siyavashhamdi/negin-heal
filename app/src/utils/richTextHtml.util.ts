export function applyBlankTargetToRichTextLinks(html: string): string {
  if (!html.includes("<a")) {
    return html;
  }

  if (typeof document === "undefined") {
    return html;
  }

  const template = document.createElement("template");
  template.innerHTML = html;
  template.content.querySelectorAll("a[href]").forEach((anchor) => {
    anchor.setAttribute("target", "_blank");
    anchor.setAttribute("rel", "noopener noreferrer");
  });

  return template.innerHTML;
}

/** True when HTML/rich text has visible text content (not only tags or &nbsp;). */
export function hasRichTextContent(value: string): boolean {
  const textContent = value
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/gi, "")
    .replace(/\u200c/g, "")
    .trim();
  return textContent.length > 0;
}
