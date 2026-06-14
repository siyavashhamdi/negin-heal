import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactElement,
  type ReactNode,
} from "react";
import { type PaletteMode } from "@mui/material";
import { LOCAL_STORAGE_KEYS } from "../constants";

interface ThemeContextType {
  mode: PaletteMode;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// eslint-disable-next-line react-refresh/only-export-components
export const useThemeMode = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("The hook 'useThemeMode' should be used inside 'ThemeProvider'.");
  }
  return context;
};

interface ThemeProviderProps {
  readonly children: ReactNode;
}

export const ThemeProvider = ({ children }: ThemeProviderProps): ReactElement => {
  const [mode, setMode] = useState<PaletteMode>(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEYS.THEME_MODE);
    if (saved === "dark" || saved === "light") {
      return saved;
    }
    return "dark";
  });

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEYS.THEME_MODE, mode);
    document.documentElement.setAttribute("data-theme", mode);
    document.body.setAttribute("data-theme", mode);
  }, [mode]);

  const toggleTheme = (): void => {
    setMode((prevMode) => (prevMode === "light" ? "dark" : "light"));
  };

  return <ThemeContext.Provider value={{ mode, toggleTheme }}>{children}</ThemeContext.Provider>;
};
