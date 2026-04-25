import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../context/ThemeContext";
import { useApp } from "../context/AppContext";
import { generateId, SUBJECT_COLORS } from "../utils/ids";

const { width: SW, height: SH } = Dimensions.get("window");

interface FloatingShapeProps {
  width: number;
  height: number;
  rotate: number;
  left: number;
  top: number;
  delay: number;
  colors: [string, string];
}

function FloatingShape({ width, height, rotate, left, top, delay, colors }: FloatingShapeProps) {
  const entrance = useRef(new Animated.Value(0)).current;
  const float = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.delay(delay),
      Animated.spring(entrance, {
        toValue: 1,
        useNativeDriver: true,
        speed: 3,
        bounciness: 2,
      }),
    ]).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(float, { toValue: 1, duration: 5000 + delay * 0.3, useNativeDriver: true, easing: (t) => Math.sin(t * Math.PI) }),
        Animated.timing(float, { toValue: 0, duration: 5000 + delay * 0.3, useNativeDriver: true, easing: (t) => Math.sin(t * Math.PI) }),
      ])
    ).start();
  }, []);

  const opacity = entrance.interpolate({ inputRange: [0, 1], outputRange: [0, 0.85] });
  const translateY = float.interpolate({ inputRange: [0, 1], outputRange: [0, -18] });
  const entranceY = entrance.interpolate({ inputRange: [0, 1], outputRange: [-60, 0] });
  const entranceRotate = entrance.interpolate({
    inputRange: [0, 1],
    outputRange: [`${rotate - 15}deg`, `${rotate}deg`],
  });

  return (
    <Animated.View
      style={{
        position: "absolute",
        left,
        top,
        width,
        height,
        opacity,
        transform: [
          { translateY: Animated.add(entranceY, translateY) },
          { rotate: entranceRotate },
        ],
      }}
    >
      <LinearGradient
        colors={colors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={{
          width,
          height,
          borderRadius: 999,
          borderWidth: 1.5,
          borderColor: "rgba(255,255,255,0.12)",
        }}
      />
    </Animated.View>
  );
}

const SHAPES: FloatingShapeProps[] = [
  { width: SW * 0.75, height: 100, rotate: 12, left: -SW * 0.08, top: SH * 0.12, delay: 300, colors: ["rgba(99,102,241,0.35)", "transparent"] },
  { width: SW * 0.6, height: 80, rotate: -15, left: SW * 0.35, top: SH * 0.65, delay: 500, colors: ["rgba(244,63,94,0.3)", "transparent"] },
  { width: SW * 0.4, height: 60, rotate: -8, left: SW * 0.05, top: SH * 0.78, delay: 400, colors: ["rgba(139,92,246,0.28)", "transparent"] },
  { width: SW * 0.28, height: 44, rotate: 20, left: SW * 0.6, top: SH * 0.08, delay: 600, colors: ["rgba(245,158,11,0.28)", "transparent"] },
  { width: SW * 0.2, height: 32, rotate: -25, left: SW * 0.2, top: SH * 0.04, delay: 700, colors: ["rgba(6,182,212,0.28)", "transparent"] },
];

interface OnboardingScreenProps {
  onComplete: () => void;
}

