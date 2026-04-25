import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import Animated, { FadeIn, SlideInRight } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAcademic } from "../context/AcademicContext";
import { useTheme } from "../context/ThemeContext";
import { generateId } from "../utils/ids";
import type { Note } from "../context/AcademicContext";
import { fetch } from "expo/fetch";

const BASE_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:3001";

async function summarizeNote(content: string): Promise<string> {
  const response = await fetch(`${BASE_URL}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      messages: [
        {
          role: "user",
          content: `Summarize these study notes into clear bullet points. Include: key concepts, important terms, things to remember for exams. Format concisely:\n\n${content}`,
        },
      ],
    }),
  });
  if (!response.ok) throw new Error("API error");
  const data = await response.json();
  return data.content || "";
}

export default function NotesScreen() {
  const { colors } = useTheme();
  const { notes, subjects, addNote, updateNote, deleteNote } = useAcademic();
  const insets = useSafeAreaInsets();
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [search, setSearch] = useState("");
  const [summarizingId, setSummarizingId] = useState<string | null>(null);
  const [form, setForm] = useState({ title: "", content: "", subjectId: "" });

  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const filtered = notes.filter((n) => {
    const matchSub = selectedSubject ? n.subjectId === selectedSubject : true;
    const matchSearch = search
      ? n.title.toLowerCase().includes(search.toLowerCase()) ||
        n.content.toLowerCase().includes(search.toLowerCase())
      : true;
    return matchSub && matchSearch;
  });

  const handleAdd = () => {
    if (!form.title.trim() || !form.content.trim()) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    addNote({
      id: generateId(),
      title: form.title.trim(),
      content: form.content.trim(),
      subjectId: form.subjectId || undefined,
      tags: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    setForm({ title: "", content: "", subjectId: "" });
    setShowAdd(false);
  };

  const handleSummarize = async (note: Note) => {
    setSummarizingId(note.id);
    try {
      const summary = await summarizeNote(note.content);
      updateNote(note.id, { summary });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      // ignore
    } finally {
      setSummarizingId(null);
    }
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
          Notes
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

      <View style={[styles.searchBar, { borderColor: colors.border }]}>
        <Feather name="search" size={16} color={colors.textSecondary} />
        <TextInput
          style={[styles.searchInput, { color: colors.textPrimary }]}
          placeholder="Search notes..."
          placeholderTextColor={colors.textSecondary}
          value={search}
          onChangeText={setSearch}
        />
        {search.length > 0 && (
          <Pressable onPress={() => setSearch("")}>
            <Feather name="x" size={16} color={colors.textSecondary} />
          </Pressable>
        )}
      </View>

      {subjects.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.subjectScroll}
          contentContainerStyle={styles.subjectRow}
        >
          <Pressable
            onPress={() => setSelectedSubject(null)}
            style={[
              styles.subjectPill,
              {
                backgroundColor: !selectedSubject ? colors.accent : colors.bgCard,
                borderColor: !selectedSubject ? colors.accent : colors.border,
              },
            ]}
          >
            <Text
              style={{
                color: !selectedSubject ? "#FFF" : colors.textSecondary,
                fontSize: 13,
              }}
            >
              All
            </Text>
          </Pressable>
          {subjects.map((s) => (
            <Pressable
              key={s.id}
              onPress={() =>
                setSelectedSubject(selectedSubject === s.id ? null : s.id)
              }
              style={[
                styles.subjectPill,
                {
                  backgroundColor:
                    selectedSubject === s.id ? s.color : colors.bgCard,
                  borderColor:
                    selectedSubject === s.id ? s.color : colors.border,
                },
              ]}
            >
              <Text
                style={{
                  color: selectedSubject === s.id ? "#FFF" : colors.textSecondary,
                  fontSize: 13,
                }}
              >
                {s.name}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      )}

      {filtered.length === 0 ? (
        <Animated.View entering={FadeIn.duration(400)} style={styles.emptyState}>
          <Feather name="book-open" size={48} color={colors.textSecondary} />
          <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>
            No notes yet
          </Text>
          <Text style={[styles.emptyHint, { color: colors.textSecondary }]}>
            Tap + to add a note
          </Text>
        </Animated.View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(n) => n.id}
          contentContainerStyle={styles.listContent}
          renderItem={({ item, index }) => {
            const subject = subjects.find((s) => s.id === item.subjectId);
            return (
              <Animated.View
                entering={SlideInRight.delay(index * 60).springify().damping(14)}
                style={[
                  styles.noteCard,
                  { backgroundColor: colors.bgCard, borderColor: colors.border },
                ]}
              >
                <View style={styles.noteHeader}>
                  <View style={styles.noteTitleRow}>
                    {subject && (
                      <View
                        style={[styles.subTag, { backgroundColor: subject.color + "25" }]}
                      >
                        <Text style={[styles.subTagText, { color: subject.color }]}>
                          {subject.name}
                        </Text>
                      </View>
                    )}
                    <Text
                      style={[styles.noteTitle, { color: colors.textPrimary }]}
                      numberOfLines={1}
                    >
                      {item.title}
                    </Text>
                  </View>
                  <Pressable
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                      deleteNote(item.id);
                    }}
                  >
                    <Feather name="trash-2" size={15} color={colors.textSecondary} />
                  </Pressable>
                </View>
                <Text
                  style={[styles.noteContent, { color: colors.textSecondary }]}
                  numberOfLines={3}
                >
                  {item.content}
                </Text>

                {item.summary && (
                  <View
                    style={[styles.summaryBox, { backgroundColor: colors.accent + "12" }]}
                  >
                    <Feather name="zap" size={12} color={colors.accent} />
                    <Text style={[styles.summaryText, { color: colors.textSecondary }]}>
                      {item.summary}
                    </Text>
                  </View>
                )}

                <View style={styles.noteFooter}>
                  <Text style={[styles.noteDate, { color: colors.textSecondary }]}>
                    {new Date(item.createdAt).toLocaleDateString()}
                  </Text>
                  {!item.summary && (
                    <Pressable
                      onPress={() => handleSummarize(item)}
                      disabled={summarizingId === item.id}
                      style={[
                        styles.summBtn,
                        { backgroundColor: colors.accent + "20" },
                      ]}
                    >
                      {summarizingId === item.id ? (
                        <ActivityIndicator size="small" color={colors.accent} />
                      ) : (
                        <>
                          <Feather name="zap" size={12} color={colors.accent} />
                          <Text style={[styles.summBtnText, { color: colors.accent }]}>
                            Summarize
                          </Text>
                        </>
                      )}
                    </Pressable>
                  )}
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
              New Note
            </Text>

            <TextInput
              style={[
                styles.sheetInput,
                {
                  backgroundColor: colors.bgSecondary,
                  color: colors.textPrimary,
                  borderColor: colors.border,
                },
              ]}
              placeholder="Title *"
              placeholderTextColor={colors.textSecondary}
              value={form.title}
              onChangeText={(t) => setForm((f) => ({ ...f, title: t }))}
            />

            <TextInput
              style={[
                styles.sheetInput,
                styles.contentInput,
                {
                  backgroundColor: colors.bgSecondary,
                  color: colors.textPrimary,
                  borderColor: colors.border,
                },
              ]}
              placeholder="Note content *"
              placeholderTextColor={colors.textSecondary}
              value={form.content}
              onChangeText={(t) => setForm((f) => ({ ...f, content: t }))}
              multiline
            />

            {subjects.length > 0 && (
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.subjectPillRow}>
                  <Pressable
                    onPress={() => setForm((f) => ({ ...f, subjectId: "" }))}
                    style={[
                      styles.subjectPill,
                      {
                        backgroundColor: !form.subjectId ? colors.accent : colors.bgSecondary,
                        borderColor: !form.subjectId ? colors.accent : colors.border,
                      },
                    ]}
                  >
                    <Text style={{ color: !form.subjectId ? "#FFF" : colors.textSecondary, fontSize: 13 }}>
                      None
                    </Text>
                  </Pressable>
                  {subjects.map((s) => (
                    <Pressable
                      key={s.id}
                      onPress={() => setForm((f) => ({ ...f, subjectId: s.id }))}
                      style={[
                        styles.subjectPill,
                        {
                          backgroundColor: form.subjectId === s.id ? s.color : colors.bgSecondary,
                          borderColor: form.subjectId === s.id ? s.color : colors.border,
                        },
                      ]}
                    >
                      <Text style={{ color: form.subjectId === s.id ? "#FFF" : colors.textSecondary, fontSize: 13 }}>
                        {s.name}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </ScrollView>
            )}

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
                <Text style={{ color: "#FFF", fontWeight: "700" }}>Save Note</Text>
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
  addBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginHorizontal: 16,
    marginTop: 10,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  searchInput: { flex: 1, fontSize: 15 },
  subjectScroll: { maxHeight: 44 },
  subjectRow: { paddingHorizontal: 16, paddingVertical: 8, gap: 8, flexDirection: "row" },
  subjectPill: {
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    padding: 32,
  },
  emptyTitle: { fontSize: 18, fontWeight: "600" },
  emptyHint: { fontSize: 14 },
  listContent: { padding: 16, gap: 12 },
  noteCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    gap: 10,
  },
  noteHeader: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between" },
  noteTitleRow: { flex: 1, gap: 4 },
  subTag: { alignSelf: "flex-start", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  subTagText: { fontSize: 11, fontWeight: "600" },
  noteTitle: { fontSize: 16, fontWeight: "700" },
  noteContent: { fontSize: 14, lineHeight: 20 },
  summaryBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    padding: 10,
    borderRadius: 8,
  },
  summaryText: { flex: 1, fontSize: 13, lineHeight: 18 },
  noteFooter: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  noteDate: { fontSize: 11 },
  summBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  summBtnText: { fontSize: 12, fontWeight: "600" },
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
    maxHeight: "85%",
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#555",
    alignSelf: "center",
    marginBottom: 8,
  },
  sheetTitle: { fontSize: 18, fontWeight: "700" },
  sheetInput: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
  },
  contentInput: { minHeight: 120, textAlignVertical: "top" },
  subjectPillRow: { flexDirection: "row", gap: 8 },
  sheetBtnRow: { flexDirection: "row", gap: 12, marginTop: 8 },
  sheetBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
});
