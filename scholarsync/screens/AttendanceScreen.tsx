import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useState } from "react";
import {
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Animated, {
  FadeIn,
  SlideInDown,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAcademic } from "../context/AcademicContext";
import { useProfile } from "../context/ProfileContext";
import { useSettings } from "../context/SettingsContext";
import { useTheme } from "../context/ThemeContext";
import { calcAttendanceStats, getAttendanceColor } from "../utils/attendance";
import { generateId, DAYS } from "../utils/ids";
import type { AttendanceRecord } from "../context/AcademicContext";

const STATUS_OPTIONS: {
  key: AttendanceRecord["status"];
  label: string;
  icon: string;
  color: string;
}[] = [
  { key: "present", label: "Present", icon: "check", color: "#10B981" },
  { key: "absent", label: "Absent", icon: "x", color: "#EF4444" },
  { key: "late", label: "Late", icon: "clock", color: "#F59E0B" },
  { key: "leave", label: "Leave", icon: "flag", color: "#F59E0B" },
  { key: "medical", label: "Medical", icon: "activity", color: "#3B82F6" },
  { key: "holiday", label: "Holiday", icon: "sun", color: "#9B9BB4" },
];

function SubjectCard({ subjectId }: { subjectId: string }) {
  const { colors } = useTheme();
  const { subjects, attendance, addAttendance } = useAcademic();
  const { profile } = useProfile();
  const { settings } = useSettings();
  const subject = subjects.find((s) => s.id === subjectId);
  const records = attendance.filter((r) => r.subjectId === subjectId);
  const stats = calcAttendanceStats(
    records,
    subject?.totalPlanned || 40,
    profile.attendanceThreshold,
    settings.lateCountsHalfPresent
  );
  const ringColor = getAttendanceColor(stats.percentage, profile.attendanceThreshold);
  const progress = useSharedValue(0);

  React.useEffect(() => {
    progress.value = withTiming(stats.percentage / 100, { duration: 1200 });
  }, [stats.percentage]);

  const markToday = (status: AttendanceRecord["status"]) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const today = new Date().toISOString().split("T")[0];
    const existing = records.find((r) => r.date === today);
    if (existing) return;
    addAttendance({
      id: generateId(),
      subjectId,
      date: today,
      status,
    });
  };

  if (!subject) return null;

  return (
    <Animated.View
      entering={FadeIn.duration(400)}
      style={[styles.subCard, { backgroundColor: colors.bgCard, borderColor: colors.border }]}
    >
      <View style={styles.subCardHeader}>
        <View style={[styles.subDot, { backgroundColor: subject.color }]} />
        <Text style={[styles.subName, { color: colors.textPrimary }]}>
          {subject.name}
        </Text>
        <View style={[styles.pctBadge, { backgroundColor: ringColor + "20" }]}>
          <Text style={[styles.pctText, { color: ringColor }]}>
            {stats.percentage.toFixed(1)}%
          </Text>
        </View>
      </View>

      <View style={styles.statsGrid}>
        <View style={styles.statItem}>
          <Text style={[styles.statNum, { color: colors.textPrimary }]}>
            {stats.attended}
          </Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
            Present
          </Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statNum, { color: colors.danger }]}>
            {stats.absent}
          </Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
            Absent
          </Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statNum, { color: colors.textPrimary }]}>
            {stats.held}
          </Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
            Held
          </Text>
        </View>
        <View style={styles.statItem}>
          <Text
            style={[
              styles.statNum,
              { color: stats.safeToSkip > 0 ? colors.success : colors.danger },
            ]}
          >
            {stats.safeToSkip}
          </Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
            Can Skip
          </Text>
        </View>
      </View>

      {settings.showAttendanceThreshold && (
        <View style={styles.thresholdBarContainer}>
          <View style={[styles.thresholdBarBg, { backgroundColor: colors.bgSecondary }]}>
            <Animated.View 
              style={[
                styles.thresholdProgress, 
                { backgroundColor: ringColor, width: `${stats.percentage}%` }
              ]} 
            />
            {/* Threshold Marker */}
            <View 
              style={[
                styles.thresholdMarker, 
                { left: `${profile.attendanceThreshold}%`, backgroundColor: colors.textPrimary }
              ]} 
            />
          </View>
          <View style={styles.thresholdLabelsRow}>
            <Text style={[styles.thresholdLabel, { color: colors.textSecondary }]}>0%</Text>
            <Text style={[styles.thresholdLabel, { color: colors.textPrimary, fontWeight: "bold" }]}>
              Goal: {profile.attendanceThreshold}%
            </Text>
            <Text style={[styles.thresholdLabel, { color: colors.textSecondary }]}>100%</Text>
          </View>
        </View>
      )}

      {stats.needed > 0 && (

        <View style={[styles.warningBanner, { backgroundColor: colors.danger + "15" }]}>
          <Feather name="alert-triangle" size={14} color={colors.danger} />
          <Text style={[styles.warningText, { color: colors.danger }]}>
            Attend {stats.needed} more to reach {profile.attendanceThreshold}%
          </Text>
        </View>
      )}

      <View style={styles.markRow}>
        {STATUS_OPTIONS.slice(0, 4).map((opt) => (
          <Pressable
            key={opt.key}
            onPress={() => markToday(opt.key)}
            style={({ pressed }) => [
              styles.markBtn,
              { backgroundColor: opt.color + "20", opacity: pressed ? 0.7 : 1 },
            ]}
          >
            <Feather name={opt.icon as any} size={16} color={opt.color} />
            <Text style={[styles.markLabel, { color: opt.color }]}>
              {opt.label}
            </Text>
          </Pressable>
        ))}
      </View>
    </Animated.View>
  );
}

