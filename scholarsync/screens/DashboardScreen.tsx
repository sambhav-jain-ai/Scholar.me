import { Feather } from "@expo/vector-icons";
import React from "react";
import { Platform, ScrollView, StyleSheet, Text, View } from "react-native";
import Animated, { FadeIn, SlideInDown } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAcademic } from "../context/AcademicContext";
import { useProfile } from "../context/ProfileContext";
import { useSettings } from "../context/SettingsContext";
import { useTheme } from "../context/ThemeContext";
import { calcAttendanceStats } from "../utils/attendance";
import { DashboardSkeleton } from "../components/ui/Skeleton";
import { GooeyText } from "../components/ui/GooeyText";

function StatCard({
  label,
  value,
  icon,
  color,
  delay = 0,
}: {
  label: string;
  value: string | number;
  icon: string;
  color: string;
  delay?: number;
}) {
  const { colors } = useTheme();
  return (
    <Animated.View
      entering={SlideInDown.delay(delay).springify().damping(14)}
      style={[styles.statCard, { backgroundColor: colors.bgCard, borderColor: colors.border }]}
    >
      <View style={[styles.statIcon, { backgroundColor: color + "20" }]}>
        <Feather name={icon as any} size={20} color={color} />
      </View>
      <Text style={[styles.statVal, { color: colors.textPrimary }]}>{value}</Text>
      <Text style={[styles.statLbl, { color: colors.textSecondary }]}>{label}</Text>
    </Animated.View>
  );
}

function BarChart({
  data,
  threshold,
}: {
  data: { label: string; value: number; color: string }[];
  threshold: number;
}) {
  const { colors } = useTheme();
  const max = 100;
  return (
    <View style={styles.barChart}>
      {data.map((item, i) => (
        <Animated.View
          key={item.label}
          entering={SlideInDown.delay(i * 80).springify()}
          style={styles.barItem}
        >
          <View style={styles.barTrack}>
            <View
              style={[
                styles.barFill,
                {
                  height: `${Math.min(100, item.value)}%` as any,
                  backgroundColor: item.color,
                  borderRadius: 4,
                },
              ]}
            />
            <View
              style={[
                styles.thresholdLine,
                {
                  bottom: `${threshold}%` as any,
                  backgroundColor: colors.warning,
                },
              ]}
            />
          </View>
          <Text style={[styles.barLabel, { color: colors.textSecondary }]} numberOfLines={1}>
            {item.label.substring(0, 5)}
          </Text>
          <Text style={[styles.barValue, { color: colors.textPrimary }]}>
            {item.value.toFixed(0)}%
          </Text>
        </Animated.View>
      ))}
    </View>
  );
}

