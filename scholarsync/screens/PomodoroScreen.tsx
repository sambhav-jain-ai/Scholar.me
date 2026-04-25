import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useEffect, useRef, useState } from "react";
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Animated, {
  FadeIn,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAcademic } from "../context/AcademicContext";
import { useSettings } from "../context/SettingsContext";
import { useTheme } from "../context/ThemeContext";
import { generateId } from "../utils/ids";
import type { PomodoroSession } from "../context/AcademicContext";

type PomodoroMode = "focus" | "short" | "long";

export default function PomodoroScreen() {
  const { colors } = useTheme();
  const { settings } = useSettings();
  const { todos, addPomodoroSession, pomodoroSessions } = useAcademic();
  const insets = useSafeAreaInsets();
  const [mode, setMode] = useState<PomodoroMode>("focus");
  const [isRunning, setIsRunning] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(settings.pomodoroFocus * 60);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [sessionsToday, setSessionsToday] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const sessionStart = useRef<string | null>(null);

  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const getDuration = (m: PomodoroMode) => {
    if (m === "focus") return settings.pomodoroFocus * 60;
    if (m === "short") return settings.pomodoroShortBreak * 60;
    return settings.pomodoroLongBreak * 60;
  };

  const totalDuration = getDuration(mode);
  const progress = useSharedValue(1);

  useEffect(() => {
    setSecondsLeft(getDuration(mode));
    progress.value = 1;
  }, [mode, settings.pomodoroFocus, settings.pomodoroShortBreak, settings.pomodoroLongBreak]);

  useEffect(() => {
    const today = new Date().toISOString().split("T")[0];
    const todaySessions = pomodoroSessions.filter(
      (s) => s.completed && s.startTime.startsWith(today)
    );
    setSessionsToday(todaySessions.length);
  }, [pomodoroSessions]);

  const currentTaskId = useRef(selectedTaskId);
  const currentMode = useRef(mode);
  const currentFocusDuration = useRef(settings.pomodoroFocus);

  useEffect(() => {
    currentTaskId.current = selectedTaskId;
    currentMode.current = mode;
    currentFocusDuration.current = settings.pomodoroFocus;
  }, [selectedTaskId, mode, settings.pomodoroFocus]);

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setSecondsLeft((s) => {
          if (s <= 1) {
            clearInterval(intervalRef.current!);
            setIsRunning(false);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            if (sessionStart.current && currentMode.current === "focus") {
              addPomodoroSession({
                id: generateId(),
                taskId: currentTaskId.current || undefined,
                startTime: sessionStart.current,
                duration: currentFocusDuration.current,
                completed: true,
              });
            }
            progress.value = withTiming(0, { duration: 400 });
            return 0;
          }
          progress.value = withTiming((s - 1) / totalDuration, {
            duration: 900,
          });
          return s - 1;
        });
      }, 1000);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning, totalDuration]);

  const toggleTimer = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (!isRunning) {
      sessionStart.current = new Date().toISOString();
    }
    setIsRunning((r) => !r);
  };

  const resetTimer = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsRunning(false);
    setSecondsLeft(getDuration(mode));
    progress.value = withTiming(1, { duration: 400 });
  };

  const mins = Math.floor(secondsLeft / 60);
  const secs = secondsLeft % 60;
  const timeStr = `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;

  const selectedTask = todos.find((t) => t.id === selectedTaskId && !t.completed);

  const ringStyle = useAnimatedStyle(() => {
    const circumference = 2 * Math.PI * 100;
    return {
      strokeDashoffset: circumference * (1 - progress.value),
    } as any;
  });

  const modeColors: Record<PomodoroMode, string> = {
    focus: colors.accent,
    short: colors.success,
    long: colors.accentSecondary,
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.bgPrimary }]}>
      <View
        style={[
          styles.header,
          { paddingTop: topPad + 10 },
        ]}
      >
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>
          Pomodoro
        </Text>
        <View style={[styles.sessionBadge, { backgroundColor: colors.accent + "20" }]}>
          <Text style={[styles.sessionText, { color: colors.accent }]}>
            {sessionsToday} sessions today
          </Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <View style={styles.modeRow}>
          {(["focus", "short", "long"] as const).map((m) => (
            <Pressable
              key={m}
              onPress={() => {
                Haptics.selectionAsync();
                setMode(m);
                setIsRunning(false);
              }}
              style={[
                styles.modePill,
                {
                  backgroundColor: mode === m ? modeColors[m] : colors.bgCard,
                  borderColor: mode === m ? modeColors[m] : colors.border,
                },
              ]}
            >
              <Text
                style={{
                  color: mode === m ? "#FFF" : colors.textSecondary,
                  fontWeight: mode === m ? "700" : "400",
                  fontSize: 13,
                }}
              >
                {m === "focus" ? "Focus" : m === "short" ? "Short Break" : "Long Break"}
              </Text>
            </Pressable>
          ))}
        </View>

        <View style={styles.timerContainer}>
          <Animated.View entering={FadeIn.duration(400)}>
            <View style={styles.svgContainer}>
              <Text style={[styles.timerText, { color: colors.textPrimary }]}>
                {timeStr}
              </Text>
              <Text style={[styles.modeName, { color: modeColors[mode] }]}>
                {mode === "focus" ? "Focus Time" : mode === "short" ? "Short Break" : "Long Break"}
              </Text>
            </View>
          </Animated.View>
        </View>

        <View style={styles.btnRow}>
          <Pressable
            onPress={resetTimer}
            style={[styles.resetBtn, { backgroundColor: colors.bgCard, borderColor: colors.border }]}
          >
            <Feather name="rotate-ccw" size={20} color={colors.textSecondary} />
          </Pressable>

          <Pressable
            onPress={toggleTimer}
            style={[
              styles.mainBtn,
              { backgroundColor: modeColors[mode] },
            ]}
          >
            <Feather
              name={isRunning ? "pause" : "play"}
              size={28}
              color="#FFF"
            />
          </Pressable>

          <View style={[styles.sessionsCount, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
            <Text style={[styles.sessionsNum, { color: colors.textPrimary }]}>
              {sessionsToday}
            </Text>
          </View>
        </View>

        {todos.filter((t) => !t.completed).length > 0 && (
          <View style={[styles.taskSection, { borderColor: colors.border }]}>
            <Text style={[styles.taskSectionTitle, { color: colors.textSecondary }]}>
              Focus on
            </Text>
            {selectedTask ? (
              <Pressable
                onPress={() => setSelectedTaskId(null)}
                style={[
                  styles.selectedTask,
                  { backgroundColor: colors.accent + "15", borderColor: colors.accent },
                ]}
              >
                <Feather name="check-circle" size={16} color={colors.accent} />
                <Text style={[styles.selectedTaskText, { color: colors.textPrimary }]}>
                  {selectedTask.title}
                </Text>
                <Feather name="x" size={14} color={colors.textSecondary} />
              </Pressable>
            ) : (
              <ScrollView style={{ maxHeight: 200 }}>
                {todos
                  .filter((t) => !t.completed)
                  .slice(0, 5)
                  .map((t) => (
                    <Pressable
                      key={t.id}
                      onPress={() => {
                        Haptics.selectionAsync();
                        setSelectedTaskId(t.id);
                      }}
                      style={[
                        styles.taskOption,
                        { borderBottomColor: colors.border },
                      ]}
                    >
                      <Text
                        style={[styles.taskOptionText, { color: colors.textPrimary }]}
                        numberOfLines={1}
                      >
                        {t.title}
                      </Text>
                      <Feather name="chevron-right" size={14} color={colors.textSecondary} />
                    </Pressable>
                  ))}
              </ScrollView>
            )}
          </View>
        )}

        <View style={styles.tomatoRow}>
          {Array.from({ length: Math.max(4, sessionsToday + 1) }).map((_, i) => (
            <Text key={i} style={[styles.tomato, { opacity: i < sessionsToday ? 1 : 0.25 }]}>
              🍅
            </Text>
          ))}
        </View>

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
    paddingLeft: 60,
    paddingBottom: 12,
  },
  headerTitle: { fontSize: 24, fontWeight: "800" },
  sessionBadge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10 },
  sessionText: { fontSize: 12, fontWeight: "600" },
  scroll: { paddingHorizontal: 20, paddingBottom: 40 },
  modeRow: { flexDirection: "row", gap: 8, marginTop: 16, marginBottom: 8 },
  modePill: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
  },
  timerContainer: { alignItems: "center", paddingVertical: 40 },
  svgContainer: { alignItems: "center", gap: 8 },
  timerText: { fontSize: 64, fontWeight: "800", letterSpacing: 2 },
  modeName: { fontSize: 16, fontWeight: "600" },
  btnRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 20,
    marginBottom: 32,
  },
  resetBtn: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  mainBtn: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: "center",
    justifyContent: "center",
    elevation: 6,
    shadowColor: "#7C3AED",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
  sessionsCount: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  sessionsNum: { fontSize: 18, fontWeight: "700" },
  taskSection: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
    gap: 10,
    marginBottom: 20,
  },
  taskSectionTitle: { fontSize: 12, fontWeight: "600", textTransform: "uppercase" },
  selectedTask: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  selectedTaskText: { flex: 1, fontSize: 14, fontWeight: "500" },
  taskOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  taskOptionText: { flex: 1, fontSize: 14 },
  tomatoRow: { flexDirection: "row", justifyContent: "center", gap: 12 },
  tomato: { fontSize: 28 },
});