export default function AttendanceScreen() {
  const { colors } = useTheme();
  const { subjects, attendance, deleteAttendance } = useAcademic();
  const { profile } = useProfile();
  const insets = useSafeAreaInsets();

  const topPad = Platform.OS === "web" ? 67 : insets.top;

  return (
    <View style={[styles.root, { backgroundColor: colors.bgPrimary }]}>
      <View
        style={[
          styles.header,
          { paddingTop: topPad + 10, height: 44 + topPad + 10, alignItems: "center" },
        ]}
      >
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>
          Attendance
        </Text>
        <View style={[styles.thresholdBadge, { backgroundColor: colors.accent + "20" }]}>
          <Feather name="target" size={14} color={colors.accent} />
          <Text style={[styles.thresholdText, { color: colors.accent }]}>
            {profile.attendanceThreshold}% goal
          </Text>
        </View>
      </View>

      {subjects.length === 0 ? (
        <Animated.View entering={FadeIn.duration(400)} style={styles.emptyState}>
          <Feather name="clipboard" size={48} color={colors.textSecondary} />
          <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>
            No subjects yet
          </Text>
          <Text style={[styles.emptyHint, { color: colors.textSecondary }]}>
            Add subjects in Settings to track attendance
          </Text>
        </Animated.View>
      ) : (
        <FlatList
          data={subjects}
          keyExtractor={(s) => s.id}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => <SubjectCard subjectId={item.id} />}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingRight: 20,
    paddingLeft: 56,
    paddingBottom: 12,
  },
  headerTitle: { fontSize: 24, fontWeight: "800" },
  thresholdBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  thresholdText: { fontSize: 13, fontWeight: "600" },
  listContent: { padding: 16, gap: 14 },
  subCard: { borderRadius: 16, borderWidth: 1, padding: 16, gap: 12 },
  subCardHeader: { flexDirection: "row", alignItems: "center", gap: 10 },
  subDot: { width: 14, height: 14, borderRadius: 7 },
  subName: { flex: 1, fontSize: 17, fontWeight: "700" },
  pctBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  pctText: { fontSize: 14, fontWeight: "700" },
  statsGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  statItem: { alignItems: "center", gap: 2, flex: 1 },
  statNum: { fontSize: 20, fontWeight: "800" },
  statLabel: { fontSize: 11 },
  warningBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 10,
    borderRadius: 10,
  },
  warningText: { fontSize: 13, flex: 1 },
  markRow: { flexDirection: "row", gap: 8 },
  thresholdBarContainer: { marginVertical: 4 },
  thresholdBarBg: {
    height: 14,
    borderRadius: 7,
    overflow: "hidden",
    position: "relative",
  },
  thresholdProgress: {
    height: "100%",
    borderRadius: 7,
  },
  thresholdMarker: {
    position: "absolute",
    top: 0,
    bottom: 0,
    width: 2,
    zIndex: 10,
  },
  thresholdLabelsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 4,
  },
  thresholdLabel: {
    fontSize: 10,
  },

  markBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    paddingVertical: 8,
    borderRadius: 10,
  },
  markLabel: { fontSize: 11, fontWeight: "600" },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    padding: 32,
  },
  emptyTitle: { fontSize: 18, fontWeight: "600" },
  emptyHint: { fontSize: 14, textAlign: "center" },
});
