import * as Calendar from "expo-calendar";
import { Platform } from "react-native";
import { generateId } from "../utils/ids";
import type { Exam, TimetableEntry } from "../context/AcademicContext";


/**
 * Service for synchronizing Academic data with the device's native calendar.
 */
export const CalendarService = {
  /**
   * Request calendar permissions and ensure a 'ScholarSync' calendar exists.
   */
  async ensureCalendar(): Promise<string | null> {
    const { status } = await Calendar.requestCalendarPermissionsAsync();
    if (status !== "granted") return null;

    const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
    const existing = calendars.find((c: Calendar.Calendar) => c.title === "ScholarSync");


    if (existing) return existing.id;

    // Create a new calendar if none exists
    const defaultCalendarSource =
      Platform.OS === "ios"
        ? await Calendar.getDefaultCalendarSourceAsync()
        : { isLocalAccount: true, name: "ScholarSync", type: "LOCAL" };

    if (!defaultCalendarSource) return null;

    const newCalendarId = await Calendar.createCalendarAsync({
      title: "ScholarSync",
      color: "#6366F1",
      entityType: Calendar.EntityTypes.EVENT,
      sourceId: (defaultCalendarSource as any).id,
      source: defaultCalendarSource as any,
      name: "scholarsync_calendar",
      ownerAccount: "personal",
      accessLevel: Calendar.CalendarAccessLevel.OWNER,
    });

    return newCalendarId;
  },

  /**
   * Sync a list of exams to the native calendar.
   */
  async syncExams(exams: Exam[]): Promise<void> {

    const calendarId = await this.ensureCalendar();
    if (!calendarId) return;

    // Fetch existing events to avoid duplicates (best-effort)
    const now = new Date();
    const future = new Date();
    future.setFullYear(now.getFullYear() + 1);
    
    const existingEvents = await Calendar.getEventsAsync([calendarId], now, future);

    for (const exam of exams) {
      const eventTitle = `🎓 Exam: ${exam.subjectName}`;
      const alreadyExists = existingEvents.find((e: Calendar.Event) => e.title === eventTitle);


      if (!alreadyExists && exam.date) {
        const startDate = new Date(exam.date);
        if (exam.time) {
          const [hours, minutes] = exam.time.split(":").map(Number);
          startDate.setHours(hours, minutes);
        } else {
          startDate.setHours(9, 0); // Default to 9 AM
        }

        const endDate = new Date(startDate);
        endDate.setHours(startDate.getHours() + 2); // Assume 2-hour duration

        await Calendar.createEventAsync(calendarId, {
          title: eventTitle,
          startDate,
          endDate,
          location: exam.venue || "TBD",
          notes: exam.notes || "Recorded via ScholarSync AI",
          timeZone: "GMT", // Best effort, usually local
        });
      }
    }
  },

  /**
   * Sync a single class entry to the calendar (Recurring).
   */
  async syncTimetable(entry: TimetableEntry): Promise<void> {
    const calendarId = await this.ensureCalendar();
    if (!calendarId) return;

    const eventTitle = `📚 Class: ${entry.subjectName}`;
    
    // Logic for recurring weekly events would go here
    // For MVP, we'll focus on getting the Calendar ready and syncing Exams.
    // Full timetable sync is complex due to recurrence rules.
  },
};
