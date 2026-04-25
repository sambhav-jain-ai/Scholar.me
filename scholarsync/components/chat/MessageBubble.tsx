import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import Animated, { SlideInLeft, SlideInRight } from "react-native-reanimated";
import { ActionCard } from "./ActionCard";
import type { Message } from "../../types/chat";

interface MessageBubbleProps {
  message: Message;
  liquidGlass: boolean;
  colors: any;
  onConfirmAction: (msgId: string) => void;
  onDeclineAction: (msgId: string) => void;
}

export const MessageBubble = React.memo(({
  message,
  liquidGlass,
  colors,
  onConfirmAction,
  onDeclineAction,
}: MessageBubbleProps) => {
  const isUser = message.role === "user";

  return (
    <Animated.View
      entering={
        isUser
          ? SlideInRight.springify().damping(16).mass(0.8)
          : SlideInLeft.springify().damping(16).mass(0.8)
      }
      style={[styles.row, { alignSelf: isUser ? "flex-end" : "flex-start" }]}
    >
      {!isUser && (
        <View
          style={[
            styles.aiAvatar,
            {
              backgroundColor: liquidGlass
                ? "rgba(99,102,241,0.2)"
                : colors.accent + "30",
              borderWidth: liquidGlass ? 1 : 0,
              borderColor: "rgba(99,102,241,0.35)",
            },
          ]}
        >
          <Feather name="zap" size={13} color="#6366F1" />
        </View>
      )}

      <View style={styles.content}>
        {isUser ? (
          <LinearGradient
            colors={["#6366F1", "#7C3AED"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.bubble, styles.userBubble]}
          >
            {message.attachmentName && (
              <View style={styles.attachBadge}>
                <Feather name="paperclip" size={10} color="rgba(255,255,255,0.7)" />
                <Text style={styles.attachBadgeText}>{message.attachmentName}</Text>
              </View>
            )}
            <Text style={[styles.bubbleText, { color: "#FFF" }]}>
              {message.content}
            </Text>
          </LinearGradient>
        ) : (
          <View
            style={[
              styles.bubble,
              styles.aiBubble,
              liquidGlass
                ? {
                    backgroundColor: "rgba(255,255,255,0.06)",
                    borderWidth: 1,
                    borderColor: "rgba(255,255,255,0.12)",
                  }
                : { backgroundColor: colors.bgCard },
            ]}
          >
            <Text
              style={[
                styles.bubbleText,
                {
                  color: liquidGlass
                    ? "rgba(255,255,255,0.9)"
                    : colors.textPrimary,
                },
              ]}
            >
              {message.content}
            </Text>
          </View>
        )}

        {/* Action card — only on assistant messages */}
        {!isUser && message.action && (
          <ActionCard
            action={message.action}
            state={message.actionState}
            colors={colors}
            onConfirm={() => onConfirmAction(message.id)}
            onDecline={() => onDeclineAction(message.id)}
          />
        )}
      </View>
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
    maxWidth: "84%",
  },
  content: { flex: 1, gap: 6 },
  aiAvatar: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  bubble: { borderRadius: 18, padding: 13 },
  userBubble: { borderBottomRightRadius: 5 },
  aiBubble: { borderBottomLeftRadius: 5 },
  bubbleText: { fontSize: 15, lineHeight: 22 },
  attachBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 4,
    opacity: 0.75,
  },
  attachBadgeText: { fontSize: 10, color: "#fff", fontStyle: "italic" },
});
