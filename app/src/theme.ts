import { createTheme, type Theme } from "@mui/material/styles";

type PaletteMode = "light" | "dark";

const lightColors = {
  primary: {
    main: "#c9567e",
    light: "#e08ba8",
    dark: "#a8436a",
    contrastText: "#ffffff",
  },
  secondary: {
    main: "#9b7aad",
    light: "#b794c7",
    dark: "#7d6290",
    contrastText: "#ffffff",
  },
  success: {
    main: "#6bb895",
    light: "#8ecdb0",
    dark: "#4f9a76",
  },
  warning: {
    main: "#e8a54b",
    light: "#f0c078",
    dark: "#c4842e",
  },
  error: {
    main: "#e05c5c",
    light: "#f08080",
    dark: "#c43c3c",
  },
  info: {
    main: "#9b7aad",
    light: "#b794c7",
    dark: "#7d6290",
  },
  grey: {
    50: "#fdf8f9",
    100: "#f7eef2",
    200: "#eadde3",
    300: "#d4c4cc",
    400: "#a8949e",
    500: "#7a6872",
    600: "#5c4d55",
    700: "#453a41",
    800: "#2e262b",
    900: "#1a1518",
  },
} as const;

const darkColors = {
  primary: {
    main: "#1976d2",
    light: "#42a5f5",
    dark: "#1565c0",
    contrastText: "#ffffff",
  },
  secondary: {
    main: "#00acc1",
    light: "#4dd0e1",
    dark: "#00838f",
    contrastText: "#ffffff",
  },
  success: {
    main: "#10b981",
    light: "#34d399",
    dark: "#059669",
  },
  warning: {
    main: "#f59e0b",
    light: "#fbbf24",
    dark: "#d97706",
  },
  error: {
    main: "#ef4444",
    light: "#f87171",
    dark: "#dc2626",
  },
  info: {
    main: "#3b82f6",
    light: "#60a5fa",
    dark: "#2563eb",
  },
  grey: {
    50: "#f9fafb",
    100: "#f3f4f6",
    200: "#e5e7eb",
    300: "#d1d5db",
    400: "#9ca3af",
    500: "#6b7280",
    600: "#4b5563",
    700: "#374151",
    800: "#1f2937",
    900: "#111827",
  },
} as const;

const FONT_FAMILY_STACK = [
  "B Yekan",
  "-apple-system",
  "BlinkMacSystemFont",
  "Arial",
  "sans-serif",
].join(",");

const lightShadows = {
  sm: "0 0.0625rem 0.125rem 0 rgba(61, 44, 53, 0.05)",
  md: "0 0.125rem 0.5rem rgba(61, 44, 53, 0.08)",
  lg: "0 0.25rem 1rem rgba(61, 44, 53, 0.12)",
  xl: "0 0.625rem 1.5rem rgba(61, 44, 53, 0.15)",
} as const;

const darkShadows = {
  sm: "0 0.0625rem 0.125rem 0 rgba(0, 0, 0, 0.3)",
  md: "0 0.125rem 0.5rem rgba(0, 0, 0, 0.4)",
  lg: "0 0.25rem 1rem rgba(0, 0, 0, 0.5)",
  xl: "0 0.625rem 1.5rem rgba(0, 0, 0, 0.6)",
} as const;

const transparentInputChrome = {
  backgroundColor: "transparent",
  background: "none",
  backgroundImage: "none",
} as const;

/** Default single-line TextField height (course edit dialog reference). */
const INPUT_MIN_HEIGHT = "3.4375rem";

