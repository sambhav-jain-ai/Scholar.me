import React, { createContext, useContext, useEffect, useState, useMemo } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

export type ThemeType = "ios" | "winter" | "monochrome" | "claude";
export type ThemeMode = "light" | "dark";

export interface ThemeColors {
  bgPrimary: string;
  bgSecondary: string;
  bgCard: string;
  accent: string;
  accentSecondary: string;
  textPrimary: string;
  textSecondary: string;
  success: string;
  danger: string;
  warning: string;
  border: string;
}

export const THEMES: Record<ThemeType, Record<ThemeMode, ThemeColors>> = {
  ios: {
    light: {
      bgPrimary: "#F2F2F7",
      bgSecondary: "#FFFFFF",
      bgCard: "#FFFFFF",
      accent: "#007AFF",
      accentSecondary: "#5856D6",
      textPrimary: "#1D1D1F",
      textSecondary: "#8E8E93",
      success: "#34C759",
      danger: "#FF3B30",
      warning: "#FFCC00",
      border: "#D1D1D6",
    },
    dark: {
      bgPrimary: "#000000",
      bgSecondary: "#1C1C1E",
      bgCard: "#1C1C1E",
      accent: "#0A84FF",
      accentSecondary: "#5E5CE6",
      textPrimary: "#FFFFFF",
      textSecondary: "#8E8E93",
      success: "#32D74B",
      danger: "#FF453A",
      warning: "#FFD60A",
      border: "#38383A",
    },
  },
  winter: {
    light: {
      bgPrimary: "#F0FFFF",
      bgSecondary: "#93E9E9",
      bgCard: "#FFFFFF",
      accent: "#00A3CC",
      accentSecondary: "#007A99",
      textPrimary: "#082E33",
      textSecondary: "#007A99",
      success: "#10B981",
      danger: "#EF4444",
      warning: "#F59E0B",
      border: "#A8DADC",
    },
    dark: {
      bgPrimary: "#082E33",
      bgSecondary: "#005F73",
      bgCard: "#003F4F",
      accent: "#93E9E9",
      accentSecondary: "#00A3CC",
      textPrimary: "#FFFFFF",
      textSecondary: "#A8DADC",
      success: "#34D399",
      danger: "#F87171",
      warning: "#FCD34D",
      border: "#005F73",
    },
  },
  monochrome: {
    light: {
      bgPrimary: "#FFFFFF",
      bgSecondary: "#F2F2F7",
      bgCard: "#FFFFFF",
      accent: "#1D1D1F",
      accentSecondary: "#007AFF",
      textPrimary: "#000000",
      textSecondary: "#8E8E93",
      success: "#000000",
      danger: "#FF3B30",
      warning: "#8E8E93",
      border: "#E5E5EA",
    },
    dark: {
      bgPrimary: "#000000",
      bgSecondary: "#1C1C1E",
      bgCard: "#000000",
      accent: "#FFFFFF",
      accentSecondary: "#0A84FF",
      textPrimary: "#FFFFFF",
      textSecondary: "#8E8E93",
      success: "#FFFFFF",
      danger: "#FF453A",
      warning: "#8E8E93",
      border: "#2C2C2E",
    },
  },
  claude: {
    light: {
      bgPrimary: "#FBF9F7",
      bgSecondary: "#F1EFE9",
      bgCard: "#FFFFFF",
      accent: "#D97757",
      accentSecondary: "#6B46C1",
      textPrimary: "#1A1A1A",
      textSecondary: "#6B6B6B",
      success: "#10B981",
      danger: "#EF4444",
      warning: "#F59E0B",
      border: "#E5E5E3",
    },
    dark: {
      bgPrimary: "#1A1A1A",
      bgSecondary: "#2D2D2D",
      bgCard: "#242424",
      accent: "#D97757",
      accentSecondary: "#A78BFA",
      textPrimary: "#FBF9F7",
      textSecondary: "#A1A1A1",
      success: "#34D399",
      danger: "#F87171",
      warning: "#FCD34D",
      border: "#3A3A3A",
    },
  },
};

interface ThemeContextType {
  theme: ThemeType;
  mode: ThemeMode;
  colors: ThemeColors;
  setTheme: (t: ThemeType) => void;
  setMode: (m: ThemeMode) => void;
  toggleMode: () => void;
}

const ThemeContext = createContext<ThemeContextType>({} as ThemeContextType);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemeType>("ios");
  const [mode, setModeState] = useState<ThemeMode>("light");

  useEffect(() => {
    Promise.all([
      AsyncStorage.getItem("theme"),
      AsyncStorage.getItem("themeMode")
    ]).then(([t, m]) => {
      if (t && THEMES[t as ThemeType]) {
        setThemeState(t as ThemeType);
      }
      if (m && (m === "light" || m === "dark")) {
        setModeState(m as ThemeMode);
      }
    });
  }, []);

  const setTheme = (t: ThemeType) => {
    setThemeState(t);
    AsyncStorage.setItem("theme", t);
  };

  const setMode = (m: ThemeMode) => {
    setModeState(m);
    AsyncStorage.setItem("themeMode", m);
  };

  const toggleMode = () => {
    const next = mode === "light" ? "dark" : "light";
    setMode(next);
  };

  const value = useMemo(() => ({ 
    theme, 
    mode, 
    colors: THEMES[theme][mode], 
    setTheme, 
    setMode, 
    toggleMode 
  }), [theme, mode]);

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
