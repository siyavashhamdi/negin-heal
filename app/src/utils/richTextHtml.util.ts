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