export const createAppTheme = (mode: PaletteMode): Theme => {
  const isDark = mode === "dark";
  const colors = isDark ? darkColors : lightColors;
  const shadows = isDark ? darkShadows : lightShadows;
  const borderRadius = isDark ? 8 : 12;
  const buttonRadius = isDark ? "0.5rem" : "0.75rem";
  const cardRadius = isDark ? "0.75rem" : "1rem";
  const inputRadius = isDark ? "0.5rem" : "0.75rem";
  const chipRadius = isDark ? "0.375rem" : "0.5rem";
  const listItemRadius = isDark ? "0.5rem" : "0.75rem";
  const contentSurfaceBg = {
    backgroundColor: "var(--app-content-surface-bg, var(--app-surface-bg))",
    backgroundImage: isDark ? "none" : "var(--app-content-surface-gradient)",
  } as const;
  const panelSurfaceBg = {
    backgroundColor: "var(--app-content-surface-bg, var(--app-surface-bg))",
    backgroundImage: isDark ? "none" : "var(--app-panel-gradient)",
  } as const;

  return createTheme({
    palette: {
      mode,
      primary: colors.primary,
      secondary: colors.secondary,
      success: colors.success,
      warning: colors.warning,
      error: colors.error,
      info: colors.info,
      background: {
        default: isDark ? "#121212" : "#fae0ec",
        paper: isDark ? "#1e1e1e" : "#fff7fb",
      },
      text: {
        primary: isDark ? "#ffffff" : "#3d2c35",
        secondary: isDark ? colors.grey[400] : colors.grey[500],
        disabled: colors.grey[400],
      },
      divider: isDark ? "rgba(255, 255, 255, 0.12)" : colors.grey[200],
      grey: colors.grey,
    },
    direction: "rtl",
    typography: {
      fontFamily: FONT_FAMILY_STACK,
      h1: {
        fontWeight: 700,
        fontSize: "2.5rem",
        lineHeight: 1.2,
        letterSpacing: "-0.02em",
      },
      h2: {
        fontWeight: 700,
        fontSize: "2rem",
        lineHeight: 1.3,
        letterSpacing: "-0.01em",
      },
      h3: {
        fontWeight: 600,
        fontSize: "1.75rem",
        lineHeight: 1.4,
      },
      h4: {
        fontWeight: 600,
        fontSize: "1.5rem",
        lineHeight: 1.4,
      },
      h5: {
        fontWeight: 600,
        fontSize: "1.25rem",
        lineHeight: 1.5,
      },
      h6: {
        fontWeight: 600,
        fontSize: "1rem",
        lineHeight: 1.5,
      },
      subtitle1: {
        fontSize: "1rem",
        lineHeight: 1.5,
        fontWeight: 500,
      },
      subtitle2: {
        fontSize: "0.875rem",
        lineHeight: 1.5,
        fontWeight: 500,
      },
      body1: {
        fontSize: "1rem",
        lineHeight: 1.6,
      },
      body2: {
        fontSize: "0.875rem",
        lineHeight: 1.5,
      },
      button: {
        textTransform: "none",
        fontWeight: 500,
        letterSpacing: "0.02em",
      },
      caption: {
        fontSize: "0.75rem",
        lineHeight: 1.4,
      },
      overline: {
        fontSize: "0.75rem",
        lineHeight: 1.4,
        textTransform: "uppercase",
        letterSpacing: "0.1em",
      },
    },
    shape: {
      borderRadius,
    },
    spacing: 8,
    breakpoints: {
      values: {
        xs: 0,
        sm: 600,
        md: 960,
        lg: 1280,
        xl: 1920,
      },
    },
    zIndex: {
      mobileStepper: 1000,
      speedDial: 1050,
      appBar: 1100,
      drawer: 1200,
      modal: 1300,
      snackbar: 1400,
      tooltip: 1500,
    },
    transitions: {
      duration: {
        shortest: 150,
        shorter: 200,
        short: 250,
        standard: 300,
        complex: 375,
        enteringScreen: 225,
        leavingScreen: 195,
      },
      easing: {
        easeInOut: "cubic-bezier(0.4, 0, 0.2, 1)",
        easeOut: "cubic-bezier(0.0, 0, 0.2, 1)",
        easeIn: "cubic-bezier(0.4, 0, 1, 1)",
        sharp: "cubic-bezier(0.4, 0, 0.6, 1)",
      },
    },
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: buttonRadius,
            padding: "0.625rem 1.5rem",
            fontWeight: 500,
            textTransform: "none",
            transition: "all 0.2s ease-in-out",
          },
          contained: {
            boxShadow: shadows.sm,
            "&:hover": {
              boxShadow: shadows.md,
              transform: "translateY(-0.0625rem)",
            },
            "&:active": {
              boxShadow: shadows.sm,
              transform: "translateY(0)",
            },
          },
          outlined: {
            borderWidth: "0.09375rem",
            "&:hover": {
              borderWidth: "0.09375rem",
            },
          },
          sizeLarge: {
            padding: "0.75rem 2rem",
            fontSize: "1rem",
          },
          sizeSmall: {
            padding: "0.375rem 1rem",
            fontSize: "0.875rem",
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            boxShadow: shadows.md,
            borderRadius: cardRadius,
            transition: "box-shadow 0.3s ease-in-out, transform 0.2s ease-in-out",
            "&:hover": {
              boxShadow: shadows.lg,
              transform: "translateY(-0.125rem)",
            },
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            borderRadius: cardRadius,
            ...contentSurfaceBg,
          },
          outlined: {
            ...contentSurfaceBg,
          },
          elevation1: {
            boxShadow: shadows.md,
          },
          elevation2: {
            boxShadow: shadows.lg,
          },
          elevation3: {
            boxShadow: shadows.xl,
          },
        },
      },
      MuiDialog: {
        styleOverrides: {
          paper: {
            ...contentSurfaceBg,
          },
        },
      },
      MuiDialogTitle: {
        styleOverrides: {
          root: {
            ...contentSurfaceBg,
          },
        },
      },
      MuiDialogContent: {
        styleOverrides: {
          root: {
            ...contentSurfaceBg,
          },
        },
      },
      MuiAutocomplete: {
        styleOverrides: {
          inputRoot: {
            alignItems: "center",
            flexWrap: "nowrap",
            "&:has(.MuiAutocomplete-tag)": {
              flexWrap: "wrap",
              minHeight: "auto",
              paddingTop: "2px",
              paddingBottom: "2px",
            },
            "&:not(:has(.MuiAutocomplete-tag))": {
              minHeight: INPUT_MIN_HEIGHT,
              paddingTop: 0,
              paddingBottom: 0,
              alignItems: "center",
              "& .MuiAutocomplete-input": {
                padding: "0 4px",
                lineHeight: 1.4375,
              },
            },
            "&.MuiInputBase-sizeSmall:not(:has(.MuiAutocomplete-tag))": {
              minHeight: INPUT_MIN_HEIGHT,
              paddingTop: 0,
              paddingBottom: 0,
              alignItems: "center",
            },
          },
          paper: {
            backgroundColor: "var(--app-popover-bg)",
            backgroundImage: "none",
            border: "0.0625rem solid color-mix(in srgb, var(--app-surface-border) 72%, transparent)",
          },
          listbox: {
            backgroundColor: "var(--app-popover-bg)",
          },
        },
      },
      MuiMenu: {
        styleOverrides: {
          paper: {
            backgroundColor: "var(--app-popover-bg)",
            backgroundImage: "none",
            border: "0.0625rem solid color-mix(in srgb, var(--app-surface-border) 72%, transparent)",
          },
          list: {
            backgroundColor: "var(--app-popover-bg)",
          },
        },
      },
      MuiPopover: {
        styleOverrides: {
          paper: {
            backgroundColor: "var(--app-popover-bg)",
            backgroundImage: "none",
            border: "0.0625rem solid color-mix(in srgb, var(--app-surface-border) 72%, transparent)",
          },
        },
      },
      MuiAppBar: {
        styleOverrides: {
          root: {
            boxShadow: shadows.md,
            backgroundImage: isDark ? "none" : "var(--app-panel-gradient)",
            borderRadius: 0,
            backgroundColor: isDark ? "#1e1e1e" : "#fff7fb",
            color: isDark ? "#ffffff" : "#3d2c35",
            "& .MuiIconButton-root": {
              color: isDark ? "#ffffff" : "#3d2c35",
            },
            "& .MuiTypography-root": {
              color: isDark ? "#ffffff" : "#3d2c35",
            },
          },
        },
      },
      MuiDrawer: {
        styleOverrides: {
          paper: {
            borderLeft: "none",
            borderRight: isDark
              ? "0.0625rem solid rgba(255, 255, 255, 0.12)"
              : "0.0625rem solid rgba(61, 44, 53, 0.1)",
            backgroundImage: "none",
          },
        },
      },
      MuiInputLabel: {
        styleOverrides: {
          sizeSmall: {
            "&.MuiInputLabel-outlined:not(.MuiInputLabel-shrink)": {
              transform: "translate(14px, 16px) scale(1)",
            },
          },
        },
      },
      MuiInputBase: {
        styleOverrides: {
          root: {
            ...transparentInputChrome,
            "&.MuiInputBase-sizeSmall:not(.MuiInputBase-multiline):not(:has(.MuiAutocomplete-tag))": {
              minHeight: INPUT_MIN_HEIGHT,
              alignItems: "center",
            },
            "& .MuiInputBase-input": {
              ...transparentInputChrome,
            },
          },
          inputSizeSmall: {
            "&:not(.MuiInputBase-inputMultiline)": {
              padding: "0 14px",
              lineHeight: 1.4375,
              height: "auto",
            },
          },
        },
      },
      MuiOutlinedInput: {
        styleOverrides: {
          root: {
            borderRadius: inputRadius,
            ...transparentInputChrome,
            "&:not(.MuiInputBase-multiline)": {
              minHeight: INPUT_MIN_HEIGHT,
              alignItems: "center",
            },
            "&.MuiInputBase-multiline": {
              minHeight: "auto",
            },
            "&:not(.MuiInputBase-multiline) .MuiInputBase-input:not(.MuiInputBase-inputMultiline), &:not(.MuiInputBase-multiline) .MuiSelect-select":
              {
                paddingTop: 0,
                paddingBottom: 0,
                lineHeight: 1.4375,
              },
            "&:hover": {
              ...transparentInputChrome,
            },
            "&.Mui-focused": {
              ...transparentInputChrome,
            },
            "&.Mui-disabled": {
              ...transparentInputChrome,
            },
            "& .MuiInputBase-input": {
              ...transparentInputChrome,
            },
          },
        },
      },
      MuiTextField: {
        styleOverrides: {
          root: {
            "& .MuiOutlinedInput-root": {
              "&:hover": {
                ".MuiOutlinedInput-notchedOutline": {
                  borderColor: colors.primary.main,
                },
              },
            },
          },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: {
            borderRadius: chipRadius,
            fontWeight: 500,
          },
        },
      },
      MuiListItemButton: {
        styleOverrides: {
          root: {
            borderRadius: listItemRadius,
            "&.Mui-selected": {
              backgroundColor: colors.primary.main,
              color: "#ffffff",
              "&:hover": {
                backgroundColor: colors.primary.dark,
              },
              "& .MuiListItemIcon-root": {
                color: "#ffffff",
              },
            },
          },
        },
      },
      MuiTooltip: {
        defaultProps: {
          leaveTouchDelay: 3000,
        },
        styleOverrides: {
          tooltip: {
            backgroundColor: isDark ? colors.grey[700] : colors.grey[800],
            fontSize: "0.75rem",
            padding: "0.5rem 0.75rem",
          },
        },
      },
    },
  });
};
