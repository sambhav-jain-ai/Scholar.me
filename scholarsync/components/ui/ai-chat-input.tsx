"use client";

import React, { useState, useEffect, useRef } from "react";
import { View, TextInput, Pressable, Text, Keyboard, StyleSheet } from "react-native";
import { Lightbulb, Mic, Globe, Paperclip, Send } from "lucide-react-native";
import { MotiView, AnimatePresence } from "moti";
import { useTheme } from "../../context/ThemeContext";

const PLACEHOLDERS = [
  "Add a new subject like Physics",
  "Remind me to submit my assignment",
  "Mark me present for Math class",
  "Schedule an exam for next Tuesday",
  "What's my attendance in Biology?",
  "Summarize my notes on Calculus",
];

interface AIChatInputProps {
  onSendMessage?: (data: {
    message: string;
    files: any[];
    model: string;
    isThinkingEnabled: boolean;
    isAutopilot?: boolean;
  }) => void;
  onAttachPress?: () => void;
  isSending?: boolean;
}

export const AIChatInput = ({ onSendMessage, onAttachPress, isSending }: AIChatInputProps) => {
  const { colors } = useTheme();
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [showPlaceholder, setShowPlaceholder] = useState(true);
  const [isActive, setIsActive] = useState(false);
  const [thinkActive, setThinkActive] = useState(false);
  const [deepSearchActive, setDeepSearchActive] = useState(false); // Map to isAutopilot
  const [inputValue, setInputValue] = useState("");
  const inputRef = useRef<TextInput>(null);

  // Cycle placeholder text when input is inactive
  useEffect(() => {
    if (isActive || inputValue) return;

    const interval = setInterval(() => {
      setShowPlaceholder(false);
      setTimeout(() => {
        setPlaceholderIndex((prev) => (prev + 1) % PLACEHOLDERS.length);
        setShowPlaceholder(true);
      }, 400);
    }, 4500);

    return () => clearInterval(interval);
  }, [isActive, inputValue]);

  const handleSend = () => {
    if (!inputValue.trim() || isSending) return;
    onSendMessage?.({
      message: inputValue.trim(),
      files: [], 
      model: "gemini-1.5-flash",
      isThinkingEnabled: thinkActive,
      isAutopilot: deepSearchActive,
    });

    setInputValue("");
    setIsActive(false);
    Keyboard.dismiss();
  };

  return (
    <View style={styles.root}>
      <MotiView
        animate={{
          height: isActive || inputValue ? 128 : 68,
          backgroundColor: colors.bgCard,
        }}
        transition={{ type: "spring", damping: 18, stiffness: 120 }}
        style={[styles.container, { borderColor: colors.border }]}
      >
        <View style={styles.content}>
          {/* Input Row */}
          <View style={styles.inputRow}>
            <Pressable
              style={styles.iconBtn}
              onPress={onAttachPress}
            >
              <Paperclip size={20} color={colors.textSecondary} />
            </Pressable>

            {/* Text Input & Placeholder Container */}
            <View style={styles.inputWrapper}>
              <TextInput
                ref={inputRef}
                value={inputValue}
                onChangeText={setInputValue}
                onFocus={() => setIsActive(true)}
                onBlur={() => !inputValue && setIsActive(false)}
                placeholder=""
                style={[styles.input, { color: colors.textPrimary }]}
                multiline={isActive || inputValue.length > 30}
              />
              
              <AnimatePresence>
                {showPlaceholder && !isActive && !inputValue && (
                  <View style={styles.placeholderContainer} pointerEvents="none">
                    <MotiView
                      from={{ opacity: 0, translateY: 10 }}
                      animate={{ opacity: 1, translateY: 0 }}
                      exit={{ opacity: 0, translateY: -10 }}
                      transition={{ type: "spring", damping: 20, stiffness: 80 }}
                      style={{ flexDirection: "row" }}
                    >
                      {PLACEHOLDERS[placeholderIndex].split("").map((char, i) => (
                        <MotiView
                          key={i}
                          from={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: i * 20 }}
                        >
                          <Text style={{ color: colors.textSecondary, fontSize: 16 }}>
                            {char === " " ? "\u00A0" : char}
                          </Text>
                        </MotiView>
                      ))}
                    </MotiView>
                  </View>
                )}
              </AnimatePresence>
            </View>

            {!isActive && !inputValue && (
              <Pressable
                style={styles.iconBtn}
                onPress={() => {}}
              >
                <Mic size={20} color={colors.textSecondary} />
              </Pressable>
            )}

            <Pressable
              onPress={handleSend}
              style={[
                styles.sendBtn,
                { backgroundColor: colors.accent },
                isSending && { opacity: 0.5 }
              ]}
            >
              <Send size={18} color="#ffffff" />
            </Pressable>
          </View>

          {/* Expanded Controls */}
          <AnimatePresence>
            {(isActive || inputValue !== "") && (
              <MotiView
                from={{ opacity: 0, translateY: 10 }}
                animate={{ opacity: 1, translateY: 0 }}
                exit={{ opacity: 0, translateY: 10 }}
                transition={{ duration: 350 }}
                style={styles.expandedControls}
              >
                <View style={styles.togglesRow}>
                  {/* Think Toggle */}
                  <Pressable
                    onPress={() => setThinkActive(!thinkActive)}
                    style={[
                      styles.togglePill,
                      { backgroundColor: colors.bgSecondary },
                      thinkActive && { 
                        backgroundColor: colors.accent + "15", 
                        borderColor: colors.accent + "40" 
                      }
                    ]}
                  >
                    <Lightbulb
                      size={18}
                      color={thinkActive ? colors.accent : colors.textSecondary}
                      fill={thinkActive ? "#fde047" : "transparent"}
                    />
                    <Text
                      style={[
                        styles.toggleText,
                        { color: thinkActive ? colors.accent : colors.textSecondary }
                      ]}
                    >
                      Think
                    </Text>
                  </Pressable>

                  {/* Deep Search Toggle */}
                  <MotiView
                    animate={{
                      width: deepSearchActive ? 130 : 40,
                    }}
                    transition={{ type: "spring", damping: 20, stiffness: 100 }}
                  >
                    <Pressable
                      onPress={() => setDeepSearchActive(!deepSearchActive)}
                      style={[
                        styles.togglePill,
                        { backgroundColor: colors.bgSecondary, paddingHorizontal: 10 },
                        deepSearchActive && { 
                          backgroundColor: colors.accent + "15", 
                          borderColor: colors.accent + "40" 
                        }
                      ]}
                    >
                      <Globe
                        size={18}
                        color={deepSearchActive ? colors.accent : colors.textSecondary}
                      />
                      {deepSearchActive && (
                        <Text 
                          style={[
                            styles.toggleText, 
                            { color: colors.accent, marginLeft: 8 }
                          ]}
                          numberOfLines={1}
                        >
                          Deep Search
                        </Text>
                      )}
                    </Pressable>
                  </MotiView>
                </View>
              </MotiView>
            )}
          </AnimatePresence>
        </View>
      </MotiView>
    </View>
  );
};

const styles = StyleSheet.create({
  root: { width: "100%", paddingHorizontal: 16, paddingBottom: 24 },
  container: {
    width: "100%",
    borderRadius: 32,
    overflow: "hidden",
    borderWidth: 1,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  content: { flexDirection: "column", height: "100%" }, // Moti animate height handles actual height
  inputRow: {
    flexDirection: "row",
    padding: 8,
    paddingTop: 12,
    height: 60,
    alignItems: "center",
  },
  iconBtn: {
    padding: 12,
    borderRadius: 999,
  },
  inputWrapper: {
    flex: 1,
    paddingHorizontal: 8,
    position: "relative",
    height: "100%",
    justifyContent: "center",
  },
  input: {
    fontSize: 16,
    height: "100%",
    marginTop: 4,
    textAlignVertical: "top",
  },
  placeholderContainer: {
    position: "absolute",
    left: 8,
    top: 0,
    bottom: 0,
    justifyContent: "center",
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 4,
  },
  expandedControls: {
    flexDirection: "row",
    paddingHorizontal: 16,
    alignItems: "center",
    marginTop: 4,
  },
  togglesRow: {
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
  },
  togglePill: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "transparent",
  },
  toggleText: {
    fontSize: 14,
    fontWeight: "600",
  },
});

