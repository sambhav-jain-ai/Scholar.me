import React, { createContext, useContext, useMemo, useState } from "react";
import { useAcademic } from "./AcademicContext";
import { useProfile } from "./ProfileContext";
import { useSettings } from "./SettingsContext";
import type { ThemeType } from "./ThemeContext";
import type { 
  Subject, 
  TimetableEntry, 
  AttendanceRecord, 
  TodoItem, 
  Note, 
  Exam, 
  PomodoroSession 
} from "./AcademicContext";
import type { UserProfile } from "./ProfileContext";
import type { AppSettings } from "./SettingsContext";

export type { 
  ThemeType, 
  Subject, 
  TimetableEntry, 
  AttendanceRecord, 
  TodoItem, 
  Note, 
  Exam, 
  PomodoroSession,
  UserProfile,
  AppSettings
};
export type StudentType = "college" | "school";

interface AppContextType {
  profile: UserProfile;
  settings: AppSettings;
  subjects: Subject[];
  timetable: TimetableEntry[];
  attendance: AttendanceRecord[];
  todos: TodoItem[];
  notes: Note[];
  exams: Exam[];
  pomodoroSessions: PomodoroSession[];
  activeTab: string;
  updateProfile: (updates: Partial<UserProfile>) => void;
  updateSettings: (updates: Partial<AppSettings>) => void;
  addSubject: (subject: Subject) => void;
  updateSubject: (id: string, updates: Partial<Subject>) => void;
  deleteSubject: (id: string) => void;
  addTimetableEntry: (entry: TimetableEntry) => void;
  updateTimetableEntry: (id: string, updates: Partial<TimetableEntry>) => void;
  deleteTimetableEntry: (id: string) => void;
  addAttendance: (record: AttendanceRecord) => void;
  updateAttendance: (id: string, status: AttendanceRecord["status"]) => void;
  deleteAttendance: (id: string) => void;
  addTodo: (todo: TodoItem) => void;
  updateTodo: (id: string, updates: Partial<TodoItem>) => void;
  deleteTodo: (id: string) => void;
  completeTodo: (id: string) => void;
  addNote: (note: Note) => void;
  updateNote: (id: string, updates: Partial<Note>) => void;
  deleteNote: (id: string) => void;
  addExam: (exam: Exam) => void;
  updateExam: (id: string, updates: Partial<Exam>) => void;
  deleteExam: (id: string) => void;
  addPomodoroSession: (session: PomodoroSession) => void;
  setActiveTab: (tab: string) => void;
  isLoaded: boolean;
}

const AppContext = createContext<AppContextType>({} as AppContextType);

/**
 * AppProvider (Legacy Bridge)
 * Wraps the application but consumes the newer granular contexts to satisfy older components.
 */
export function AppProvider({ children }: { children: React.ReactNode }) {
  const academic = useAcademic();
  const profileCtx = useProfile();
  const settingsCtx = useSettings();
  const [activeTab, setActiveTab] = useState("chat");

  const isLoaded = academic.isLoaded && profileCtx.isLoaded && settingsCtx.isLoaded;

  const value = useMemo(() => ({
    ...academic,
    ...profileCtx,
    ...settingsCtx,
    activeTab,
    setActiveTab,
    isLoaded,
  }), [
    academic.subjects, 
    academic.timetable, 
    academic.attendance, 
    academic.todos, 
    academic.notes, 
    academic.exams, 
    academic.pomodoroSessions,
    academic.isLoaded,
    profileCtx.profile,
    profileCtx.isLoaded,
    settingsCtx.settings,
    settingsCtx.isLoaded,
    activeTab,
    isLoaded
  ]);

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  return useContext(AppContext);
}

