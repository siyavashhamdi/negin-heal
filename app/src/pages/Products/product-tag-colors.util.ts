const TAG_COLOR_SATURATION = 72;

function hashTextToHue(text: string): number {
  let hash = 0;
  for (const char of text.trim().toLowerCase()) {
    hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  }
  return hash % 360;
}

export function getProductTagChipSx(text: string) {
  const hue = hashTextToHue(text);

  return {
    borderColor: `hsl(${hue} ${TAG_COLOR_SATURATION}% 78%)`,
    bgcolor: `hsl(${hue} ${TAG_COLOR_SATURATION}% 94%)`,
    color: `hsl(${hue} ${TAG_COLOR_SATURATION - 18}% 27%)`,
    "& .MuiChip-label": {
      minWidth: 0,
      maxWidth: "100%",
    },
    'body[data-theme="dark"] &': {
      borderColor: `hsl(${hue} ${TAG_COLOR_SATURATION - 15}% 34%)`,
      bgcolor: `hsl(${hue} ${TAG_COLOR_SATURATION - 25}% 18%)`,
      color: `hsl(${hue} ${TAG_COLOR_SATURATION - 10}% 82%)`,
    },
  };
}
