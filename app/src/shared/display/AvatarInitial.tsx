import { Box } from "@mui/material";
import type { ReactElement } from "react";

const LATIN_INITIAL_PATTERN = /^[A-Za-z]$/;
const LATIN_AVATAR_FONT_STACK = "Arial, Helvetica, sans-serif";

export function AvatarInitial({ initial }: { readonly initial: string }): ReactElement {
  const isLatin = LATIN_INITIAL_PATTERN.test(initial);

  return (
    <Box
      component="span"
      aria-hidden
      sx={{
        position: "absolute",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        pointerEvents: "none",
      }}
    >
      <Box
        component="span"
        sx={{
          display: "block",
          lineHeight: 1,
          fontFamily: isLatin ? LATIN_AVATAR_FONT_STACK : "inherit",
          fontSize: "inherit",
          fontWeight: "inherit",
          direction: isLatin ? "ltr" : "inherit",
          unicodeBidi: isLatin ? "isolate" : "inherit",
        }}
      >
        {initial}
      </Box>
    </Box>
  );
}
