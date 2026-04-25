import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useState } from "react";
import {
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
import Animated, {
  FadeIn,
  FadeOut,
  SlideInRight,
  SlideOutLeft,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAcademic } from "../context/AcademicContext";
import { useTheme } from "../context/ThemeContext";
import { generateId } from "../utils/ids";
import type { TodoItem } from "../context/AcademicContext";

const PRIORITY_COLORS = { high: "#EF4444", medium: "#F59E0B", low: "#3B82F6" };
const PRIORITY_ICONS = { high: "alert-circle", medium: "minus-circle", low: "info" };

function TodoCard({
  todo,
  onComplete,
  onDelete,
}: {
  todo: TodoItem;
  onComplete: () => void;
  onDelete: () => void;
}) {
  const { colors } = useTheme();
  const [expanded, setExpanded] = useState(false);
  const { updateTodo } = useAcademic();

  const completedSubs = todo.subtasks.filter((s) => s.completed).length;

  return (
    <Animated.View
      entering={SlideInRight.springify().damping(14)}
      exiting={SlideOutLeft.duration(300)}
      style={[
        styles.todoCard,
        {
          backgroundColor: colors.bgCard,
          borderColor: todo.completed ? colors.border : PRIORITY_COLORS[todo.priority] + "40",
          borderLeftWidth: 4,
          borderLeftColor: PRIORITY_COLORS[todo.priority],
          opacity: todo.completed ? 0.5 : 1,
        },
      ]}
    >
      <Pressable
        onPress={() => {
          if (!todo.completed) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            onComplete();
          }
        }}
        style={[
          styles.checkbox,
          {
            borderColor: todo.completed ? colors.success : colors.border,
            backgroundColor: todo.completed ? colors.success + "20" : "transparent",
          },
        ]}
      >
        {todo.completed && (
          <Feather name="check" size={14} color={colors.success} />
        )}
      </Pressable>

      <Pressable
        style={styles.todoBody}
        onPress={() => setExpanded((e) => !e)}
      >
        <View style={styles.todoTitleRow}>
          <Text
            style={[
              styles.todoTitle,
              {
                color: colors.textPrimary,
                textDecorationLine: todo.completed ? "line-through" : "none",
              },
            ]}
            numberOfLines={expanded ? undefined : 1}
          >
            {todo.title}
          </Text>
          <Feather
            name={PRIORITY_ICONS[todo.priority] as any}
            size={14}
            color={PRIORITY_COLORS[todo.priority]}
          />
        </View>

        <View style={styles.todoMeta}>
          {todo.dueDate && (
            <View style={[styles.metaBadge, { backgroundColor: colors.bgSecondary }]}>
              <Feather name="calendar" size={10} color={colors.textSecondary} />
              <Text style={[styles.metaText, { color: colors.textSecondary }]}>
                {todo.dueDate}
              </Text>
            </View>
          )}
          {todo.subtasks.length > 0 && (
            <View style={[styles.metaBadge, { backgroundColor: colors.bgSecondary }]}>
              <Feather name="list" size={10} color={colors.textSecondary} />
              <Text style={[styles.metaText, { color: colors.textSecondary }]}>
                {completedSubs}/{todo.subtasks.length}
              </Text>
            </View>
          )}
        </View>

        {expanded && todo.subtasks.length > 0 && (
          <View style={styles.subtaskList}>
            {todo.subtasks.map((sub) => (
              <Pressable
                key={sub.id}
                onPress={() => {
                  Haptics.selectionAsync();
                  const updated = todo.subtasks.map((s) =>
                    s.id === sub.id ? { ...s, completed: !s.completed } : s
                  );
                  updateTodo(todo.id, { subtasks: updated });
                }}
                style={styles.subtaskRow}
              >
                <View
                  style={[
                    styles.subCheck,
                    {
                      borderColor: sub.completed ? colors.success : colors.border,
                      backgroundColor: sub.completed ? colors.success + "20" : "transparent",
                    },
                  ]}
                >
                  {sub.completed && (
                    <Feather name="check" size={10} color={colors.success} />
                  )}
                </View>
                <Text
                  style={[
                    styles.subTitle,
                    {
                      color: colors.textSecondary,
                      textDecorationLine: sub.completed ? "line-through" : "none",
                    },
                  ]}
                >
                  {sub.title}
                </Text>
              </Pressable>
            ))}
          </View>
        )}
      </Pressable>

      <Pressable
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          onDelete();
        }}
        style={styles.deleteBtn}
      >
        <Feather name="trash-2" size={15} color={colors.textSecondary} />
      </Pressable>
    </Animated.View>
  );
}

