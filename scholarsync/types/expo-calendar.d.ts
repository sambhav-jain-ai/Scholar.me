declare module "expo-calendar" {
  export enum EntityTypes {
    EVENT = "event",
    REMINDER = "reminder",
  }

  export enum CalendarAccessLevel {
    OWNER = "owner",
    READ = "read",
    WRITE = "write",
    ROOT = "root",
    CONTRIBUTOR = "contributor",
    FREE_BUSY_ONLY = "freebusy",
  }

  export interface Calendar {
    id: string;
    title: string;
    color: string;
    entityType: EntityTypes;
    sourceId: string;
    source: any;
    name: string;
    ownerAccount: string;
    accessLevel: CalendarAccessLevel;
  }

  export interface Event {
    id: string;
    calendarId: string;
    title: string;
    startDate: Date;
    endDate: Date;
    location?: string;
    notes?: string;
    allDay?: boolean;
    timeZone?: string;
  }

  export function requestCalendarPermissionsAsync(): Promise<{ status: string }>;
  export function getCalendarsAsync(entityType: EntityTypes): Promise<Calendar[]>;
  export function getDefaultCalendarSourceAsync(): Promise<any>;
  export function createCalendarAsync(details: Partial<Calendar>): Promise<string>;
  export function createEventAsync(calendarId: string, details: Partial<Event>): Promise<string>;
  export function getEventsAsync(calendarIds: string[], startDate: Date, endDate: Date): Promise<Event[]>;
}
