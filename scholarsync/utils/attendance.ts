import type { AttendanceRecord } from "../context/AppContext";

export interface AttendanceStats {
  total: number;
  held: number;
  attended: number;
  absent: number;
  late: number;
  leave: number;
  medical: number;
  holiday: number;
  percentage: number;
  safeToSkip: number;
  projected: number;
  needed: number;
}

export function calcAttendanceStats(
  records: AttendanceRecord[],
  totalPlanned: number,
  threshold: number,
  lateHalf: boolean = true
): AttendanceStats {
  const attended = records.filter((r) => r.status === "present").length;
  const absent = records.filter((r) => r.status === "absent").length;
  const late = records.filter((r) => r.status === "late").length;
  const leave = records.filter((r) => r.status === "leave").length;
  const medical = records.filter((r) => r.status === "medical").length;
  const holiday = records.filter((r) => r.status === "holiday").length;
  const held = records.filter((r) => r.status !== "holiday").length;
  const effectiveAttended = lateHalf ? attended + late * 0.5 : attended;
  const percentage = held > 0 ? (effectiveAttended / held) * 100 : 0;
  const remaining = totalPlanned - held;
  const projected =
    totalPlanned > 0
      ? ((effectiveAttended + remaining) / totalPlanned) * 100
      : 0;
  const minRequired = Math.ceil((threshold / 100) * totalPlanned);
  const safeToSkip = Math.max(
    0,
    Math.floor((effectiveAttended * 100 - threshold * held) / threshold)
  );
  const needed = Math.max(0, minRequired - Math.floor(effectiveAttended));
  return {
    total: totalPlanned,
    held,
    attended,
    absent,
    late,
    leave,
    medical,
    holiday,
    percentage,
    safeToSkip,
    projected,
    needed,
  };
}

export function getAttendanceColor(
  percentage: number,
  threshold: number
): string {
  if (percentage >= threshold + 5) return "#10B981";
  if (percentage >= threshold - 5) return "#F59E0B";
  return "#EF4444";
}
