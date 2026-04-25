"use client";

import React, { useState } from "react";
import { View, Text, TextInput, Pressable, Image, Dimensions, ScrollView } from "react-native";
import { Paperclip, Sparkles } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useTheme } from "../../context/ThemeContext";
import { useApp } from "../../context/AppContext";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export const Hero1 = () => {
  const { colors, mode } = useTheme();
  const { setActiveTab } = useApp();
  const [searchValue, setSearchValue] = useState("");

  const handleSearch = () => {
    if (!searchValue.trim()) return;
    setActiveTab("chat");
    setSearchValue("");
  };

  const blurOpacity = mode === "dark" ? 0.4 : 0.2;

  const handleGetStarted = () => {
    setActiveTab("dashboard");
  };

  return (
    <View className="flex-1 w-full relative overflow-hidden" style={{ backgroundColor: colors.bgPrimary }}>
      {/* Dynamic Gradients (Fixed Pattern) */}
      <View style={{ position: "absolute", top: -100, right: -100, opacity: blurOpacity }} pointerEvents="none">
        <View style={{ transform: [{ rotate: "-20deg" }, { skewX: "-40deg" }] }}>
          <View className="flex-row gap-8">
            <LinearGradient colors={[colors.accent, "transparent"]} style={{ width: 100, height: 300, borderRadius: 50 }} />
            <LinearGradient colors={[colors.accentSecondary || colors.accent, "transparent"]} style={{ width: 100, height: 400, borderRadius: 50 }} />
            <LinearGradient colors={[colors.accent, "transparent"]} style={{ width: 100, height: 300, borderRadius: 50 }} />
          </View>
        </View>
      </View>

      <View style={{ position: "absolute", bottom: -150, left: -200, opacity: blurOpacity }} pointerEvents="none">
        <View style={{ transform: [{ rotate: "15deg" }, { skewX: "20deg" }] }}>
          <View className="flex-row gap-12">
            <LinearGradient colors={[colors.accent, "transparent"]} style={{ width: 150, height: 400, borderRadius: 75 }} />
            <LinearGradient colors={[colors.accentSecondary || colors.accent, "transparent"]} style={{ width: 120, height: 500, borderRadius: 60 }} />
          </View>
        </View>
      </View>

      {/* Header Area */}
      <View className="flex-row justify-between items-center p-6 z-10">
        <View className="flex-row items-center gap-2">
          <Image 
            source={{ uri: "https://hextaui.com/logo.svg" }} 
            className="w-8 h-8"
            style={{ tintColor: colors.accent }}
          />
          <Text className="font-bold text-xl" style={{ color: colors.textPrimary }}>ScholarSync</Text>
        </View>
        <Pressable 
          className="rounded-full px-6 py-2.5 active:opacity-80"
          style={{ backgroundColor: colors.textPrimary }}
          onPress={handleGetStarted}
        >
          <Text style={{ color: colors.bgPrimary }} className="font-bold text-sm">Get Started</Text>
        </Pressable>
      </View>

      {/* Main Content */}
      <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: "center", paddingBottom: 100 }}>
        <View className="items-center px-6">
          <View className="mb-8 p-1.5 rounded-full px-4 flex-row items-center gap-2" style={{ backgroundColor: colors.bgCard, borderWidth: 1, borderColor: colors.border }}>
             <View className="bg-black p-1 rounded-full items-center justify-center">
                <Text style={{ fontSize: 12 }}>🥳</Text>
             </View>
             <Text className="text-xs font-medium" style={{ color: colors.textSecondary }}>
               Introducing ScholarSync AI Pro
             </Text>
          </View>

          <Text className="text-4xl font-bold text-center leading-tight mb-4" style={{ color: colors.textPrimary }}>
            Build Your Academic Success Effortlessly
          </Text>

          <Text className="text-base text-center mb-10 px-4" style={{ color: colors.textSecondary }}>
            ScholarSync uses AI to manage your study schedule, track attendance, and optimize your learning path with a few prompts.
          </Text>

          {/* Functional Search Bar */}
          <View className="w-full max-w-md relative">
            <View 
              className="flex-row items-center p-1.5 rounded-full" 
              style={{ backgroundColor: colors.bgCard, borderWidth: 1, borderColor: colors.border }}
            >
              <Pressable className="p-2.5 rounded-full active:bg-gray-200/20">
                <Paperclip size={20} color={colors.textSecondary} />
              </Pressable>
              
              <TextInput
                value={searchValue}
                onChangeText={setSearchValue}
                onSubmitEditing={handleSearch}
                placeholder="How can I help you today?"
                placeholderTextColor={colors.textSecondary + "80"}
                className="flex-1 px-3 text-base"
                style={{ color: colors.textPrimary }}
              />

              <Pressable 
                onPress={handleSearch}
                className="p-2.5 rounded-full items-center justify-center bg-transparent active:bg-gray-200/20"
              >
                <Sparkles size={20} color={colors.accent} />
              </Pressable>
            </View>
          </View>

          {/* Suggestion Pills */}
          <View className="flex-row flex-wrap justify-center gap-3 mt-12 px-4">
            {[
              "Analyze my biology notes",
              "Plan study session for exams",
              "Check my attendance status",
              "Summarize today's lectures",
              "Add homework reminders"
            ].map((tag) => (
              <Pressable
                key={tag}
                onPress={() => {
                  setSearchValue(tag);
                  // Add tiny delay for visual feedback then search
                  setTimeout(handleSearch, 100);
                }}
                className="rounded-full px-4 py-2"
                style={{ backgroundColor: colors.bgCard, borderWidth: 1, borderColor: colors.border }}
              >
                <Text className="text-sm" style={{ color: colors.textPrimary }}>{tag}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
};
