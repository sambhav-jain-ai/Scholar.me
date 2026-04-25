import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React, { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useApp } from "../context/AppContext";
import { HeroGeometric } from "@/components/ui/shape-landing-hero";

export default function OnboardingScreen() {
  const insets = useSafeAreaInsets();
  const { updateProfile } = useApp();
  
  const [name, setName] = useState("");
  const [studentType, setStudentType] = useState<"college" | "school">("college");

  const handleComplete = () => {
    if (!name.trim()) return;
    updateProfile({
      name: name.trim(),
      studentType,
      onboardingComplete: true,
    });
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <HeroGeometric asBackground />

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 60, paddingBottom: insets.bottom + 24 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={FadeInDown.delay(100).springify()} style={{ alignItems: "center", marginBottom: 40 }}>
          <LinearGradient colors={["#6366F1", "#F43F5E"]} style={styles.logoIcon}>
            <Feather name="zap" size={32} color="#fff" />
          </LinearGradient>
          <Text style={styles.title}>Welcome to ScholarSync</Text>
          <Text style={styles.tagline}>Let's set up your academic profile</Text>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(200).springify()} style={styles.card}>
          <View style={styles.field}>
            <Text style={styles.label}>What should we call you?</Text>
            <View style={styles.inputRow}>
              <Feather name="user" size={18} color="rgba(255,255,255,0.35)" />
              <TextInput
                style={styles.input}
                placeholder="Your Name"
                placeholderTextColor="rgba(255,255,255,0.25)"
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
                autoFocus
              />
            </View>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Where do you study?</Text>
            <View style={{ flexDirection: "row", gap: 12, marginTop: 8 }}>
              <Pressable
                onPress={() => setStudentType("college")}
                style={[
                  styles.toggleBtn,
                  studentType === "college" && styles.toggleBtnActive
                ]}
              >
                <Feather name="briefcase" size={18} color={studentType === "college" ? "#6366F1" : "rgba(255,255,255,0.6)"} />
                <Text style={[styles.toggleText, studentType === "college" && styles.toggleTextActive]}>College</Text>
              </Pressable>
              <Pressable
                onPress={() => setStudentType("school")}
                style={[
                  styles.toggleBtn,
                  studentType === "school" && styles.toggleBtnActive
                ]}
              >
                <Feather name="book" size={18} color={studentType === "school" ? "#6366F1" : "rgba(255,255,255,0.6)"} />
                <Text style={[styles.toggleText, studentType === "school" && styles.toggleTextActive]}>School</Text>
              </Pressable>
            </View>
          </View>

          <Pressable
            onPress={handleComplete}
            disabled={!name.trim()}
            style={({ pressed }) => [styles.btn, { opacity: pressed || !name.trim() ? 0.6 : 1 }]}
          >
            <LinearGradient colors={["#6366F1", "#F43F5E"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.btnGradient}>
              <Text style={styles.btnText}>Continue to Dashboard</Text>
              <Feather name="arrow-right" size={18} color="#fff" />
            </LinearGradient>
          </Pressable>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#030303" },
  scroll: { paddingHorizontal: 24, alignItems: "stretch" },
  glowTL: { position: "absolute", width: 300, height: 300, borderRadius: 150, backgroundColor: "rgba(99,102,241,0.06)", left: -100, top: -60 },
  glowBR: { position: "absolute", width: 280, height: 280, borderRadius: 140, backgroundColor: "rgba(236,72,153,0.05)", right: -80, bottom: 40 },
  logoIcon: { width: 64, height: 64, borderRadius: 20, alignItems: "center", justifyContent: "center", marginBottom: 20 },
  title: { fontSize: 28, fontWeight: "800", color: "#fff", letterSpacing: -0.5, marginBottom: 8 },
  tagline: { fontSize: 16, color: "rgba(255,255,255,0.4)" },
  card: { backgroundColor: "rgba(255,255,255,0.04)", borderRadius: 24, borderWidth: 1, borderColor: "rgba(255,255,255,0.07)", padding: 24, gap: 24 },
  field: { gap: 10 },
  label: { fontSize: 14, fontWeight: "600", color: "rgba(255,255,255,0.6)" },
  inputRow: { flexDirection: "row", alignItems: "center", gap: 12, borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.1)", paddingBottom: 12 },
  input: { flex: 1, fontSize: 18, color: "#fff", fontWeight: "500" },
  toggleBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 14, borderRadius: 14, backgroundColor: "rgba(255,255,255,0.03)", borderWidth: 1, borderColor: "rgba(255,255,255,0.05)" },
  toggleBtnActive: { backgroundColor: "rgba(99,102,241,0.1)", borderColor: "rgba(99,102,241,0.5)" },
  toggleText: { fontSize: 16, fontWeight: "600", color: "rgba(255,255,255,0.6)" },
  toggleTextActive: { color: "#6366F1" },
  btn: { borderRadius: 16, overflow: "hidden", marginTop: 10 },
  btnGradient: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 18 },
  btnText: { fontSize: 16, fontWeight: "700", color: "#fff" },
});
