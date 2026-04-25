import { Feather } from "@expo/vector-icons";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import type { ParsedAction, ActionType } from "../../types/chat";

interface ActionCardProps {
  action: ParsedAction;
  state?: "pending" | "confirmed" | "declined";
  onConfirm: () => void;
  onDecline: () => void;
  colors: any;
}

const ACTION_META: Record<
  ActionType,
  { label: string; icon: string; color: string }
> = {
  timetable: { label: "ADD TO TIMETABLE", icon: "calendar",     color: "#6366F1" },
  todo:       { label: "ADD TO TO-DO",     icon: "check-square", color: "#10B981" },
  attendance: { label: "MARK ATTENDANCE",  icon: "user-check",   color: "#F59E0B" },
  exam:       { label: "ADD EXAM",         icon: "award",        color: "#EC4899" },
  note:       { label: "SAVE NOTE",        icon: "book-open",    color: "#3B82F6" },
  pomodoro:   { label: "START POMODORO",   icon: "clock",        color: "#A855F7" },
  ask_which:  { label: "WHERE SHOULD I ADD THIS?", icon: "help-circle", color: "#6366F1" },
};

function getSummary(action: ParsedAction): string {
  const d = action.data;
  switch (action.type) {
    case "timetable":
      return `${d.subjectName} · ${d.day} ${d.startTime}–${d.endTime}`;
    case "todo":
      return `${d.title} · ${d.priority ?? "medium"} priority`;
    case "attendance":
      return `${d.subjectName} · ${d.status} on ${d.date}`;
    case "exam":
      return `${d.subjectName} · ${d.date}${d.time ? ` at ${d.time}` : ""}`;
    case "note":
      return `${d.title}`;
    case "pomodoro":
      return `${d.duration ?? 25}-min focus session`;
    default:
      return "";
  }
}

export function ActionCard({
  action,
  state,
  onConfirm,
  onDecline,
  colors,
}: ActionCardProps) {
  // ── Confirmed state ──
  if (state === "confirmed") {
    const meta = ACTION_META[action.type];
    return (
      <View style={[styles.card, { backgroundColor: "#10B98115", borderColor: "#10B98140" }]}>
        <Feather name="check-circle" size={14} color="#10B981" />
        <Text style={[styles.cardTitle, { color: "#10B981" }]}>
          {meta?.label ? `${meta.label} ✓` : "Done!"}
        </Text>
      </View>
    );
  }

  // ── Declined state ──
  if (state === "declined") {
    return (
      <View style={[styles.card, { backgroundColor: colors.bgSecondary, borderColor: colors.border }]}>
        <Feather name="x-circle" size={14} color={colors.textSecondary} />
        <Text style={[styles.cardTitle, { color: colors.textSecondary }]}>Cancelled</Text>
      </View>
    );
  }

  // ── ask_which disambiguation ──
  if (action.type === "ask_which") {
    return (
      <Animated.View
        entering={FadeInDown.duration(220)}
        style={[styles.card, { backgroundColor: colors.bgCard, borderColor: colors.accent + "40" }]}
      >
        <Text style={[styles.cardLabel, { color: colors.textSecondary }]}>
          WHERE SHOULD I ADD THIS?
        </Text>
        <Text style={[styles.cardTitle, { color: colors.textPrimary }]} numberOfLines={2}>
          {action.data.description as string}
        </Text>
        <View style={styles.btns}>
          <Pressable onPress={onConfirm} style={[styles.btn, { backgroundColor: "#6366F1" }]}>
            <Feather name="calendar" size={13} color="#fff" />
            <Text style={styles.btnText}>Timetable</Text>
          </Pressable>
          <Pressable onPress={onDecline} style={[styles.btn, { backgroundColor: "#10B981" }]}>
            <Feather name="list" size={13} color="#fff" />
            <Text style={styles.btnText}>To-Do</Text>
          </Pressable>
        </View>
      </Animated.View>
    );
  }

  // ── Standard action card ──
  const meta = ACTION_META[action.type];
  const summary = getSummary(action);

  return (
    <Animated.View
      entering={FadeInDown.duration(220)}
      style={[styles.card, { backgroundColor: colors.bgCard, borderColor: colors.accent + "40" }]}
    >
      <View style={styles.cardHeader}>
        <View style={[styles.iconBox, { backgroundColor: meta.color + "15" }]}>
          <Feather name={meta.icon as any} size={14} color={meta.color} />
        </View>
        <Text style={[styles.cardLabel, { color: colors.textSecondary }]}>
          {meta.label}
        </Text>
      </View>
      <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>{summary}</Text>
      {action.type === "timetable" && action.data.room ? (
        <Text style={[styles.cardSub, { color: colors.textSecondary }]}>
          Room: {action.data.room}
        </Text>
      ) : null}
      {action.type === "timetable" && action.data.teacher ? (
        <Text style={[styles.cardSub, { color: colors.textSecondary }]}>
          Teacher: {action.data.teacher}
        </Text>
      ) : null}
      {action.type === "exam" && action.data.venue ? (
        <Text style={[styles.cardSub, { color: colors.textSecondary }]}>
          Venue: {action.data.venue}
        </Text>
      ) : null}
      <View style={styles.btns}>
        <Pressable
          onPress={onDecline}
          style={[styles.btn, { backgroundColor: colors.bgSecondary, borderWidth: 1, borderColor: colors.border }]}
        >
          <Text style={[styles.btnText, { color: colors.textSecondary }]}>Decline</Text>
        </Pressable>
        <Pressable
          onPress={onConfirm}
          style={[styles.btn, { backgroundColor: meta.color }]}
        >
          <Feather name="plus" size={13} color="#fff" />
          <Text style={styles.btnText}>Confirm</Text>
        </Pressable>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 14, borderWidth: 1, padding: 12, gap: 8 },
  cardHeader: { flexDirection: "row", alignItems: "center", gap: 8 },
  iconBox: { width: 28, height: 28, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  cardLabel: { fontSize: 10, fontWeight: "700", letterSpacing: 0.5 },
  cardTitle: { fontSize: 14, fontWeight: "600" },
  cardSub: { fontSize: 12 },
  btns: { flexDirection: "row", gap: 8, marginTop: 4 },
  btn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    paddingVertical: 8,
    borderRadius: 10,
  },
  btnText: { fontSize: 13, fontWeight: "600", color: "#fff" },
});
