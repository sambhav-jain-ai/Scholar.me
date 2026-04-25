// Shared types for the Chat feature.
// Extracted here so ActionCard, MessageBubble, HistorySheet and ChatScreen
// can all import from a single source of truth.

export type ActionType =
  | "timetable"
  | "todo"
  | "attendance"
  | "exam"
  | "note"
  | "pomodoro"
  | "ask_which";

export interface ParsedAction {
  type: ActionType;
  data: Record<string, string | number | undefined>;
}

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  attachmentName?: string;
  action?: ParsedAction;
  actionState?: "pending" | "confirmed" | "declined";
}

export interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  createdAt: string;
  updatedAt: string;
}

export interface Attachment {
  id: string;
  name: string;
  type: "document" | "image";
  textContent?: string; // extracted text for documents
}
