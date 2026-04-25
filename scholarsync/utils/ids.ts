export function generateId(): string {
  return Date.now().toString() + Math.random().toString(36).substr(2, 9);
}

export const SUBJECT_COLORS = [
  "#7C3AED",
  "#06B6D4",
  "#10B981",
  "#F59E0B",
  "#EF4444",
  "#EC4899",
  "#3B82F6",
  "#8B5CF6",
  "#14B8A6",
  "#F97316",
];

export const DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];
