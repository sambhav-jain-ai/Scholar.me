import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import { fetch } from "expo/fetch";
import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAcademic } from "../context/AcademicContext";
import { useProfile } from "../context/ProfileContext";
import { useSettings } from "../context/SettingsContext";
import { useTheme } from "../context/ThemeContext";
import { generateId, SUBJECT_COLORS } from "../utils/ids";
import { ActionCard } from "../components/chat/ActionCard";
import { MessageBubble } from "../components/chat/MessageBubble";
import { HistorySheet } from "../components/chat/HistorySheet";
import { Skeleton } from "../components/ui/Skeleton";
import { useSpeechRecognition } from "../hooks/useSpeechRecognition";
import { useDocumentReader } from "../hooks/useDocumentReader";
import type { Message, Conversation, Attachment, ParsedAction } from "../types/chat";
import { AIChatInput } from "../components/ui/ai-chat-input";

// ── Constants ────────────────────────────────────────────────────────────────
const CONVS_KEY = "ss_conversations";
const DRAFT_KEY = "scholarsync_chat_draft";
const WEB_PADDING_TOP = 67;

/** API base URL — empty string means same-origin (served by api-server locally) */
/** API base URL — fallbacks to localhost:3001 (api-server) if env not set */
const BASE_URL = process.env.EXPO_PUBLIC_API_URL || (Platform.OS === 'android' ? 'http://10.0.2.2:3001' : 'http://localhost:3001');


