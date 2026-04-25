import React, { createContext, useContext, useState, useCallback, useMemo, useEffect } from "react";
import { useAuth } from "./AuthContext";
import type { ThemeType } from "./ThemeContext";

export interface AppSettings {
  theme: ThemeType;
  soundEnabled: boolean;
  hapticEnabled: boolean;
  ecoMode: boolean;
  pomodoroFocus: number;
  pomodoroShortBreak: number;
  pomodoroLongBreak: number;
  lateCountsHalfPresent: boolean;
  autoStartBreaks: boolean;
  liquidGlass: boolean;
  calendarSync: boolean;
  showAttendanceThreshold: boolean;
  performanceMode: "auto" | "low" | "high";
}

const defaultSettings: AppSettings = {
  theme: "ios",
  soundEnabled: true,
  hapticEnabled: true,
  ecoMode: false,
  pomodoroFocus: 25,
  pomodoroShortBreak: 5,
  pomodoroLongBreak: 15,
  lateCountsHalfPresent: true,
  autoStartBreaks: false,
  liquidGlass: false,
  calendarSync: false,
  showAttendanceThreshold: true,
  performanceMode: "auto",
};


interface SettingsContextType {
  settings: AppSettings;
  updateSettings: (updates: Partial<AppSettings>) => void;
  isLoaded: boolean;
}

const SettingsContext = createContext<SettingsContextType>({} as SettingsContextType);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);
  const [isLoaded, setIsLoaded] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) {
      setIsLoaded(true);
      return;
    }

    import("../services/db").then(({ loadUserDoc }) => {
      loadUserDoc(user.uid).then((doc) => {
        if (doc?.settings) setSettings(doc.settings as unknown as AppSettings);
        setIsLoaded(true);
      });
    });
  }, [user]);

  const updateSettings = useCallback(
    (updates: Partial<AppSettings>) => {
      setSettings((prev) => {
        const next = { ...prev, ...updates };
        if (user) {
          import("../services/db").then((db) => db.saveUserSettings(user.uid, next));
        }
        return next;
      });
    },
    [user]
  );

  const value = useMemo(() => ({
    settings,
    updateSettings,
    isLoaded,
  }), [settings, updateSettings, isLoaded]);

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings() {
  return useContext(SettingsContext);
}