export default function TodoScreen() {
  const { colors } = useTheme();
  const { todos, addTodo, updateTodo, deleteTodo, completeTodo } = useAcademic();
  const insets = useSafeAreaInsets();
  const [showAdd, setShowAdd] = useState(false);
  const [filter, setFilter] = useState<"active" | "done">("active");
  const [form, setForm] = useState({
    title: "",
    priority: "medium" as TodoItem["priority"],
    dueDate: "",
  });

  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const filtered = todos.filter((t) =>
    filter === "active" ? !t.completed : t.completed
  );

  const handleAdd = () => {
    if (!form.title.trim()) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    addTodo({
      id: generateId(),
      title: form.title.trim(),
      priority: form.priority,
      dueDate: form.dueDate || undefined,
      completed: false,
      subtasks: [],
      createdAt: new Date().toISOString(),
    });
    setForm({ title: "", priority: "medium", dueDate: "" });
    setShowAdd(false);
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
          Tasks
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

      <View style={styles.filterRow}>
        {(["active", "done"] as const).map((f) => (
          <Pressable
            key={f}
            onPress={() => {
              Haptics.selectionAsync();
              setFilter(f);
            }}
            style={[
              styles.filterPill,
              {
                backgroundColor: filter === f ? colors.accent : colors.bgCard,
                borderColor: filter === f ? colors.accent : colors.border,
              },
            ]}
          >
            <Text
              style={{
                color: filter === f ? "#FFF" : colors.textSecondary,
                fontWeight: filter === f ? "700" : "400",
                fontSize: 14,
              }}
            >
              {f === "active"
                ? `Active (${todos.filter((t) => !t.completed).length})`
                : `Done (${todos.filter((t) => t.completed).length})`}
            </Text>
          </Pressable>
        ))}
      </View>

      {filtered.length === 0 ? (
        <Animated.View entering={FadeIn.duration(400)} style={styles.emptyState}>
          <Feather name="check-circle" size={48} color={colors.textSecondary} />
          <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>
            {filter === "active" ? "No pending tasks" : "No completed tasks"}
          </Text>
          {filter === "active" && (
            <Text style={[styles.emptyHint, { color: colors.textSecondary }]}>
              Tap + to add a task
            </Text>
          )}
        </Animated.View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(t) => t.id}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <TodoCard
              todo={item}
              onComplete={() => completeTodo(item.id)}
              onDelete={() => deleteTodo(item.id)}
            />
          )}
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
              New Task
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
              placeholder="Task name *"
              placeholderTextColor={colors.textSecondary}
              value={form.title}
              onChangeText={(t) => setForm((f) => ({ ...f, title: t }))}
              autoFocus
            />

            <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>
              Priority
            </Text>
            <View style={styles.priorityRow}>
              {(["high", "medium", "low"] as const).map((p) => (
                <Pressable
                  key={p}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setForm((f) => ({ ...f, priority: p }));
                  }}
                  style={[
                    styles.priorityBtn,
                    {
                      backgroundColor:
                        form.priority === p
                          ? PRIORITY_COLORS[p]
                          : PRIORITY_COLORS[p] + "20",
                      borderColor: PRIORITY_COLORS[p],
                    },
                  ]}
                >
                  <Text
                    style={{
                      color: form.priority === p ? "#FFF" : PRIORITY_COLORS[p],
                      fontWeight: "600",
                      fontSize: 14,
                    }}
                  >
                    {p.charAt(0).toUpperCase() + p.slice(1)}
                  </Text>
                </Pressable>
              ))}
            </View>

            <TextInput
              style={[
                styles.sheetInput,
                {
                  backgroundColor: colors.bgSecondary,
                  color: colors.textPrimary,
                  borderColor: colors.border,
                },
              ]}
              placeholder="Due date (YYYY-MM-DD, optional)"
              placeholderTextColor={colors.textSecondary}
              value={form.dueDate}
              onChangeText={(t) => setForm((f) => ({ ...f, dueDate: t }))}
            />

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
                <Text style={{ color: "#FFF", fontWeight: "700" }}>Add Task</Text>
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
  filterRow: {
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  filterPill: {
    paddingHorizontal: 16,
    paddingVertical: 7,
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
  listContent: { padding: 16, gap: 10 },
  todoCard: {
    flexDirection: "row",
    borderRadius: 14,
    borderWidth: 1,
    overflow: "hidden",
    padding: 14,
    gap: 10,
    alignItems: "flex-start",
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 1,
  },
  todoBody: { flex: 1, gap: 6 },
  todoTitleRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  todoTitle: { flex: 1, fontSize: 15, fontWeight: "500" },
  todoMeta: { flexDirection: "row", gap: 6, flexWrap: "wrap" },
  metaBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  metaText: { fontSize: 11 },
  subtaskList: { gap: 6, marginTop: 4 },
  subtaskRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  subCheck: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  subTitle: { fontSize: 13 },
  deleteBtn: { padding: 4 },
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
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#555",
    alignSelf: "center",
    marginBottom: 8,
  },
  sheetTitle: { fontSize: 18, fontWeight: "700", marginBottom: 4 },
  sheetInput: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
  },
  fieldLabel: { fontSize: 13, marginTop: 4 },
  priorityRow: { flexDirection: "row", gap: 10 },
  priorityBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1.5,
    alignItems: "center",
  },
  sheetBtnRow: { flexDirection: "row", gap: 12, marginTop: 8 },
  sheetBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
});