export default function DashboardScreen() {
  const { colors } = useTheme();
  const { subjects, attendance, todos, exams, pomodoroSessions } = useAcademic();
  const { profile } = useProfile();
  const { settings } = useSettings();
  const insets = useSafeAreaInsets();

  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const stats = React.useMemo(() => {
    const completedTasks = todos.filter((t) => t.completed).length;
    const totalTasks = todos.length;

    const avgAttendance =
      subjects.length > 0
        ? subjects.reduce((acc, s) => {
            const recs = attendance.filter((r) => r.subjectId === s.id);
            const stats = calcAttendanceStats(
              recs,
              s.totalPlanned,
              profile.attendanceThreshold,
              settings.lateCountsHalfPresent
            );
            return acc + stats.percentage;
          }, 0) / subjects.length
        : 0;

    const todayFocusMins = pomodoroSessions
      .filter((s) => s.completed && s.startTime.startsWith(new Date().toISOString().split("T")[0]))
      .reduce((acc, s) => acc + s.duration, 0);

    const productivityScore = Math.min(
      100,
      Math.round(
        (avgAttendance * 0.4 +
          (totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0) * 0.4 +
          Math.min(todayFocusMins / 120, 1) * 100 * 0.2)
      )
    );

    const upcomingExams = exams
      .filter((e) => new Date(e.date) >= new Date())
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(0, 3);

    const subjectBarData = subjects.map((s) => {
      const recs = attendance.filter((r) => r.subjectId === s.id);
      const stats = calcAttendanceStats(
        recs,
        s.totalPlanned,
        profile.attendanceThreshold,
        settings.lateCountsHalfPresent
      );
      const pct = stats.percentage;
      return {
        label: s.name,
        value: pct,
        color:
          pct >= profile.attendanceThreshold + 5
            ? colors.success
            : pct >= profile.attendanceThreshold - 5
            ? colors.warning
            : colors.danger,
      };
    });

    return {
      avgAttendance,
      completedTasks,
      totalTasks,
      todayFocusMins,
      productivityScore,
      upcomingExams,
      subjectBarData,
    };
  }, [subjects, attendance, todos, exams, pomodoroSessions, profile, settings, colors]);

  if (!stats) return <DashboardSkeleton />;

  const {
    avgAttendance,
    completedTasks,
    totalTasks,
    todayFocusMins,
    productivityScore,
    upcomingExams,
    subjectBarData,
  } = stats;

  return (
    <View style={[styles.root, { backgroundColor: colors.bgPrimary }]}>
      <View
        style={[
          styles.header,
          { paddingTop: topPad + 10, height: 44 + topPad + 10, alignItems: "center" },
        ]}
      >
        <GooeyText
          texts={["ScholarSync", "Dashboard", "Daily Focus"]}
          style={styles.gooeyHeader}
          textStyle={[styles.headerTitle, { color: colors.textPrimary }]}
          morphTime={1.2}
          cooldownTime={3}
        />
        <View style={[styles.scoreBadge, { backgroundColor: colors.accent + "20" }]}>
          <Feather name="trending-up" size={14} color={colors.accent} />
          <Text style={[styles.scoreText, { color: colors.accent }]}>
            {productivityScore} pts
          </Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.statsRow}>
          <StatCard
            label="Avg Attendance"
            value={`${avgAttendance.toFixed(1)}%`}
            icon="check-square"
            color="#10B981"
            delay={0}
          />
          <StatCard
            label="Tasks Done"
            value={`${completedTasks}/${totalTasks}`}
            icon="check-circle"
            color="#3B82F6"
            delay={80}
          />
          <StatCard
            label="Focus Today"
            value={`${todayFocusMins}m`}
            icon="clock"
            color="#F59E0B"
            delay={160}
          />
        </View>

        {subjects.length > 0 && (
          <Animated.View
            entering={FadeIn.delay(200).duration(400)}
            style={[styles.section, { backgroundColor: colors.bgCard, borderColor: colors.border }]}
          >
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
              Attendance by Subject
            </Text>
            <BarChart
              data={subjectBarData}
              threshold={profile.attendanceThreshold}
            />
            <View style={styles.legend}>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: colors.warning }]} />
                <Text style={[styles.legendText, { color: colors.textSecondary }]}>
                  {profile.attendanceThreshold}% threshold
                </Text>
              </View>
            </View>
          </Animated.View>
        )}

        {upcomingExams.length > 0 && (
          <Animated.View
            entering={FadeIn.delay(300).duration(400)}
            style={[styles.section, { backgroundColor: colors.bgCard, borderColor: colors.border }]}
          >
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
              Upcoming Exams
            </Text>
            {upcomingExams.map((exam) => {
              const days = Math.ceil(
                (new Date(exam.date).getTime() - Date.now()) / 86400000
              );
              const urgColor = days <= 3 ? "#EF4444" : days <= 7 ? "#F59E0B" : "#10B981";
              return (
                <View key={exam.id} style={[styles.examRow, { borderColor: colors.border }]}>
                  <View>
                    <Text style={[styles.examName, { color: colors.textPrimary }]}>
                      {exam.subjectName}
                    </Text>
                    <Text style={[styles.examDate, { color: colors.textSecondary }]}>
                      {exam.date} {exam.time ? `• ${exam.time}` : ""}
                    </Text>
                  </View>
                  <View style={[styles.daysLeft, { backgroundColor: urgColor + "20" }]}>
                    <Text style={[styles.daysNum, { color: urgColor }]}>{days}d</Text>
                  </View>
                </View>
              );
            })}
          </Animated.View>
        )}

        {subjects.map((s) => {
          const recs = attendance.filter((r) => r.subjectId === s.id);
          const stats = calcAttendanceStats(
            recs,
            s.totalPlanned,
            profile.attendanceThreshold,
            settings.lateCountsHalfPresent
          );
          const subTodos = todos.filter((t) => t.subjectId === s.id);
          const subExams = exams.filter((e) => e.subjectId === s.id);
          return (
            <Animated.View
              key={s.id}
              entering={FadeIn.delay(400).duration(400)}
              style={[
                styles.subjectPerf,
                { backgroundColor: colors.bgCard, borderColor: colors.border, borderLeftColor: s.color, borderLeftWidth: 4 },
              ]}
            >
              <Text style={[styles.perfSubject, { color: colors.textPrimary }]}>{s.name}</Text>
              <View style={styles.perfRow}>
                <View style={styles.perfItem}>
                  <Text style={[styles.perfVal, { color: stats.percentage >= profile.attendanceThreshold ? colors.success : colors.danger }]}>
                    {stats.percentage.toFixed(0)}%
                  </Text>
                  <Text style={[styles.perfLabel, { color: colors.textSecondary }]}>Attend</Text>
                </View>
                <View style={styles.perfItem}>
                  <Text style={[styles.perfVal, { color: colors.textPrimary }]}>
                    {subTodos.filter((t) => t.completed).length}/{subTodos.length}
                  </Text>
                  <Text style={[styles.perfLabel, { color: colors.textSecondary }]}>Tasks</Text>
                </View>
                <View style={styles.perfItem}>
                  <Text style={[styles.perfVal, { color: colors.textPrimary }]}>{subExams.length}</Text>
                  <Text style={[styles.perfLabel, { color: colors.textSecondary }]}>Exams</Text>
                </View>
              </View>
            </Animated.View>
          );
        })}

        <View style={{ height: 100 }} />
      </ScrollView>
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
  gooeyHeader: { height: 40, width: 200, justifyContent: "center" },
  scoreBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  scoreText: { fontSize: 13, fontWeight: "700" },
  statsRow: { flexDirection: "row", gap: 10, padding: 16 },
  statCard: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    alignItems: "center",
    gap: 6,
  },
  statIcon: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  statVal: { fontSize: 18, fontWeight: "800" },
  statLbl: { fontSize: 10, textAlign: "center" },
  section: { marginHorizontal: 16, marginBottom: 14, borderRadius: 16, borderWidth: 1, padding: 16, gap: 12 },
  sectionTitle: { fontSize: 16, fontWeight: "700" },
  barChart: { flexDirection: "row", height: 120, gap: 8 },
  barItem: { flex: 1, height: "100%", alignItems: "center", gap: 4 },
  barTrack: { flex: 1, width: "100%", justifyContent: "flex-end", position: "relative" },
  barFill: { width: "100%" },
  thresholdLine: {
    position: "absolute",
    left: 0,
    right: 0,
    height: 1.5,
  },
  barLabel: { fontSize: 9 },
  barValue: { fontSize: 9, fontWeight: "700" },
  legend: { flexDirection: "row", gap: 12 },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontSize: 11 },
  examRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  examName: { fontSize: 15, fontWeight: "600" },
  examDate: { fontSize: 12 },
  daysLeft: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10 },
  daysNum: { fontSize: 14, fontWeight: "700" },
  subjectPerf: {
    marginHorizontal: 16,
    marginBottom: 10,
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    gap: 10,
  },
  perfSubject: { fontSize: 15, fontWeight: "700" },
  perfRow: { flexDirection: "row", gap: 16 },
  perfItem: { alignItems: "center", gap: 2 },
  perfVal: { fontSize: 16, fontWeight: "700" },
  perfLabel: { fontSize: 11 },
});