export default function OnboardingScreen({ onComplete }: OnboardingScreenProps) {
  const { colors } = useTheme();
  const { updateProfile, updateSettings, addSubject } = useApp();
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [studentType, setStudentType] = useState<"college" | "school">("college");
  const [threshold, setThreshold] = useState(75);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;
  const titleChars = "ScholarSync".split("");
  const charAnims = useRef(titleChars.map(() => new Animated.Value(0))).current;

  useEffect(() => {
    if (step === 0) {
      titleChars.forEach((_, i) => {
        setTimeout(() => {
          Animated.spring(charAnims[i], {
            toValue: 1,
            useNativeDriver: true,
            speed: 18,
            bounciness: 10,
          }).start();
        }, i * 60 + 300);
      });
    }
  }, [step]);

  const goNext = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: -30, duration: 200, useNativeDriver: true }),
    ]).start(() => {
      setStep((s) => s + 1);
      slideAnim.setValue(30);
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 250, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 0, duration: 250, useNativeDriver: true }),
      ]).start();
    });
  };

  const finish = () => {
    updateProfile({
      name: name.trim() || "Student",
      studentType,
      attendanceThreshold: threshold,
      onboardingComplete: true,
      tourComplete: true,
    });
    updateSettings({ theme: "ios" });
    if (addSubject) {
      const defaultSubjects = [
        { name: "Mathematics", color: SUBJECT_COLORS[0] },
        { name: "Physics", color: SUBJECT_COLORS[1] },
        { name: "English", color: SUBJECT_COLORS[2] },
      ];
      defaultSubjects.forEach((s) =>
        addSubject({ id: generateId(), name: s.name, color: s.color, totalPlanned: 40 })
      );
    }
    onComplete();
  };

  const topPad = Platform.OS === "web" ? 67 : insets.top + 20;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom + 20;

  return (
    <View style={styles.root}>
      {/* Hero background: always on */}
      <View style={StyleSheet.absoluteFill}>
        <LinearGradient
          colors={["#030303", "#0D0D1A", "#030303"]}
          style={StyleSheet.absoluteFill}
        />
        {/* Ambient glow blobs */}
        <View style={styles.glowTopLeft} />
        <View style={styles.glowBottomRight} />
        {/* Animated floating shapes */}
        {SHAPES.map((s, i) => (
          <FloatingShape key={i} {...s} />
        ))}
        {/* Top/bottom fade vignette */}
        <LinearGradient
          colors={["#030303", "transparent"]}
          style={[styles.vignette, { top: 0, height: 120 }]}
          pointerEvents="none"
        />
        <LinearGradient
          colors={["transparent", "#030303"]}
          style={[styles.vignette, { bottom: 0, height: 160 }]}
          pointerEvents="none"
        />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scroll,
            { paddingTop: topPad, paddingBottom: bottomPad },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
            {step === 0 && (
              <View style={styles.center}>
                {/* Badge */}
                <View style={styles.badge}>
                  <View style={styles.badgeDot} />
                  <Text style={styles.badgeText}>AI-Powered Student Companion</Text>
                </View>

                {/* Animated title */}
                <View style={styles.titleRow}>
                  {titleChars.map((ch, i) => (
                    <Animated.Text
                      key={i}
                      style={[
                        styles.titleChar,
                        {
                          opacity: charAnims[i],
                          transform: [
                            {
                              translateY: charAnims[i].interpolate({
                                inputRange: [0, 1],
                                outputRange: [20, 0],
                              }),
                            },
                          ],
                          color: i < 6 ? "#fff" : "rgba(255,255,255,0.75)",
                        },
                      ]}
                    >
                      {ch}
                    </Animated.Text>
                  ))}
                </View>

                <Text style={styles.heroSub}>
                  Crafting exceptional study experiences{"\n"}through intelligence and design.
                </Text>

                <View style={styles.featureList}>
                  {[
                    ["calendar", "Smart Timetable", "#6366F1"],
                    ["check-square", "Attendance Tracking", "#10B981"],
                    ["list", "Task Manager", "#F59E0B"],
                    ["book-open", "AI Notes", "#EC4899"],
                    ["bar-chart-2", "Analytics", "#3B82F6"],
                  ].map(([icon, label, col]) => (
                    <View key={label as string} style={styles.featureRow}>
                      <View style={[styles.featureIcon, { backgroundColor: (col as string) + "25" }]}>
                        <Feather name={icon as any} size={16} color={col as string} />
                      </View>
                      <Text style={styles.featureLabel}>{label as string}</Text>
                    </View>
                  ))}
                </View>

                <Pressable
                  onPress={goNext}
                  style={({ pressed }) => [styles.btn, { opacity: pressed ? 0.85 : 1 }]}
                >
                  <LinearGradient
                    colors={["#6366F1", "#7C3AED"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.btnGradient}
                  >
                    <Text style={styles.btnText}>Get Started</Text>
                    <Feather name="arrow-right" size={18} color="#FFF" />
                  </LinearGradient>
                </Pressable>
              </View>
            )}

            {step === 1 && (
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>Tell us about yourself</Text>
                <Text style={styles.stepSub}>Personalize your experience</Text>

                <View style={styles.glassCard}>
                  <Text style={styles.inputLabel}>Your Name</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter your name"
                    placeholderTextColor="rgba(255,255,255,0.3)"
                    value={name}
                    onChangeText={setName}
                    autoCapitalize="words"
                  />
                </View>

                <Text style={styles.sectionLabel}>Student Type</Text>
                <View style={styles.typeRow}>
                  {(["college", "school"] as const).map((type) => (
                    <Pressable
                      key={type}
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        setStudentType(type);
                      }}
                      style={[
                        styles.typeCard,
                        studentType === type && styles.typeCardActive,
                      ]}
                    >
                      <Feather
                        name={type === "college" ? "book" : "users"}
                        size={28}
                        color={studentType === type ? "#6366F1" : "rgba(255,255,255,0.5)"}
                      />
                      <Text
                        style={[
                          styles.typeLabel,
                          { color: studentType === type ? "#fff" : "rgba(255,255,255,0.5)" },
                        ]}
                      >
                        {type === "college" ? "College" : "School"}
                      </Text>
                      {studentType === type && (
                        <View style={styles.checkBadge}>
                          <Feather name="check" size={10} color="#FFF" />
                        </View>
                      )}
                    </Pressable>
                  ))}
                </View>

                <Pressable
                  onPress={goNext}
                  style={({ pressed }) => [styles.btn, { opacity: pressed ? 0.85 : 1 }]}
                >
                  <LinearGradient
                    colors={["#6366F1", "#7C3AED"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.btnGradient}
                  >
                    <Text style={styles.btnText}>Continue</Text>
                    <Feather name="arrow-right" size={18} color="#FFF" />
                  </LinearGradient>
                </Pressable>
              </View>
            )}

            {step === 2 && (
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>Attendance Goal</Text>
                <Text style={styles.stepSub}>Set your minimum attendance threshold</Text>

                <View style={styles.glassCard}>
                  <Text
                    style={[
                      styles.thresholdNum,
                      {
                        color:
                          threshold > 80 ? "#10B981"
                          : threshold >= 65 ? "#F59E0B"
                          : "#EF4444",
                      },
                    ]}
                  >
                    {threshold}%
                  </Text>
                  <Text style={styles.thresholdLabel}>Minimum Attendance</Text>
                </View>

                <View style={styles.sliderRow}>
                  {[50, 60, 65, 70, 75, 80, 85, 90, 95, 100].map((v) => (
                    <Pressable
                      key={v}
                      onPress={() => {
                        Haptics.selectionAsync();
                        setThreshold(v);
                      }}
                      style={[
                        styles.sliderPip,
                        {
                          backgroundColor: v <= threshold ? "#6366F1" : "rgba(255,255,255,0.12)",
                          borderColor: v === threshold ? "#6366F1" : "transparent",
                          transform: [{ scale: v === threshold ? 1.4 : 1 }],
                        },
                      ]}
                    />
                  ))}
                </View>

                <Pressable
                  onPress={goNext}
                  style={({ pressed }) => [styles.btn, { opacity: pressed ? 0.85 : 1 }]}
                >
                  <LinearGradient
                    colors={["#6366F1", "#7C3AED"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.btnGradient}
                  >
                    <Text style={styles.btnText}>Continue</Text>
                    <Feather name="arrow-right" size={18} color="#FFF" />
                  </LinearGradient>
                </Pressable>
              </View>
            )}

            {step === 3 && (
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>All Set! 🚀</Text>
                <Text style={styles.stepSub}>ScholarSync is ready for you</Text>

                <View style={styles.glassCard}>
                  {[
                    { icon: "user", val: name.trim() || "Student" },
                    { icon: "book", val: studentType === "college" ? "College Student" : "School Student" },
                    { icon: "percent", val: `${threshold}% Attendance Target` },
                  ].map((row) => (
                    <View key={row.icon} style={styles.summaryRow}>
                      <Feather name={row.icon as any} size={16} color="#6366F1" />
                      <Text style={styles.summaryVal}>{row.val}</Text>
                    </View>
                  ))}
                </View>

                <View style={styles.aiInfoCard}>
                  <Feather name="zap" size={18} color="#6366F1" />
                  <Text style={styles.aiInfoText}>
                    AI powered by Claude via Replit AI Integrations — no API key needed.
                  </Text>
                </View>

                <Pressable
                  onPress={finish}
                  style={({ pressed }) => [styles.btn, { opacity: pressed ? 0.85 : 1 }]}
                >
                  <LinearGradient
                    colors={["#6366F1", "#7C3AED"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.btnGradient}
                  >
                    <Text style={styles.btnText}>Start Using ScholarSync</Text>
                    <Feather name="chevron-right" size={18} color="#FFF" />
                  </LinearGradient>
                </Pressable>
              </View>
            )}
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#030303" },
  scroll: { paddingHorizontal: 24 },
  vignette: { position: "absolute", left: 0, right: 0 },
  glowTopLeft: {
    position: "absolute",
    width: SW * 0.7,
    height: SW * 0.7,
    borderRadius: SW * 0.35,
    backgroundColor: "rgba(99,102,241,0.05)",
    left: -SW * 0.2,
    top: -SW * 0.1,
    transform: [{ scaleX: 1.5 }],
  },
  glowBottomRight: {
    position: "absolute",
    width: SW * 0.7,
    height: SW * 0.7,
    borderRadius: SW * 0.35,
    backgroundColor: "rgba(244,63,94,0.05)",
    right: -SW * 0.2,
    bottom: -SW * 0.1,
    transform: [{ scaleX: 1.5 }],
  },
  center: { alignItems: "center", gap: 20 },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    marginBottom: 4,
  },
  badgeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#EC4899",
  },
  badgeText: { color: "rgba(255,255,255,0.55)", fontSize: 12, letterSpacing: 0.5 },
  titleRow: { flexDirection: "row", flexWrap: "wrap", justifyContent: "center" },
  titleChar: { fontSize: 42, fontWeight: "800", letterSpacing: 1.5 },
  heroSub: {
    color: "rgba(255,255,255,0.35)",
    fontSize: 15,
    textAlign: "center",
    lineHeight: 22,
    fontWeight: "300",
    letterSpacing: 0.3,
  },
  featureList: { width: "100%", gap: 12, marginTop: 8 },
  featureRow: { flexDirection: "row", alignItems: "center", gap: 14 },
  featureIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  featureLabel: { color: "rgba(255,255,255,0.6)", fontSize: 15 },
  btn: { width: "100%", marginTop: 24, borderRadius: 16, overflow: "hidden" },
  btnGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 17,
  },
  btnText: { color: "#FFF", fontSize: 16, fontWeight: "700" },
  stepContent: { gap: 16 },
  stepTitle: { fontSize: 30, fontWeight: "800", color: "#fff" },
  stepSub: { fontSize: 15, color: "rgba(255,255,255,0.45)", marginBottom: 8 },
  glassCard: {
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    padding: 20,
    gap: 12,
  },
  inputLabel: { fontSize: 12, color: "rgba(255,255,255,0.45)", marginBottom: 4 },
  input: { fontSize: 16, fontWeight: "500", color: "#fff" },
  sectionLabel: { fontSize: 13, color: "rgba(255,255,255,0.4)" },
  typeRow: { flexDirection: "row", gap: 12 },
  typeCard: {
    flex: 1,
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
    gap: 10,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    position: "relative",
  },
  typeCardActive: {
    backgroundColor: "rgba(99,102,241,0.12)",
    borderColor: "#6366F1",
    borderWidth: 2,
  },
  typeLabel: { fontSize: 15, fontWeight: "600" },
  checkBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: "#6366F1",
    alignItems: "center",
    justifyContent: "center",
  },
  thresholdNum: { fontSize: 60, fontWeight: "800", textAlign: "center" },
  thresholdLabel: { fontSize: 14, color: "rgba(255,255,255,0.4)", textAlign: "center" },
  sliderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 4,
  },
  sliderPip: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
  },
  summaryRow: { flexDirection: "row", alignItems: "center", gap: 14 },
  summaryVal: { fontSize: 15, fontWeight: "500", color: "#fff" },
  aiInfoCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(99,102,241,0.3)",
    backgroundColor: "rgba(99,102,241,0.08)",
    padding: 14,
  },
  aiInfoText: { flex: 1, fontSize: 13, color: "rgba(255,255,255,0.5)", lineHeight: 18 },
});
