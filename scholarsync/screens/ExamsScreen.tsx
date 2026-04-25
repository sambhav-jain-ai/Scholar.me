import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useState } from "react";
import {
  FlatList,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import Animated, { FadeIn, SlideInDown } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAcademic } from "../context/AcademicContext";
import { useTheme } from "../context/ThemeContext";
import { generateId } from "../utils/ids";
import type { Exam } from "../context/AcademicContext";

export default function ExamsScreen() {
  const { colors } = useTheme();
  const { exams, addExam, deleteExam } = useAcademic();
  const insets = useSafeAreaInsets();
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({
    subjectName: "",
    subjectId: "",
    date: "",
    time: "",
    venue: "",
    duration: "",
  });

  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const sortedExams = [...exams].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  const upcoming = sortedExams.filter((e) => new Date(e.date) >= new Date());
  const past = sortedExams.filter((e) => new Date(e.date) < new Date());

  const handleAdd = () => {
    if (!form.subjectName.trim() || !form.date) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    addExam({
      id: generateId(),
      subjectId: form.subjectId || generateId(),
      subjectName: form.subjectName.trim(),
      date: form.date,
      time: form.time || undefined,
      venue: form.venue || undefined,
      duration: form.duration || undefined,
    });
    setForm({ subjectName: "", subjectId: "", date: "", time: "", venue: "", duration: "" });
    setShowAdd(false);
  };

  const getDaysLeft = (date: string) => {
    return Math.ceil((new Date(date).getTime() - Date.now()) / 86400000);
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
          Exams
        </Text>
        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setShowAdd(true);
          }}
          style={[styles.addBtn, { backgroundColor: colors.accent }]}
        >
          <Feather name="plus" size={20} color="#FFF" />
        </Pressable>
      </View>

      {exams.length === 0 ? (
        <Animated.View entering={FadeIn.duration(400)} style={styles.emptyState}>
          <Feather name="award" size={48} color={colors.textSecondary} />
          <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>
            No exams scheduled
          </Text>
          <Text style={[styles.emptyHint, { color: colors.textSecondary }]}>
            Tap + to add an upcoming exam
          </Text>
        </Animated.View>
      ) : (
        <FlatList
          data={[
            ...(upcoming.length > 0 ? [{ type: "section", title: "Upcoming" } as any] : []),
            ...upcoming,
            ...(past.length > 0 ? [{ type: "section", title: "Past" } as any] : []),
            ...past,
          ]}
          keyExtractor={(item, i) =>
            item.type === "section" ? `section-${i}` : item.id
          }
          contentContainerStyle={styles.listContent}
          renderItem={({ item, index }) => {
            if (item.type === "section") {
              return (
                <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
                  {item.title}
                </Text>
              );
            }
            const days = getDaysLeft(item.date);
            const urgColor =
              days <= 3 ? "#EF4444" : days <= 7 ? "#F59E0B" : colors.success;
            return (
              <Animated.View
                entering={SlideInDown.delay(index * 60).springify().damping(14)}
                style={[
                  styles.examCard,
                  {
                    backgroundColor: colors.bgCard,
                    borderColor: colors.border,
                    borderLeftColor: urgColor,
                  },
                ]}
              >
                <View style={styles.examInfo}>
                  <Text style={[styles.examSubject, { color: colors.textPrimary }]}>
                    {item.subjectName}
                  </Text>
                  <View style={styles.examMeta}>
                    <Feather name="calendar" size={13} color={colors.textSecondary} />
                    <Text style={[styles.examMetaText, { color: colors.textSecondary }]}>
                      {item.date}
                      {item.time ? ` • ${item.time}` : ""}
                    </Text>
                  </View>
                  {item.venue && (
                    <View style={styles.examMeta}>
                      <Feather name="map-pin" size={13} color={colors.textSecondary} />
                      <Text style={[styles.examMetaText, { color: colors.textSecondary }]}>
                        {item.venue}
                      </Text>
                    </View>
                  )}
                  {item.duration && (
                    <View style={styles.examMeta}>
                      <Feather name="clock" size={13} color={colors.textSecondary} />
                      <Text style={[styles.examMetaText, { color: colors.textSecondary }]}>
                        {item.duration}
                      </Text>
                    </View>
                  )}
                </View>
                <View style={styles.examRight}>
                  {days >= 0 && (
                    <View style={[styles.daysLeft, { backgroundColor: urgColor + "20" }]}>
                      <Text style={[styles.daysNum, { color: urgColor }]}>
                        {days}
                      </Text>
                      <Text style={[styles.daysLabel, { color: urgColor }]}>days</Text>
                    </View>
                  )}
                  <Pressable
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                      deleteExam(item.id);
                    }}
                  >
                    <Feather name="trash-2" size={15} color={colors.textSecondary} />
                  </Pressable>
                </View>
              </Animated.View>
            );
          }}
        />
      )}

      <Modal
        visible={showAdd}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAdd(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setShowAdd(false)}>
          <Pressable
            style={[styles.sheet, { backgroundColor: colors.bgCard }]}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={styles.sheetHandle} />
            <Text style={[styles.sheetTitle, { color: colors.textPrimary }]}>
              Add Exam
            </Text>

            {[
              { field: "subjectName", placeholder: "Subject *" },
              { field: "date", placeholder: "Date (YYYY-MM-DD) *" },
              { field: "time", placeholder: "Time (HH:MM, optional)" },
              { field: "venue", placeholder: "Venue (optional)" },
              { field: "duration", placeholder: "Duration (e.g. 2 hours, optional)" },
            ].map(({ field, placeholder }) => (
              <TextInput
                key={field}
                style={[
                  styles.sheetInput,
                  {
                    backgroundColor: colors.bgSecondary,
                    color: colors.textPrimary,
                    borderColor: colors.border,
                  },
                ]}
                placeholder={placeholder}
                placeholderTextColor={colors.textSecondary}
                value={form[field as keyof typeof form]}
                onChangeText={(t) => setForm((f) => ({ ...f, [field]: t }))}
              />
            ))}

            <View style={styles.sheetBtnRow}>
              <Pressable
                onPress={() => setShowAdd(false)}
                style={[styles.sheetBtn, { backgroundColor: colors.bgSecondary }]}
              >
                <Text style={{ color: colors.textSecondary, fontWeight: "600" }}>
                  Cancel
                </Text>
              </Pressable>
              <Pressable
                onPress={handleAdd}
                style={[styles.sheetBtn, { backgroundColor: colors.accent }]}
              >
                <Text style={{ color: "#FFF", fontWeight: "700" }}>Add Exam</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
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
  addBtn: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  emptyState: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12, padding: 32 },
  emptyTitle: { fontSize: 18, fontWeight: "600" },
  emptyHint: { fontSize: 14 },
  listContent: { padding: 16, gap: 10 },
  sectionLabel: { fontSize: 13, fontWeight: "700", marginTop: 8, marginBottom: 4 },
  examCard: {
    flexDirection: "row",
    borderRadius: 14,
    borderWidth: 1,
    borderLeftWidth: 4,
    padding: 14,
    gap: 12,
    alignItems: "flex-start",
  },
  examInfo: { flex: 1, gap: 5 },
  examSubject: { fontSize: 17, fontWeight: "700" },
  examMeta: { flexDirection: "row", alignItems: "center", gap: 6 },
  examMetaText: { fontSize: 13 },
  examRight: { alignItems: "center", gap: 12 },
  daysLeft: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10, alignItems: "center" },
  daysNum: { fontSize: 22, fontWeight: "800" },
  daysLabel: { fontSize: 10 },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "flex-end",
  },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    gap: 12,
  },
  sheetHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: "#555", alignSelf: "center", marginBottom: 8 },
  sheetTitle: { fontSize: 18, fontWeight: "700" },
  sheetInput: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
  },
  sheetBtnRow: { flexDirection: "row", gap: 12, marginTop: 8 },
  sheetBtn: { flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: "center" },
});
