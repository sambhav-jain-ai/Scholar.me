import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import type { TimetableEntry, TodoItem, Exam } from "../context/AppContext";

// ── Global notification handler (call once in app root) ───────────────────────
export function configureNotifications() {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

// ── Permission request ────────────────────────────────────────────────────────
export async function requestNotificationPermission(): Promise<boolean> {
  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === "granted") return true;

  const { status } = await Notifications.requestPermissionsAsync();
  return status === "granted";
}

// ── Cancel a specific notification ───────────────────────────────────────────
export async function cancelNotification(id: string): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(id);
}

// ── Cancel all notifications ──────────────────────────────────────────────────
export async function cancelAllNotifications(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

// ── Exam reminders ────────────────────────────────────────────────────────────
/**
 * Schedule two reminders for an exam:
 *  - 1 day before at 9 AM
 *  - 1 hour before
 * Returns the scheduled notification IDs (for later cancellation).
 */
export async function scheduleExamReminders(exam: Exam): Promise<string[]> {
  if (!(await requestNotificationPermission())) return [];
  if (!exam.date) return [];

  const examDate = new Date(exam.date);
  if (exam.time) {
    const [h, m] = exam.time.split(":").map(Number);
    examDate.setHours(h, m, 0, 0);
  } else {
    examDate.setHours(9, 0, 0, 0);
  }

  const now = Date.now();
  const ids: string[] = [];

  // 1 day before
  const dayBefore = new Date(examDate.getTime() - 24 * 60 * 60 * 1000);
  if (dayBefore.getTime() > now) {
    const id = await Notifications.scheduleNotificationAsync({
      identifier: `exam-day-${exam.id}`,
      content: {
        title: `📚 Exam tomorrow: ${exam.subjectName}`,
        body: exam.venue
          ? `At ${exam.time ?? "9:00"} · ${exam.venue}`
          : `At ${exam.time ?? "9:00"}`,
        data: { type: "exam", examId: exam.id },
      },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: dayBefore },
    });
    ids.push(id);
  }

  // 1 hour before
  const hourBefore = new Date(examDate.getTime() - 60 * 60 * 1000);
  if (hourBefore.getTime() > now) {
    const id = await Notifications.scheduleNotificationAsync({
      identifier: `exam-hour-${exam.id}`,
      content: {
        title: `⏰ Exam in 1 hour: ${exam.subjectName}`,
        body: exam.venue ? `Venue: ${exam.venue}` : "Good luck!",
        data: { type: "exam", examId: exam.id },
      },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: hourBefore },
    });
    ids.push(id);
  }

  return ids;
}

// ── Timetable class reminders ─────────────────────────────────────────────────
/**
 * Schedule a repeating weekly reminder 15 minutes before a class.
 * Only works for "weekly" recurring entries.
 */
export async function scheduleTimetableReminder(
  entry: TimetableEntry,
): Promise<string | null> {
  if (!(await requestNotificationPermission())) return null;
  if (entry.recurring !== "weekly") return null;

  const DAYS: Record<string, number> = {
    Sunday: 1, Monday: 2, Tuesday: 3, Wednesday: 4,
    Thursday: 5, Friday: 6, Saturday: 7,
  };

  const weekday = DAYS[entry.day];
  if (!weekday) return null;

  const [h, m] = entry.startTime.split(":").map(Number);
  // 15 minutes before class
  const notifMinute = m - 15 < 0 ? 60 + (m - 15) : m - 15;
  const notifHour = m - 15 < 0 ? h - 1 : h;

  const id = await Notifications.scheduleNotificationAsync({
    identifier: `class-${entry.id}`,
    content: {
      title: `🎓 Class in 15 min: ${entry.subjectName}`,
      body: entry.room ? `Room ${entry.room}` : entry.startTime,
      data: { type: "class", entryId: entry.id },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
      weekday,
      hour: notifHour,
      minute: notifMinute,
    },
  });

  return id;
}

// ── Task due reminders ────────────────────────────────────────────────────────
/**
 * Schedule a reminder for a task on its due date at 8 AM.
 */
export async function scheduleTodoReminder(
  todo: TodoItem,
): Promise<string | null> {
  if (!(await requestNotificationPermission())) return null;
  if (!todo.dueDate) return null;

  const dueDate = new Date(todo.dueDate);
  dueDate.setHours(8, 0, 0, 0);

  if (dueDate.getTime() <= Date.now()) return null;

  const id = await Notifications.scheduleNotificationAsync({
    identifier: `todo-${todo.id}`,
    content: {
      title: `✅ Task due today: ${todo.title}`,
      body: `Priority: ${todo.priority}`,
      data: { type: "todo", todoId: todo.id },
    },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: dueDate },
  });

  return id;
}
