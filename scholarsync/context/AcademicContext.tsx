import React, { createContext, useContext, useState, useCallback, useMemo, useEffect } from "react";
import { useAuth } from "./AuthContext";

export interface Subject {
  id: string;
  name: string;
  color: string;
  teacher?: string;
  room?: string;
  totalPlanned: number;
}

export interface TimetableEntry {
  id: string;
  subjectId: string;
  subjectName: string;
  color: string;
  teacher?: string;
  room?: string;
  day: string;
  startTime: string;
  endTime: string;
  recurring: "one-time" | "daily" | "weekly" | "biweekly";
  semesterId?: string;
}

export interface AttendanceRecord {
  id: string;
  subjectId: string;
  date: string;
  status: "present" | "absent" | "late" | "leave" | "medical" | "holiday";
}

export interface TodoItem {
  id: string;
  title: string;
  priority: "high" | "medium" | "low";
  dueDate?: string;
  subjectId?: string;
  completed: boolean;
  subtasks: SubTask[];
  recurring?: "one-time" | "daily" | "weekly";
  createdAt: string;
}

export interface SubTask {
  id: string;
  title: string;
  completed: boolean;
}

export interface Note {
  id: string;
  subjectId?: string;
  title: string;
  content: string;
  summary?: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Exam {
  id: string;
  subjectId: string;
  subjectName: string;
  date: string;
  time?: string;
  venue?: string;
  duration?: string;
  notes?: string;
}

export interface PomodoroSession {
  id: string;
  taskId?: string;
  startTime: string;
  duration: number;
  completed: boolean;
}

interface AcademicContextType {
  subjects: Subject[];
  timetable: TimetableEntry[];
  attendance: AttendanceRecord[];
  todos: TodoItem[];
  notes: Note[];
  exams: Exam[];
  pomodoroSessions: PomodoroSession[];
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
  isLoaded: boolean;
}

const AcademicContext = createContext<AcademicContextType>({} as AcademicContextType);

export function AcademicProvider({ children }: { children: React.ReactNode }) {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [timetable, setTimetable] = useState<TimetableEntry[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [todos, setTodos] = useState<TodoItem[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [pomodoroSessions, setPomodoroSessions] = useState<PomodoroSession[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  
  const { user } = useAuth();

  useEffect(() => {
    if (!user) {
      setIsLoaded(true);
      return;
    }

    let unsubs: (() => void)[] = [];
    let isMounted = true;

    import("../services/db").then(({ subscribeCollection }) => {
      if (!isMounted) return;

      let loadedCount = 0;
      const markLoaded = () => {
        loadedCount++;
        if (loadedCount >= 7) setIsLoaded(true);
      };

      unsubs = [
        subscribeCollection<Subject>(user.uid, "subjects", (data) => {
          setSubjects(data);
          markLoaded();
        }),
        subscribeCollection<TimetableEntry>(user.uid, "timetable", (data) => {
          setTimetable(data);
          markLoaded();
        }),
        subscribeCollection<AttendanceRecord>(user.uid, "attendance", (data) => {
          setAttendance(data);
          markLoaded();
        }),
        subscribeCollection<TodoItem>(user.uid, "todos", (data) => {
          setTodos(data);
          markLoaded();
        }),
        subscribeCollection<Note>(user.uid, "notes", (data) => {
          setNotes(data);
          markLoaded();
        }),
        subscribeCollection<Exam>(user.uid, "exams", (data) => {
          setExams(data);
          markLoaded();
        }),
        subscribeCollection<PomodoroSession>(user.uid, "pomodoroSessions", (data) => {
          setPomodoroSessions(data);
          markLoaded();
        }),
      ];
    });

    return () => {
      isMounted = false;
      unsubs.forEach((unsub) => unsub());
    };
  }, [user]);

  const addSubject = useCallback((subject: Subject) => {
    if (!user) return;
    import("../services/db").then((db) => db.setDocument(user.uid, "subjects", subject));
  }, [user]);

  const updateSubject = useCallback((id: string, updates: Partial<Subject>) => {
    if (!user) return;
    const target = subjects.find(s => s.id === id);
    if (target) {
      import("../services/db").then((db) => db.setDocument(user.uid, "subjects", { ...target, ...updates }));
    }
  }, [user, subjects]);

  const deleteSubject = useCallback((id: string) => {
    if (!user) return;
    import("../services/db").then((db) => db.deleteDocument(user.uid, "subjects", id));
  }, [user]);

  const addTimetableEntry = useCallback((entry: TimetableEntry) => {
    if (!user) return;
    import("../services/db").then((db) => db.setDocument(user.uid, "timetable", entry));
    import("../services/notifications").then((n) => n.scheduleTimetableReminder(entry));
  }, [user]);

  const updateTimetableEntry = useCallback((id: string, updates: Partial<TimetableEntry>) => {
    if (!user) return;
    const target = timetable.find(e => e.id === id);
    if (target) {
      import("../services/db").then((db) => db.setDocument(user.uid, "timetable", { ...target, ...updates }));
    }
  }, [user, timetable]);

  const deleteTimetableEntry = useCallback((id: string) => {
    if (!user) return;
    import("../services/db").then((db) => db.deleteDocument(user.uid, "timetable", id));
  }, [user]);

  const addAttendance = useCallback((record: AttendanceRecord) => {
    if (!user) return;
    import("../services/db").then((db) => db.setDocument(user.uid, "attendance", record));
  }, [user]);

  const updateAttendance = useCallback((id: string, status: AttendanceRecord["status"]) => {
    if (!user) return;
    const target = attendance.find(a => a.id === id);
    if (target) {
      import("../services/db").then((db) => db.setDocument(user.uid, "attendance", { ...target, status }));
    }
  }, [user, attendance]);

  const deleteAttendance = useCallback((id: string) => {
    if (!user) return;
    import("../services/db").then((db) => db.deleteDocument(user.uid, "attendance", id));
  }, [user]);

  const addTodo = useCallback((todo: TodoItem) => {
    if (!user) return;
    import("../services/db").then((db) => db.setDocument(user.uid, "todos", todo));
    import("../services/notifications").then((n) => n.scheduleTodoReminder(todo));
  }, [user]);

  const updateTodo = useCallback((id: string, updates: Partial<TodoItem>) => {
    if (!user) return;
    const target = todos.find(t => t.id === id);
    if (target) {
      import("../services/db").then((db) => db.setDocument(user.uid, "todos", { ...target, ...updates }));
    }
  }, [user, todos]);

  const deleteTodo = useCallback((id: string) => {
    if (!user) return;
    import("../services/db").then((db) => db.deleteDocument(user.uid, "todos", id));
  }, [user]);

  const completeTodo = useCallback((id: string) => {
    if (!user) return;
    const target = todos.find(t => t.id === id);
    if (target) {
      import("../services/db").then((db) => db.setDocument(user.uid, "todos", { ...target, completed: true }));
    }
  }, [user, todos]);

  const addNote = useCallback((note: Note) => {
    if (!user) return;
    import("../services/db").then((db) => db.setDocument(user.uid, "notes", note));
  }, [user]);

  const updateNote = useCallback((id: string, updates: Partial<Note>) => {
    if (!user) return;
    const target = notes.find(n => n.id === id);
    if (target) {
      import("../services/db").then((db) => db.setDocument(user.uid, "notes", { ...target, ...updates }));
    }
  }, [user, notes]);

  const deleteNote = useCallback((id: string) => {
    if (!user) return;
    import("../services/db").then((db) => db.deleteDocument(user.uid, "notes", id));
  }, [user]);

  const addExam = useCallback((exam: Exam) => {
    if (!user) return;
    import("../services/db").then((db) => db.setDocument(user.uid, "exams", exam));
    import("../services/notifications").then((n) => n.scheduleExamReminders(exam));
  }, [user]);

  const updateExam = useCallback((id: string, updates: Partial<Exam>) => {
    if (!user) return;
    const target = exams.find(e => e.id === id);
    if (target) {
      import("../services/db").then((db) => db.setDocument(user.uid, "exams", { ...target, ...updates }));
    }
  }, [user, exams]);

  const deleteExam = useCallback((id: string) => {
    if (!user) return;
    import("../services/db").then((db) => db.deleteDocument(user.uid, "exams", id));
  }, [user]);

  const addPomodoroSession = useCallback((session: PomodoroSession) => {
    if (!user) return;
    import("../services/db").then((db) => db.setDocument(user.uid, "pomodoroSessions", session));
  }, [user]);

  const value = useMemo(() => ({
    subjects,
    timetable,
    attendance,
    todos,
    notes,
    exams,
    pomodoroSessions,
    addSubject,
    updateSubject,
    deleteSubject,
    addTimetableEntry,
    updateTimetableEntry,
    deleteTimetableEntry,
    addAttendance,
    updateAttendance,
    deleteAttendance,
    addTodo,
    updateTodo,
    deleteTodo,
    completeTodo,
    addNote,
    updateNote,
    deleteNote,
    addExam,
    updateExam,
    deleteExam,
    addPomodoroSession,
    isLoaded,
  }), [
    subjects,
    timetable,
    attendance,
    todos,
    notes,
    exams,
    pomodoroSessions,
    addSubject,
    updateSubject,
    deleteSubject,
    addTimetableEntry,
    updateTimetableEntry,
    deleteTimetableEntry,
    addAttendance,
    updateAttendance,
    deleteAttendance,
    addTodo,
    updateTodo,
    deleteTodo,
    completeTodo,
    addNote,
    updateNote,
    deleteNote,
    addExam,
    updateExam,
    deleteExam,
    addPomodoroSession,
    isLoaded,
  ]);

  return <AcademicContext.Provider value={value}>{children}</AcademicContext.Provider>;
}

export function useAcademic() {
  return useContext(AcademicContext);
}
