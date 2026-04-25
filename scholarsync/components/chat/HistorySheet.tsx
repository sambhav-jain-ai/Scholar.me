import { Feather } from "@expo/vector-icons";
import React from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import type { Conversation } from "../../types/chat";

interface HistorySheetProps {
  visible: boolean;
  conversations: Conversation[];
  activeId: string;
  onSelect: (id: string) => void;
  onNew: () => void;
  onClose: () => void;
  onDelete: (id: string) => void;
  colors: any;
}

export function HistorySheet({
  visible,
  conversations,
  activeId,
  onSelect,
  onNew,
  onClose,
  onDelete,
  colors,
}: HistorySheetProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable
          style={[styles.sheet, { backgroundColor: colors.bgCard }]}
          onPress={(e) => e.stopPropagation()}
        >
          <View style={styles.handle} />
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.textPrimary }]}>
              Chat History
            </Text>
            <Pressable
              onPress={onNew}
              style={[
                styles.newBtn,
                {
                  backgroundColor: colors.accent + "20",
                  borderColor: colors.accent + "40",
                },
              ]}
            >
              <Feather name="plus" size={14} color={colors.accent} />
              <Text style={[styles.newBtnText, { color: colors.accent }]}>
                New Chat
              </Text>
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {conversations.length === 0 && (
              <Text style={[styles.empty, { color: colors.textSecondary }]}>
                No past conversations yet.
              </Text>
            )}
            {[...conversations].reverse().map((c) => (
              <Pressable
                key={c.id}
                onPress={() => {
                  onSelect(c.id);
                  onClose();
                }}
                style={[
                  styles.row,
                  { borderColor: colors.border },
                  c.id === activeId && { backgroundColor: colors.accent + "10" },
                ]}
              >
                <View style={styles.rowInfo}>
                  <Text
                    style={[styles.rowTitle, { color: colors.textPrimary }]}
                    numberOfLines={1}
                  >
                    {c.title}
                  </Text>
                  <Text style={[styles.rowDate, { color: colors.textSecondary }]}>
                    {new Date(c.updatedAt).toLocaleDateString()} ·{" "}
                    {c.messages.length} messages
                  </Text>
                </View>
                <Pressable
                  onPress={(e) => {
                    e.stopPropagation();
                    onDelete(c.id);
                  }}
                  style={styles.deleteBtn}
                >
                  <Feather name="trash-2" size={15} color={colors.textSecondary} />
                </Pressable>
              </Pressable>
            ))}
            <View style={{ height: 24 }} />
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: "70%",
    gap: 16,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(128,128,128,0.3)",
    alignSelf: "center",
    marginBottom: 4,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  title: { fontSize: 18, fontWeight: "700" },
  newBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
  },
  newBtnText: { fontSize: 13, fontWeight: "600" },
  empty: { textAlign: "center", paddingVertical: 20, fontSize: 14 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 12,
  },
  rowInfo: { flex: 1 },
  rowTitle: { fontSize: 14, fontWeight: "600", marginBottom: 2 },
  rowDate: { fontSize: 11 },
  deleteBtn: { padding: 8 },
});
