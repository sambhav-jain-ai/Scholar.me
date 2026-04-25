import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useMemo, useState } from "react";
import {
  FlatList,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";
import Animated, { FadeIn, FadeInDown, SlideInRight } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAcademic } from "../context/AcademicContext";
import { useTheme } from "../context/ThemeContext";
import { generateId, DAYS, SUBJECT_COLORS } from "../utils/ids";
import type { TimetableEntry, AttendanceRecord } from "../context/AcademicContext";

// ── Helpers ──────────────────────────────────────────────────────
const TODAY = DAYS[new Date().getDay() === 0 ? 6 : new Date().getDay() - 1]; // Mon–Sun index

function todayStr() {
  return new Date().toISOString().split("T")[0];
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: string }> = {
  present: { label: "P",   color: "#10B981", icon: "check" },
  absent:  { label: "A",   color: "#EF4444", icon: "x" },
  late:    { label: "L",   color: "#F59E0B", icon: "clock" },
};

// ── Quick Attendance Buttons ───────────────────────────────────────
function AttendanceMark({
  entry,
  attendance,
  addAttendance,
  colors,
}: {
  entry: TimetableEntry;
  attendance: AttendanceRecord[];
  addAttendance: (r: AttendanceRecord) => void;
  colors: any;
}) {
  const today = todayStr();
  const todayRecord = attendance.find(
    (r) => r.subjectId === entry.subjectId && r.date === today
  );

  const mark = (status: AttendanceRecord["status"]) => {
    if (todayRecord?.status === status) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // If same status tapped again, we return above. 
    // This prevents duplicate firestore records for the same day/subject.
    addAttendance({
      id: generateId(),
      subjectId: entry.subjectId,
      date: today,
      status,
    });
  };

  return (
    <View style={styles.attendRow}>
      <Text style={[styles.attendLabel, { color: colors.textSecondary }]}>Today</Text>
      <View style={styles.attendBtns}>
        {(["present", "absent", "late"] as const).map((s) => {
          const cfg = STATUS_CONFIG[s];
          const active = todayRecord?.status === s;
          return (
            <Pressable
              key={s}
              onPress={() => mark(s)}
              style={[
                styles.attendBtn,
                { borderColor: active ? cfg.color : colors.border },
                active && { backgroundColor: cfg.color + "20" },
              ]}
            >
              <Feather
                name={cfg.icon as any}
                size={13}
                color={active ? cfg.color : colors.textSecondary}
              />
              <Text style={[styles.attendBtnText, { color: active ? cfg.color : colors.textSecondary }]}>
                {cfg.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

// ── Class Card ─────────────────────────────────────────────────────
function ClassCard({
  item,
  index,
  showAttendance,
  attendance,
  addAttendance,
  onDelete,
  colors,
}: {
  item: TimetableEntry;
  index: number;
  showAttendance: boolean;
  attendance: AttendanceRecord[];
  addAttendance: (r: AttendanceRecord) => void;
  onDelete: () => void;
  colors: any;
}) {
  const today = todayStr();
  const todayRecord = attendance.find(
    (r) => r.subjectId === item.subjectId && r.date === today
  );
  const statusCfg = todayRecord ? STATUS_CONFIG[todayRecord.status] : null;

  return (
    <Animated.View entering={SlideInRight.delay(index * 55).springify().damping(14)}>
      <View style={[styles.classCard, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
        {/* Color bar */}
        <View style={[styles.colorBar, { backgroundColor: item.color }]} />

        {/* Class info */}
        <View style={styles.classBody}>
          <View style={styles.classTopRow}>
            <View style={styles.classInfo}>
              <Text style={[styles.className, { color: colors.textPrimary }]}>{item.subjectName}</Text>
              <Text style={[styles.classTime, { color: colors.accent }]}>
                {item.startTime} — {item.endTime}
              </Text>
              {item.teacher ? (
                <Text style={[styles.classMeta, { color: colors.textSecondary }]}>
                  <Feather name="user" size={10} /> {item.teacher}
                </Text>
              ) : null}
              {item.room ? (
                <Text style={[styles.classMeta, { color: colors.textSecondary }]}>
                  <Feather name="map-pin" size={10} /> {item.room}
                </Text>
              ) : null}
            </View>

            <View style={styles.classActions}>
              {/* Today's status badge */}
              {statusCfg && (
                <View style={[styles.statusBadge, { backgroundColor: statusCfg.color + "20" }]}>
                  <Text style={[styles.statusBadgeText, { color: statusCfg.color }]}>
                    {todayRecord!.status}
                  </Text>
                </View>
              )}
              <View style={[styles.recurBadge, { backgroundColor: colors.accent + "20" }]}>
                <Text style={[styles.recurText, { color: colors.accent }]}>{item.recurring}</Text>
              </View>
              <Pressable
                onPress={onDelete}
                style={styles.deleteBtn}
              >
                <Feather name="trash-2" size={15} color={colors.danger} />
              </Pressable>
            </View>
          </View>

          {/* Attendance quick-mark — always shown */}
          <AttendanceMark
            entry={item}
            attendance={attendance}
            addAttendance={addAttendance}
            colors={colors}
          />
        </View>
      </View>
    </Animated.View>
  );
}

// ── Weekly View (all days) ─────────────────────────────────────────
function WeeklyView({
  timetable,
  attendance,
  addAttendance,
  deleteTimetableEntry,
  colors,
}: {
  timetable: TimetableEntry[];
  attendance: AttendanceRecord[];
  addAttendance: (r: AttendanceRecord) => void;
  deleteTimetableEntry: (id: string) => void;
  colors: any;
}) {
  const grouped = useMemo(() => {
    return DAYS.map((day) => ({
      day,
      entries: timetable
        .filter((e) => e.day === day || e.recurring === "daily")
        .sort((a, b) => a.startTime.localeCompare(b.startTime)),
    }));
  }, [timetable]);

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.weeklyScroll}>
      {grouped.map(({ day, entries }) => (
        <View key={day} style={styles.dayGroup}>
          {/* Day header */}
          <View style={styles.dayGroupHeader}>
            <View style={[
              styles.dayDot,
              { backgroundColor: day === TODAY ? colors.accent : colors.border },
            ]} />
            <Text style={[
              styles.dayGroupTitle,
              { color: day === TODAY ? colors.accent : colors.textPrimary,
                fontWeight: day === TODAY ? "800" : "600" },
            ]}>
              {day} {day === TODAY ? "— Today" : ""}
            </Text>
          </View>

          {entries.length === 0 ? (
            <Text style={[styles.dayEmpty, { color: colors.textSecondary }]}>No classes</Text>
          ) : (
            <View style={{ gap: 8 }}>
              {entries.map((item, index) => (
                <ClassCard
                  key={item.id}
                  item={item}
                  index={index}
                  showAttendance={day === TODAY}
                  attendance={attendance}
                  addAttendance={addAttendance}
                  onDelete={() => deleteTimetableEntry(item.id)}
                  colors={colors}
                />
              ))}
            </View>
          )}
        </View>
      ))}
      <View style={{ height: 20 }} />
    </ScrollView>
  );
}

// ── Main Screen ────────────────────────────────────────────────────
export default function TimetableScreen() {
  const { colors } = useTheme();
  const { subjects, timetable, attendance, addTimetableEntry, deleteTimetableEntry, addAttendance } = useAcademic();
  const insets = useSafeAreaInsets();

  const [viewMode,     setViewMode]  = useState<"daily" | "weekly">("daily");
  const [selectedDay,  setSelectedDay] = useState(TODAY);
  const [showAdd,      setShowAdd]   = useState(false);
  const [form, setForm] = useState({
    subjectName: "",
    color: SUBJECT_COLORS[0],
    teacher: "",
    room: "",
    startTime: "09:00",
    endTime: "10:00",
    recurring: "weekly" as TimetableEntry["recurring"],
  });

  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const dayEntries = useMemo(() =>
    timetable
      .filter((e) => e.day === selectedDay || e.recurring === "daily")
      .sort((a, b) => a.startTime.localeCompare(b.startTime)),
    [timetable, selectedDay]
  );

  const handleAdd = () => {
    if (!form.subjectName.trim()) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    // Link tracker — if subject exists by name, use its ID.
    // This ensures attendance marked here shows up in the Attendance screen.
    const existingSubject = subjects.find(
      (s) => s.name.toLowerCase() === form.subjectName.trim().toLowerCase()
    );

    addTimetableEntry({
      id: generateId(),
      subjectId: existingSubject ? existingSubject.id : generateId(),
      subjectName: form.subjectName.trim(),
      color: form.color,
      teacher: form.teacher,
      room: form.room,
      day: viewMode === "daily" ? selectedDay : selectedDay,
      startTime: form.startTime,
      endTime: form.endTime,
      recurring: form.recurring,
    });
    setForm({
      subjectName: "",
      color: SUBJECT_COLORS[0],
      teacher: "",
      room: "",
      startTime: "09:00",
      endTime: "10:00",
      recurring: "weekly",
    });
    setShowAdd(false);
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.bgPrimary }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topPad + 10, height: 44 + topPad + 10, alignItems: "center", backgroundColor: colors.bgPrimary }]}>
        <View>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Timetable</Text>
          <Text style={[styles.headerSub, { color: colors.textSecondary }]}>
            {viewMode === "daily" ? selectedDay : "Full Week"}
          </Text>
        </View>
        <View style={styles.headerRight}>
          {/* Daily / Weekly toggle */}
          <View style={[styles.togglePill, { backgroundColor: colors.bgSecondary, borderColor: colors.border }]}>
            <Pressable
              onPress={() => { Haptics.selectionAsync(); setViewMode("daily"); }}
              style={[styles.toggleOpt, viewMode === "daily" && { backgroundColor: colors.accent }]}
            >
              <Text style={[styles.toggleText, { color: viewMode === "daily" ? "#FFF" : colors.textSecondary }]}>
                Day
              </Text>
            </Pressable>
            <Pressable
              onPress={() => { Haptics.selectionAsync(); setViewMode("weekly"); }}
              style={[styles.toggleOpt, viewMode === "weekly" && { backgroundColor: colors.accent }]}
            >
              <Text style={[styles.toggleText, { color: viewMode === "weekly" ? "#FFF" : colors.textSecondary }]}>
                Week
              </Text>
            </Pressable>
          </View>

          {/* Add class */}
          <Pressable
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setShowAdd(true); }}
            style={[styles.addBtn, { backgroundColor: colors.accent }]}
          >
            <Feather name="plus" size={20} color="#FFF" />
          </Pressable>
        </View>
      </View>

      {/* Day picker — only in daily mode */}
      {viewMode === "daily" && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.dayScroll} contentContainerStyle={styles.dayRow}>
          {DAYS.map((day) => (
            <Pressable
              key={day}
              onPress={() => { Haptics.selectionAsync(); setSelectedDay(day); }}
              style={[
                styles.dayPill,
                {
                  backgroundColor: selectedDay === day ? colors.accent : colors.bgCard,
                  borderColor: selectedDay === day ? colors.accent : colors.border,
                },
              ]}
            >
              <Text style={[styles.dayPillText, { color: selectedDay === day ? "#FFF" : colors.textSecondary, fontWeight: selectedDay === day ? "700" : "400" }]}>
                {day.substring(0, 3)}
              </Text>
              {day === TODAY && (
                <View style={[styles.todayDot, { backgroundColor: selectedDay === day ? "#FFF" : colors.accent }]} />
              )}
            </Pressable>
          ))}
        </ScrollView>
      )}

      {/* Content */}
      {viewMode === "weekly" ? (
        <WeeklyView
          timetable={timetable}
          attendance={attendance}
          addAttendance={addAttendance}
          deleteTimetableEntry={deleteTimetableEntry}
          colors={colors}
        />
      ) : dayEntries.length === 0 ? (
        <Animated.View entering={FadeIn.duration(400)} style={styles.emptyState}>
          <Feather name="calendar" size={48} color={colors.textSecondary} />
          <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>No classes on {selectedDay}</Text>
          <Text style={[styles.emptyHint, { color: colors.textSecondary }]}>Tap + to add a class</Text>
        </Animated.View>
      ) : (
        <FlatList
          data={dayEntries}
          keyExtractor={(e) => e.id}
          contentContainerStyle={styles.listContent}
          renderItem={({ item, index }) => (
            <ClassCard
              item={item}
              index={index}
              showAttendance={true}
              attendance={attendance}
              addAttendance={addAttendance}
              onDelete={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                deleteTimetableEntry(item.id);
              }}
              colors={colors}
            />
          )}
        />
      )}

      {/* Add class modal */}
      <Modal visible={showAdd} transparent animationType="slide" onRequestClose={() => setShowAdd(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setShowAdd(false)}>
          <Pressable style={[styles.sheet, { backgroundColor: colors.bgCard }]} onPress={(e) => e.stopPropagation()}>
            <View style={styles.sheetHandle} />
            <Text style={[styles.sheetTitle, { color: colors.textPrimary }]}>
              Add Class — {selectedDay}
            </Text>

            <TextInput
              style={[styles.sheetInput, { backgroundColor: colors.bgSecondary, color: colors.textPrimary, borderColor: colors.border }]}
              placeholder="Subject name *"
              placeholderTextColor={colors.textSecondary}
              value={form.subjectName}
              onChangeText={(t) => setForm((f) => ({ ...f, subjectName: t }))}
            />

            <View style={styles.colorRow}>
              {SUBJECT_COLORS.map((c) => (
                <Pressable key={c} onPress={() => setForm((f) => ({ ...f, color: c }))}
                  style={[styles.colorDot, { backgroundColor: c }, form.color === c && styles.colorDotActive]} />
              ))}
            </View>

            <View style={styles.timeRow}>
              <View style={styles.timeField}>
                <Text style={[styles.timeLabel, { color: colors.textSecondary }]}>Start</Text>
                <TextInput
                  style={[styles.timeInput, { backgroundColor: colors.bgSecondary, color: colors.textPrimary, borderColor: colors.border }]}
                  value={form.startTime}
                  onChangeText={(t) => setForm((f) => ({ ...f, startTime: t }))}
                  placeholder="09:00"
                  placeholderTextColor={colors.textSecondary}
                />
              </View>
              <View style={styles.timeField}>
                <Text style={[styles.timeLabel, { color: colors.textSecondary }]}>End</Text>
                <TextInput
                  style={[styles.timeInput, { backgroundColor: colors.bgSecondary, color: colors.textPrimary, borderColor: colors.border }]}
                  value={form.endTime}
                  onChangeText={(t) => setForm((f) => ({ ...f, endTime: t }))}
                  placeholder="10:00"
                  placeholderTextColor={colors.textSecondary}
                />
              </View>
            </View>

            <TextInput
              style={[styles.sheetInput, { backgroundColor: colors.bgSecondary, color: colors.textPrimary, borderColor: colors.border }]}
              placeholder="Teacher / Professor (optional)"
              placeholderTextColor={colors.textSecondary}
              value={form.teacher}
              onChangeText={(t) => setForm((f) => ({ ...f, teacher: t }))}
            />

            <TextInput
              style={[styles.sheetInput, { backgroundColor: colors.bgSecondary, color: colors.textPrimary, borderColor: colors.border }]}
              placeholder="Room / Building (optional)"
              placeholderTextColor={colors.textSecondary}
              value={form.room}
              onChangeText={(t) => setForm((f) => ({ ...f, room: t }))}
            />

            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.recurRow}>
                {(["one-time", "daily", "weekly", "biweekly"] as const).map((r) => (
                  <Pressable
                    key={r}
                    onPress={() => setForm((f) => ({ ...f, recurring: r }))}
                    style={[styles.recurOption, {
                      backgroundColor: form.recurring === r ? colors.accent : colors.bgSecondary,
                      borderColor: form.recurring === r ? colors.accent : colors.border,
                    }]}
                  >
                    <Text style={{ color: form.recurring === r ? "#FFF" : colors.textSecondary, fontSize: 13 }}>
                      {r}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </ScrollView>

            <View style={styles.sheetBtnRow}>
              <Pressable onPress={() => setShowAdd(false)} style={[styles.sheetBtn, { backgroundColor: colors.bgSecondary }]}>
                <Text style={{ color: colors.textSecondary, fontWeight: "600" }}>Cancel</Text>
              </Pressable>
              <Pressable onPress={handleAdd} style={[styles.sheetBtn, { backgroundColor: colors.accent }]}>
                <Text style={{ color: "#FFF", fontWeight: "700" }}>Add Class</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

// ── Styles ─────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: { flex: 1 },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingRight: 16,
    paddingLeft: 56,
    paddingBottom: 14,
  },
  headerTitle: { fontSize: 22, fontWeight: "800" },
  headerSub: { fontSize: 12, marginTop: 1 },
  headerRight: { flexDirection: "row", alignItems: "center", gap: 10 },

  // Day / Week toggle pill
  togglePill: {
    flexDirection: "row",
    borderRadius: 22,
    borderWidth: 1,
    overflow: "hidden",
    padding: 3,
    gap: 2,
  },
  toggleOpt: {
    paddingHorizontal: 13,
    paddingVertical: 5,
    borderRadius: 18,
  },
  toggleText: { fontSize: 12, fontWeight: "600" },

  addBtn: { width: 38, height: 38, borderRadius: 19, alignItems: "center", justifyContent: "center" },

  // Day pill strip
  dayScroll: { maxHeight: 52 },
  dayRow: { paddingHorizontal: 16, paddingVertical: 8, gap: 8, flexDirection: "row" },
  dayPill: {
    paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20,
    borderWidth: 1, alignItems: "center", flexDirection: "row", gap: 5,
  },
  dayPillText: { fontSize: 14 },
  todayDot: { width: 5, height: 5, borderRadius: 3 },

  emptyState: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  emptyTitle: { fontSize: 18, fontWeight: "600" },
  emptyHint: { fontSize: 14 },

  listContent: { padding: 16, gap: 10 },

  // Class card
  classCard: {
    flexDirection: "row",
    borderRadius: 14,
    borderWidth: 1,
    overflow: "hidden",
  },
  colorBar: { width: 5 },
  classBody: { flex: 1, padding: 12, gap: 10 },
  classTopRow: { flexDirection: "row", gap: 8 },
  classInfo: { flex: 1, gap: 2 },
  className: { fontSize: 16, fontWeight: "700" },
  classTime: { fontSize: 13, fontWeight: "600" },
  classMeta: { fontSize: 12 },
  classActions: { alignItems: "flex-end", gap: 6 },
  statusBadge: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6 },
  statusBadgeText: { fontSize: 10, fontWeight: "700" },
  recurBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  recurText: { fontSize: 10, fontWeight: "600" },
  deleteBtn: { padding: 4 },

  // Attendance row
  attendRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  attendLabel: { fontSize: 10, fontWeight: "600", letterSpacing: 0.4, minWidth: 34 },
  attendBtns: { flexDirection: "row", gap: 6 },
  attendBtn: {
    flexDirection: "row", alignItems: "center", gap: 4,
    paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: 20, borderWidth: 1,
  },
  attendBtnText: { fontSize: 11, fontWeight: "700" },

  // Weekly view
  weeklyScroll: { padding: 16, gap: 4 },
  dayGroup: { marginBottom: 20 },
  dayGroupHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 10 },
  dayDot: { width: 8, height: 8, borderRadius: 4 },
  dayGroupTitle: { fontSize: 14, letterSpacing: 0.2 },
  dayEmpty: { fontSize: 12, paddingLeft: 16, fontStyle: "italic" },

  // Modal / sheet
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "flex-end" },
  sheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, gap: 12, maxHeight: "85%" },
  sheetHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: "#555", alignSelf: "center", marginBottom: 8 },
  sheetTitle: { fontSize: 18, fontWeight: "700", marginBottom: 4 },
  sheetInput: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, fontSize: 15 },
  colorRow: { flexDirection: "row", gap: 10, flexWrap: "wrap" },
  colorDot: { width: 28, height: 28, borderRadius: 14 },
  colorDotActive: { borderWidth: 3, borderColor: "#FFF" },
  timeRow: { flexDirection: "row", gap: 12 },
  timeField: { flex: 1, gap: 4 },
  timeLabel: { fontSize: 12 },
  timeInput: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, fontSize: 15, textAlign: "center" },
  recurRow: { flexDirection: "row", gap: 8 },
  recurOption: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 8, borderWidth: 1 },
  sheetBtnRow: { flexDirection: "row", gap: 12, marginTop: 8 },
  sheetBtn: { flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: "center" },
});
