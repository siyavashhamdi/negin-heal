const MOBILE_MAX_WIDTH_MEDIA_QUERY = "(max-width: 600px)";

export function scrollToTopOnMobile(): void {
  if (!window.matchMedia(MOBILE_MAX_WIDTH_MEDIA_QUERY).matches) {
    return;
  }

  window.scrollTo({ top: 0, left: 0, behavior: "auto" });
}
