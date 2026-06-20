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
import {
  applyThemeToDocument,
  USER_PREFERENCES_CHANGED_EVENT,
} from "../utils/userPreferences.util";

interface ThemeContextType {
  mode: PaletteMode;
  setThemeMode: (mode: PaletteMode) => void;
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
    applyThemeToDocument(mode);
  }, [mode]);

  useEffect(() => {
    const syncFromStorage = (): void => {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEYS.THEME_MODE);
      if (saved === "dark" || saved === "light") {
        setMode(saved);
      }
    };

    window.addEventListener(USER_PREFERENCES_CHANGED_EVENT, syncFromStorage);
    return () => {
      window.removeEventListener(USER_PREFERENCES_CHANGED_EVENT, syncFromStorage);
    };
  }, []);

  const toggleTheme = (): void => {
    setMode((prevMode) => (prevMode === "light" ? "dark" : "light"));
  };

  return (
    <ThemeContext.Provider value={{ mode, setThemeMode: setMode, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};