// ── API helper ───────────────────────────────────────────────────────────────
async function callClaude(
  messages: { role: string; content: string }[],
): Promise<{ content: string; action: ParsedAction | null }> {
  const res = await fetch(`${BASE_URL}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as any).error ?? `API ${res.status}`);
  }
  const data = await res.json();
  return {
    content: data.content || "Sorry, I couldn't process that.",
    action: data.action ?? null,
  };
}

// ── Storage helpers ──────────────────────────────────────────────────────────
async function loadConversations(): Promise<Conversation[]> {
  const raw = await AsyncStorage.getItem(CONVS_KEY);
  return raw ? (JSON.parse(raw) as Conversation[]) : [];
}

async function saveConversations(convs: Conversation[]): Promise<void> {
  await AsyncStorage.setItem(CONVS_KEY, JSON.stringify(convs));
}

// ── Main component ───────────────────────────────────────────────────────────
export default function ChatScreen() {
  const { colors } = useTheme();
  const { profile } = useProfile();
  const { settings } = useSettings();
  const {
    subjects,
    addTimetableEntry,
    addTodo,
    addAttendance,
    addExam,
    addNote,
  } = useAcademic();
  const insets = useSafeAreaInsets();
  const liquidGlass = settings.liquidGlass ?? false;

  // ── Conversation helpers ──
  const makeWelcome = useCallback((): Message => ({
    id: generateId(),
    role: "assistant",
    content: `Hi ${profile.name || "there"}! I'm your AI study assistant. Ask me to add a class, task, mark attendance, log an exam, summarize notes, or start a Pomodoro — I'll handle it.`,
    timestamp: new Date().toISOString(),
  }), [profile.name]);

  const makeConversation = useCallback((msgs?: Message[]): Conversation => ({
    id: generateId(),
    title: "New conversation",
    messages: msgs ?? [makeWelcome()],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }), [makeWelcome]);

  // ── State ──
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConvId, setActiveConvId] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [input, setInput] = useState("");
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [historyVisible, setHistoryVisible] = useState(false);
  const flatRef = useRef<FlatList>(null);
  const inputRef = useRef<TextInput>(null);
  const draftTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const activeConv = conversations.find((c) => c.id === activeConvId);
  const messages = activeConv?.messages ?? [];

  const [isHistLoading, setIsHistLoading] = useState(true);

  // ── Load data on mount ──
  useEffect(() => {
    (async () => {
      let convs = await loadConversations();
      const draft = await AsyncStorage.getItem(DRAFT_KEY);
      if (draft) setInput(draft);

      let needsNewChat = false;
      if (convs.length === 0) {
        needsNewChat = true;
      } else {
        const lastConv = convs[convs.length - 1];
        if (lastConv.messages.length > 1) {
          needsNewChat = true;
        }
      }

      if (needsNewChat) {
        const first = makeConversation();
        convs = [...convs, first];
        await saveConversations(convs);
      }
      
      setConversations(convs);
      setActiveConvId(convs[convs.length - 1].id);
      setIsHistLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Persist draft ──
  useEffect(() => {
    if (draftTimer.current) clearTimeout(draftTimer.current);
    draftTimer.current = setTimeout(
      () => AsyncStorage.setItem(DRAFT_KEY, input),
      400,
    );
    return () => { if (draftTimer.current) clearTimeout(draftTimer.current); };
  }, [input]);


  // ── Conversation update helpers ──
  const updateConversations = useCallback(async (updated: Conversation[]) => {
    setConversations(updated);
    await saveConversations(updated);
  }, []);

  const updateMessages = useCallback(
    async (msgs: Message[]) => {
      setConversations((prev) => {
        const updated = prev.map((c) =>
          c.id === activeConvId
            ? {
                ...c,
                messages: msgs,
                updatedAt: new Date().toISOString(),
                title:
                  msgs.find((m) => m.role === "user")?.content?.slice(0, 42) ??
                  c.title,
              }
            : c,
        );
        saveConversations(updated);
        return updated;
      });
    },
    [activeConvId],
  );

  // ── Speech recognition ──
  const handleMicResult = useCallback((text: string) => setInput(text), []);
  const { isListening, start: startMic, stop: stopMic } =
    useSpeechRecognition(handleMicResult);

  // ── Document picker ──
  const { pickDocument } = useDocumentReader();

  const handlePickDocument = async () => {
    const attachment = await pickDocument();
    if (attachment) {
      setAttachments((p) => [...p, attachment]);
    }
  };

  const handlePickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission required", "Please allow photo access.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({ quality: 0.85 });
    if (!result.canceled && result.assets?.[0]) {
      const name = result.assets[0].fileName || `image_${Date.now()}.jpg`;
      setAttachments((p) => [
        ...p,
        {
          id: generateId(),
          name,
          type: "image",
          // Images are preview-only — no binary content sent to the AI
        },
      ]);
    }
  };

  const showAttachMenu = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Alert.alert("Attach File", "Choose type", [
      { text: "Document (PDF / Word / Text)", onPress: handlePickDocument },
      { text: "Image (preview only)", onPress: handlePickImage },
      { text: "Cancel", style: "cancel" },
    ]);
  };

  // ── Action confirm/decline ──
  const handleConfirmAction = useCallback(
    async (msgId: string) => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      const msg = messages.find((m) => m.id === msgId);
      if (!msg?.action) return;

      const { type, data } = msg.action;

      switch (type) {
        case "timetable": {
          const color =
            SUBJECT_COLORS[Math.floor(Math.random() * SUBJECT_COLORS.length)];
          addTimetableEntry({
            id: generateId(),
            subjectId: generateId(),
            subjectName: (data.subjectName as string) || "Unknown Subject",
            color,
            teacher: (data.teacher as string) || "",
            room: (data.room as string) || "",
            day: (data.day as string) || "Monday",
            startTime: (data.startTime as string) || "09:00",
            endTime: (data.endTime as string) || "10:00",
            recurring:
              (data.recurring as "weekly" | "daily" | "biweekly" | "one-time") ||
              "weekly",
          });
          break;
        }
        case "todo": {
          addTodo({
            id: generateId(),
            title: (data.title as string) || "New Task",
            priority:
              (data.priority as "high" | "medium" | "low") || "medium",
            dueDate: data.dueDate as string | undefined,
            completed: false,
            subtasks: [],
            recurring: "one-time",
            createdAt: new Date().toISOString(),
          });
          break;
        }
        case "attendance": {
          // Find matching subject by name (case-insensitive)
          const subjectName = (data.subjectName as string) || "";
          const subject = subjects.find(
            (s) =>
              s.name.toLowerCase() === subjectName.toLowerCase(),
          );
          if (subject) {
            addAttendance({
              id: generateId(),
              subjectId: subject.id,
              date: (data.date as string) || new Date().toISOString().split("T")[0],
              status: (data.status as any) || "present",
            });
          } else {
            Alert.alert(
              "Subject not found",
              `No subject named "${subjectName}" exists. Add it in Timetable first.`,
            );
          }
          break;
        }
        case "exam": {
          const examSubject = subjects.find(
            (s) =>
              s.name.toLowerCase() ===
              ((data.subjectName as string) || "").toLowerCase(),
          );
          addExam({
            id: generateId(),
            subjectId: examSubject?.id ?? generateId(),
            subjectName: (data.subjectName as string) || "Unknown Subject",
            date: (data.date as string) || "",
            time: data.time as string | undefined,
            venue: data.venue as string | undefined,
            duration: data.duration as string | undefined,
          });
          break;
        }
        case "note": {
          const noteSubject = subjects.find(
            (s) =>
              s.name.toLowerCase() ===
              ((data.subjectName as string) || "").toLowerCase(),
          );
          addNote({
            id: generateId(),
            subjectId: noteSubject?.id,
            title: (data.title as string) || "AI Note",
            content: (data.content as string) || "",
            tags: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          });
          break;
        }
        case "pomodoro": {
          // Pomodoro is handled by navigating to the screen; no data to persist
          Alert.alert(
            "Pomodoro",
            `Opening a ${data.duration ?? 25}-min focus session on the Pomodoro screen.`,
          );
          break;
        }
        default:
          break;
      }

      const updated = messages.map((m) =>
        m.id === msgId ? { ...m, actionState: "confirmed" as const } : m,
      );
      await updateMessages(updated);
    },
    [messages, subjects, addTimetableEntry, addTodo, addAttendance, addExam, addNote, updateMessages],
  );

  const handleDeclineAction = useCallback(
    async (msgId: string) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const updated = messages.map((m) =>
        m.id === msgId ? { ...m, actionState: "declined" as const } : m,
      );
      await updateMessages(updated);
    },
    [messages, updateMessages],
  );

  // ── Send ──
  const send = useCallback(async () => {
    const text = input.trim();
    if (!text || isLoading) return;
    if (isListening) stopMic();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    // Build attachment context string
    const attachParts = attachments.map((a) => {
      if (a.type === "image") return `[Attached image: ${a.name} (preview only)]`;
      if (a.textContent) return `[Attached document: ${a.name}]\n${a.textContent}`;
      return `[Attached document: ${a.name} — binary format, content not extracted]`;
    });
    const fullText =
      attachParts.length > 0
        ? `${text}\n\n${attachParts.join("\n\n")}`
        : text;

    setInput("");
    await AsyncStorage.removeItem(DRAFT_KEY);
    setAttachments([]);

    const userMsg: Message = {
      id: generateId(),
      role: "user",
      content: fullText,
      timestamp: new Date().toISOString(),
      attachmentName: attachments[0]?.name,
    };

    const newMessages: Message[] = [userMsg, ...messages];
    await updateMessages(newMessages);
    setIsLoading(true);

    try {
      const context = `Student: ${profile.name || "Unknown"}, Type: ${profile.studentType}, Threshold: ${profile.attendanceThreshold}%, Subjects: ${subjects.map((s) => s.name).join(", ")}.`;
      const history = [...newMessages]
        .reverse()
        .slice(-8)
        .map((m) => ({ role: m.role as "user" | "assistant", content: m.content }));

      const { content: aiText, action } = await callClaude([
        { role: "user", content: `Context: ${context}` },
        ...history,
      ]);

      const aiMsg: Message = {
        id: generateId(),
        role: "assistant",
        content: aiText,
        timestamp: new Date().toISOString(),
        action: action ?? undefined,
        actionState: action ? "pending" : undefined,
      };
      await updateMessages([aiMsg, ...newMessages]);
    } catch (err) {
      const errMessage =
        err instanceof Error ? err.message : "An unknown error occurred.";
      // Restore the draft so the user can retry
      setInput(text);
      AsyncStorage.setItem(DRAFT_KEY, text);
      await updateMessages([
        {
          id: generateId(),
          role: "assistant",
          content: `I couldn't connect right now (${errMessage}). Your message is saved as a draft — tap Send when you're back online.`,
          timestamp: new Date().toISOString(),
        },
        ...newMessages,
      ]);
    } finally {
      setIsLoading(false);
    }
  }, [
    input,
    isLoading,
    isListening,
    attachments,
    messages,
    profile,
    subjects,
    stopMic,
    updateMessages,
  ]);

  const handleNewSend = async (msg: string, fList: any[], isAutopilot: boolean = false) => {
    // Port logic from send() but using params
    const text = msg.trim();
    if (!text && fList.length === 0) return;
    setIsLoading(true);

    const attachParts = fList.map((a: any) => {
      if (a.type?.startsWith("image/")) return `[Attached image: ${a.name} (preview only)]`;
      return `[Attached file: ${a.name}]`;
    });

    const fullText = attachParts.length > 0 ? `${text}\n\n${attachParts.join("\n")}` : text;

    const userMsg: Message = {
      id: generateId(),
      role: "user",
      content: fullText,
      timestamp: new Date().toISOString(),
    };

    const newMessages: Message[] = [userMsg, ...messages];
    await updateMessages(newMessages);

    try {
      const autopilotContext = isAutopilot 
        ? "AUTOPILOT MODE ACTIVE: I am providing a syllabus/schedule. Please extract ALL Possible classes (subject name, day, startTime, endTime), exams, and tasks. Return as many ACTIONS as needed. For each, use the ACTION:type:{...} format."
        : "";
      const context = `Student: ${profile.name}, Subjects: ${subjects.map(s => s.name).join(", ")}. ${autopilotContext}`;
      const { content: aiText, action } = await callClaude([
        { role: "user", content: `Context: ${context}` },
        ...newMessages.slice(0, 8).reverse().map(m => ({ role: m.role as any, content: m.content }))
      ]);

      const aiMsg: Message = {
        id: generateId(),
        role: "assistant",
        content: aiText,
        timestamp: new Date().toISOString(),
        action: action ?? undefined,
        actionState: action ? "pending" : undefined,
      };
      await updateMessages([aiMsg, ...newMessages]);
    } catch (err) {
      Alert.alert("Error", "Could not connect to AI.");
    } finally {
      setIsLoading(false);
    }
  };

  // ── History controls ──
  const startNewChat = useCallback(async () => {
    const newConv = makeConversation();
    const updated = [...conversations, newConv];
    await updateConversations(updated);
    setActiveConvId(newConv.id);
    setHistoryVisible(false);
  }, [conversations, updateConversations]);

  const selectConversation = useCallback((id: string) => {
    setActiveConvId(id);
  }, []);

  const deleteConversation = useCallback(
    async (id: string) => {
      const updated = conversations.filter((c) => c.id !== id);
      await updateConversations(
        updated.length ? updated : [makeConversation()],
      );
      if (activeConvId === id)
        setActiveConvId(updated[updated.length - 1]?.id ?? "");
    },
    [conversations, activeConvId, updateConversations],
  );

  // ── Derive theme-aware colors ──
  const topPad = Platform.OS === "web" ? WEB_PADDING_TOP : insets.top;
  const gl = liquidGlass;
  const textCol = gl ? "#fff" : colors.textPrimary;
  const subCol = gl ? "rgba(255,255,255,0.42)" : colors.textSecondary;
  const cardBg = gl ? "rgba(255,255,255,0.06)" : colors.bgSecondary;
  const cardBorder = gl ? "rgba(255,255,255,0.12)" : colors.border;

  return (
    <KeyboardAvoidingView
      style={[styles.root, { backgroundColor: gl ? "#080810" : colors.bgPrimary }]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      {/* ── Header ── */}
      <View
        style={[
          styles.header,
          {
            paddingTop: topPad + 10,
            backgroundColor: gl
              ? "rgba(10,10,20,0.92)"
              : colors.bgPrimary,
          },
        ]}
      >
        <View style={styles.headerLeft}>
          <LinearGradient
            colors={["#6366F1", "#7C3AED"]}
            style={styles.aiDot}
          >
            <Feather name="zap" size={16} color="#FFF" />
          </LinearGradient>
          <View>
            <Text style={[styles.headerTitle, { color: textCol }]}>
              AI Assistant
            </Text>
            <Text style={[styles.headerSub, { color: subCol }]}>
              Claude · ScholarSync
            </Text>
          </View>
        </View>
        <View style={styles.headerRight}>
          <View
            style={[
              styles.statusBadge,
              {
                backgroundColor: gl
                  ? "rgba(16,185,129,0.12)"
                  : colors.success + "20",
                borderWidth: gl ? 1 : 0,
                borderColor: "rgba(16,185,129,0.25)",
              },
            ]}
          >
            <View style={[styles.statusDot, { backgroundColor: "#10B981" }]} />
            <Text style={[styles.statusText, { color: "#10B981" }]}>Online</Text>
          </View>
          <Pressable
            onPress={() => setHistoryVisible(true)}
            style={[
              styles.iconCircle,
              { backgroundColor: gl ? "rgba(255,255,255,0.08)" : colors.bgCard },
            ]}
          >
            <Feather name="clock" size={16} color={subCol} />
          </Pressable>
          <Pressable
            onPress={startNewChat}
            style={[
              styles.iconCircle,
              {
                backgroundColor: gl
                  ? "rgba(99,102,241,0.15)"
                  : colors.accent + "15",
              },
            ]}
          >
            <Feather name="plus" size={16} color={colors.accent} />
          </Pressable>
        </View>
      </View>

      {/* ── Messages ── */}
      {isHistLoading ? (
        <View style={{ flex: 1, padding: 20, gap: 12 }}>
          <Skeleton width="60%" height={60} borderRadius={18} />
          <Skeleton width="40%" height={40} borderRadius={18} style={{ alignSelf: "flex-end" }} />
          <Skeleton width="70%" height={80} borderRadius={18} />
          <Skeleton width="50%" height={50} borderRadius={18} style={{ alignSelf: "flex-end" }} />
        </View>
      ) : (
        <FlatList
          ref={flatRef}
          data={messages}
          inverted
          keyExtractor={(m) => m.id}
          renderItem={({ item }) => (
            <MessageBubble
              message={item}
              liquidGlass={gl}
              colors={colors}
              onConfirmAction={handleConfirmAction}
              onDeclineAction={handleDeclineAction}
            />
          )}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            isLoading ? (
              <View style={{ alignSelf: "flex-start", marginBottom: 12, marginLeft: 10 }}>
                 <Skeleton width={160} height={50} borderRadius={18} />
              </View>
            ) : null
          }
        />
      )}

      {/* ── Claude Input Area ── */}
      <View
        style={[
          styles.inputArea,
          {
            backgroundColor: gl ? "rgba(10,10,20,0.93)" : colors.bgPrimary,
          },
        ]}
      >
        <AIChatInput
          isSending={isLoading}
          onSendMessage={async (data) => {
            await handleNewSend(data.message, data.files, !!data.isAutopilot);
          }}
          onAttachPress={showAttachMenu}
        />
      </View>

      {/* ── History sheet ── */}
      <HistorySheet
        visible={historyVisible}
        conversations={conversations}
        activeId={activeConvId}
        onSelect={selectConversation}
        onNew={startNewChat}
        onClose={() => setHistoryVisible(false)}
        onDelete={deleteConversation}
        colors={colors}
      />
    </KeyboardAvoidingView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
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
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  headerRight: { flexDirection: "row", alignItems: "center", gap: 8 },
  aiDot: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: { fontSize: 15, fontWeight: "700" },
  headerSub: { fontSize: 11 },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 10,
  },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 11, fontWeight: "600" },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },

  listContent: { paddingHorizontal: 14, paddingVertical: 12, gap: 10 },

  typingBubble: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 13,
    borderRadius: 18,
    borderBottomLeftRadius: 5,
    alignSelf: "flex-start",
    marginBottom: 8,
  },
  typingText: { fontSize: 14 },

  inputArea: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 10,
    gap: 8,
  },
  attachRow: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  attachPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    maxWidth: 200,
  },
  attachPillText: { fontSize: 11, fontWeight: "500", flex: 1 },
  micBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 12,
    backgroundColor: "#EF444420",
    borderWidth: 1,
    borderColor: "#EF444440",
  },
  micDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#EF4444" },
  micBannerText: { fontSize: 13, color: "#EF4444", fontWeight: "500" },
  inputCard: { borderRadius: 20, borderWidth: 1, overflow: "hidden" },
  textInput: {
    fontSize: 15,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 8,
    maxHeight: 130,
    lineHeight: 22,
  },
  inputBottom: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 10,
    paddingBottom: 10,
    gap: 6,
  },
  inputLeft: { flexDirection: "row", alignItems: "center", gap: 6 },
  iconBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },
  modelBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 999,
    borderWidth: 1,
  },
  modelBadgeText: { fontSize: 11, fontWeight: "600", color: "#6366F1" },
  sendBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  inputHint: { fontSize: 11, textAlign: "center" },
});
