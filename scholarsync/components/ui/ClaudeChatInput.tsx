import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  Platform,
  StyleSheet,
  ActivityIndicator,
  Keyboard,
  Modal,
} from "react-native";
import { Image } from "expo-image";
import * as Haptics from "expo-haptics";
import {
  Plus,
  ChevronDown,
  ArrowUp,
  X,
  FileText,
  Loader2,
  Check,
  Archive,
  Zap,
} from "lucide-react-native";
import { useTheme } from "../../context/ThemeContext";
import { useSettings } from "../../context/SettingsContext";

/* --- UTILS --- */
const formatFileSize = (bytes: number) => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

interface AttachedFile {
  id: string;
  file: any;
  name: string;
  type: string;
  preview: string | null;
  uploadStatus: "pending" | "uploading" | "complete";
  content?: string;
}

/* --- COMPONENTS --- */

// 1. File Preview Card
const FilePreviewCard = ({
  file,
  onRemove,
  colors,
}: {
  file: AttachedFile;
  onRemove: (id: string) => void;
  colors: any;
}) => {
  const isImage = file.type.startsWith("image/");

  return (
    <View
      style={[
        styles.fileCard,
        { backgroundColor: colors.bgSecondary, borderColor: colors.border },
      ]}
    >
      {isImage && file.preview ? (
        <View style={StyleSheet.absoluteFill}>
          <Image
            source={{ uri: file.preview }}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
          />
          <View style={{ ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.1)" }} />
        </View>
      ) : (
        <View style={styles.fileIconContainer}>
          <View style={[styles.fileIconBox, { backgroundColor: colors.bgCard }]}>
            <FileText size={16} color={colors.textSecondary} />
          </View>
          <View style={{ flex: 1, marginLeft: 8 }}>
            <Text
              numberOfLines={1}
              style={[styles.fileName, { color: colors.textPrimary }]}
            >
              {file.name}
            </Text>
            <Text style={[styles.fileSize, { color: colors.textSecondary }]}>
              {formatFileSize(file.file?.size || 0)}
            </Text>
          </View>
        </View>
      )}

      <Pressable
        onPress={() => onRemove(file.id)}
        style={styles.removeFileBtn}
      >
        <X size={12} color="#FFF" />
      </Pressable>

      {file.uploadStatus === "uploading" && (
        <View style={styles.uploadOverlay}>
          <ActivityIndicator size="small" color="#FFF" />
        </View>
      )}
    </View>
  );
};

// 2. Pasted Content Card
const PastedContentCard = ({
  content,
  onRemove,
  colors,
}: {
  content: { id: string; content: string };
  onRemove: (id: string) => void;
  colors: any;
}) => {
  return (
    <View
      style={[
        styles.pasteCard,
        { backgroundColor: colors.bgCard, borderColor: colors.border },
      ]}
    >
      <Text
        numberOfLines={3}
        style={[styles.pasteText, { color: colors.textSecondary }]}
      >
        {content.content}
      </Text>
      <View style={styles.pasteBadge}>
        <Text style={styles.pasteBadgeText}>PASTED</Text>
      </View>
      <Pressable
        onPress={() => onRemove(content.id)}
        style={styles.removePasteBtn}
      >
        <X size={10} color={colors.textSecondary} />
      </Pressable>
    </View>
  );
};

// 3. Model Selector
const ModelSelector = ({
  models,
  selectedModel,
  onSelect,
  colors,
}: {
  models: any[];
  selectedModel: string;
  onSelect: (id: string) => void;
  colors: any;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const currentModel = models.find((m) => m.id === selectedModel) || models[0];

  return (
    <View>
      <Pressable
        onPress={() => setIsOpen(!isOpen)}
        style={[
          styles.modelSelectorBtn,
          { backgroundColor: isOpen ? colors.bgSecondary : "transparent" },
        ]}
      >
        <Text style={[styles.modelName, { color: colors.textPrimary }]}>
          {currentModel.name}
        </Text>
        <ChevronDown
          size={14}
          color={colors.textSecondary}
          style={{ transform: [{ rotate: isOpen ? "180deg" : "0deg" }] }}
        />
      </Pressable>

      <Modal
        visible={isOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsOpen(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setIsOpen(false)}
        >
          <View style={[styles.dropdown, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
            {models.map((m) => (
              <Pressable
                key={m.id}
                onPress={() => {
                  onSelect(m.id);
                  setIsOpen(false);
                }}
                style={[
                  styles.dropdownItem,
                  selectedModel === m.id && { backgroundColor: colors.bgSecondary },
                ]}
              >
                <View style={{ flex: 1 }}>
                  <Text style={[styles.mName, { color: colors.textPrimary }]}>{m.name}</Text>
                  <Text style={[styles.mDesc, { color: colors.textSecondary }]}>{m.description}</Text>
                </View>
                {selectedModel === m.id && (
                  <Check size={16} color={colors.accent} />
                )}
              </Pressable>
            ))}
          </View>
        </Pressable>
      </Modal>
    </View>
  );
};

/* --- MAIN COMPONENT --- */
interface ClaudeChatInputProps {
  onSendMessage: (data: {
    message: string;
    files: AttachedFile[];
    model: string;
    isThinkingEnabled: boolean;
    isAutopilot?: boolean;
  }) => void;

  onAttachPress?: () => void;
  isSending?: boolean;
}

export const ClaudeChatInput: React.FC<ClaudeChatInputProps> = ({
  onSendMessage,
  onAttachPress,
  isSending = false,
}) => {
  const { colors } = useTheme();
  const { settings } = useSettings();
  const [message, setMessage] = useState("");
  const [files, setFiles] = useState<AttachedFile[]>([]);
  const [pastedContent, setPastedContent] = useState<any[]>([]);
  const [selectedModel, setSelectedModel] = useState("sonnet-4.5");
  const [isThinkingEnabled, setIsThinkingEnabled] = useState(false);

  const models = [
    { id: "opus-4.5", name: "Opus 4.5", description: "Most capable for complex work" },
    { id: "sonnet-4.5", name: "Sonnet 4.5", description: "Best for everyday tasks" },
    { id: "haiku-4.5", name: "Haiku 4.5", description: "Fastest for quick answers" },
  ];

  const [isAutopilot, setIsAutopilot] = useState(false);


  const handleSend = () => {
    if ((!message.trim() && files.length === 0) || isSending) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onSendMessage({
      message: message.trim(),
      files,
      model: selectedModel,
      isThinkingEnabled,
      isAutopilot,
    });
    setMessage("");
    setFiles([]);
    setPastedContent([]);
    // Don't reset autopilot, user might want to scan multiple things

  };

  const hasContent = message.trim() || files.length > 0;

  return (
    <View style={styles.wrapper}>
      <View
        style={[
          styles.container,
          {
            backgroundColor: colors.bgPrimary,
            borderColor: colors.border,
            shadowColor: "#000",
          },
        ]}
      >
        {/* Artifacts Area (Files) */}
        {(files.length > 0 || pastedContent.length > 0) && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.artifactsScroll}
          >
            {pastedContent.map((pc) => (
              <PastedContentCard
                key={pc.id}
                content={pc}
                colors={colors}
                onRemove={(id) => setPastedContent((prev) => prev.filter((it) => it.id !== id))}
              />
            ))}
            {files.map((f) => (
              <FilePreviewCard
                key={f.id}
                file={f}
                colors={colors}
                onRemove={(id) => setFiles((prev) => prev.filter((it) => it.id !== id))}
              />
            ))}
          </ScrollView>
        )}

        <View style={styles.inputRow}>
          <TextInput
            style={[styles.input, { color: colors.textPrimary, maxHeight: 200 }]}
            placeholder="How can I help you today?"
            placeholderTextColor={colors.textSecondary}
            multiline
            value={message}
            onChangeText={setMessage}
            textAlignVertical="top"
          />
        </View>

        <View style={styles.actionBar}>
          <View style={styles.leftActions}>
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                onAttachPress?.();
              }}
              style={styles.actionBtn}
            >
              <Plus size={22} color={colors.textSecondary} />
            </Pressable>

            <Pressable
              onPress={() => {
                setIsThinkingEnabled(!isThinkingEnabled);
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }}
              style={[
                styles.actionBtn,
                isThinkingEnabled && { backgroundColor: colors.accent + "20" },
              ]}
            >
              <Zap
                size={18}
                color={isThinkingEnabled ? colors.accent : colors.textSecondary}
              />
            </Pressable>

            <Pressable
              onPress={() => {
                setIsAutopilot(!isAutopilot);
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              }}
              style={[
                styles.actionBtn,
                isAutopilot && { backgroundColor: "#8B5CF620" },
              ]}
            >
              <Text 
                style={{ 
                  color: isAutopilot ? "#8B5CF6" : colors.textSecondary,
                  fontSize: 16,
                  fontWeight: "bold"
                }}
              >
                ✨
              </Text>
            </Pressable>
          </View>


          <View style={styles.rightActions}>
            <ModelSelector
              models={models}
              selectedModel={selectedModel}
              onSelect={setSelectedModel}
              colors={colors}
            />

            <Pressable
              onPress={handleSend}
              disabled={!hasContent || isSending}
              style={[
                styles.sendBtn,
                { backgroundColor: hasContent ? colors.accent : colors.accent + "40" },
              ]}
            >
              {isSending ? (
                <ActivityIndicator size="small" color="#FFF" />
              ) : (
                <ArrowUp size={20} color="#FFF" />
              )}
            </Pressable>
          </View>
        </View>
      </View>
      <Text style={[styles.disclaimer, { color: colors.textSecondary }]}>
        AI can make mistakes. Please check important info.
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  container: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 8,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  artifactsScroll: {
    paddingVertical: 8,
    gap: 10,
  },
  inputRow: {
    minHeight: 45,
    paddingHorizontal: 8,
  },
  input: {
    fontSize: 16,
    paddingTop: 8,
    paddingBottom: 8,
    lineHeight: 22,
  },
  actionBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 4,
    paddingHorizontal: 4,
  },
  leftActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  rightActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  actionBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  sendBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  modelSelectorBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  modelName: {
    fontSize: 13,
    fontWeight: "600",
  },
  disclaimer: {
    textAlign: "center",
    fontSize: 11,
    marginTop: 8,
    opacity: 0.6,
  },
  // File Card
  fileCard: {
    width: 120,
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    overflow: "hidden",
    position: "relative",
  },
  fileIconContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    flex: 1,
  },
  fileIconBox: {
    width: 28,
    height: 28,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  fileName: {
    fontSize: 11,
    fontWeight: "600",
  },
  fileSize: {
    fontSize: 9,
  },
  removeFileBtn: {
    position: "absolute",
    top: 4,
    right: 4,
    backgroundColor: "rgba(0,0,0,0.5)",
    borderRadius: 8,
    padding: 2,
  },
  uploadOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.3)",
    alignItems: "center",
    justifyContent: "center",
  },
  // Paste Card
  pasteCard: {
    width: 110,
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    padding: 6,
    position: "relative",
  },
  pasteText: {
    fontSize: 9,
    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
  },
  pasteBadge: {
    position: "absolute",
    bottom: 4,
    left: 4,
    backgroundColor: "rgba(0,0,0,0.05)",
    paddingHorizontal: 4,
    borderRadius: 4,
  },
  pasteBadgeText: {
    fontSize: 8,
    fontWeight: "800",
    color: "#666",
  },
  removePasteBtn: {
    position: "absolute",
    top: 4,
    right: 4,
    padding: 4,
  },
  // Modal / Dropdown
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  dropdown: {
    width: 260,
    borderRadius: 18,
    borderWidth: 1,
    padding: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 10,
  },
  dropdownItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 12,
  },
  mName: {
    fontSize: 14,
    fontWeight: "600",
  },
  mDesc: {
    fontSize: 11,
    marginTop: 2,
  },
});
