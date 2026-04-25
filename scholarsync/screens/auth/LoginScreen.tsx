import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
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
import { signIn, signUp } from "../../services/auth";
import { HeroGeometric } from "@/components/ui/shape-landing-hero";

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const isSignUp = mode === "signup";

  const handleSubmit = async () => {
    const trimmedEmail = email.trim().toLowerCase();
    
    if (!trimmedEmail || !password) {
      Alert.alert("Missing fields", "Please enter your email and password.");
      return;
    }

    const ALLOWED_DOMAINS = ["gmail.com", "yahoo.com", "hotmail.com", "outlook.com", "icloud.com", "aol.com", "ymail.com", "protonmail.com"];
    const domain = trimmedEmail.split("@")[1];
    if (!domain || !ALLOWED_DOMAINS.includes(domain)) {
      Alert.alert(
        "Invalid Email Domain",
        "Please use a personal email address (e.g. gmail.com, yahoo.com) to sign in. Business accounts are not permitted."
      );
      return;
    }

    if (isSignUp && password !== confirmPassword) {
      Alert.alert("Password mismatch", "Passwords do not match.");
      return;
    }
    if (password.length < 6) {
      Alert.alert("Weak password", "Password must be at least 6 characters.");
      return;
    }

    setLoading(true);
    try {
      if (isSignUp) {
        await signUp(trimmedEmail, password);
      } else {
        await signIn(trimmedEmail, password);
      }
      // AuthContext picks up the new user automatically — no navigation needed
    } catch (err: any) {
      const msg =
        err?.code === "auth/user-not-found" || err?.code === "auth/wrong-password"
          ? "Invalid email or password."
          : err?.code === "auth/email-already-in-use"
          ? "An account with this email already exists."
          : err?.code === "auth/invalid-email"
          ? "Please enter a valid email address."
          : "Something went wrong. Please try again.";
      Alert.alert("Error", msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      {/* Background */}
      <HeroGeometric asBackground />

      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingTop: insets.top + 40, paddingBottom: insets.bottom + 24 },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Logo */}
        <Animated.View entering={FadeInDown.delay(100).springify()} style={styles.logoRow}>
          <LinearGradient colors={["#6366F1", "#F43F5E"]} style={styles.logoIcon}>
            <Feather name="zap" size={28} color="#fff" />
          </LinearGradient>
          <Text style={styles.logoText}>ScholarSync</Text>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(200).springify()} style={styles.tagline}>
          <Text style={styles.taglineText}>
            {isSignUp
              ? "Create your account to get started"
              : "Welcome back! Sign in to continue"}
          </Text>
        </Animated.View>

        {/* Card */}
        <Animated.View entering={FadeInDown.delay(300).springify()} style={styles.card}>
          {/* Email */}
          <View style={styles.field}>
            <Text style={styles.label}>Email</Text>
            <View style={styles.inputRow}>
              <Feather name="mail" size={16} color="rgba(255,255,255,0.35)" />
              <TextInput
                style={styles.input}
                placeholder="you@example.com"
                placeholderTextColor="rgba(255,255,255,0.25)"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
          </View>

          {/* Password */}
          <View style={styles.field}>
            <Text style={styles.label}>Password</Text>
            <View style={styles.inputRow}>
              <Feather name="lock" size={16} color="rgba(255,255,255,0.35)" />
              <TextInput
                style={styles.input}
                placeholder="••••••••"
                placeholderTextColor="rgba(255,255,255,0.25)"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
              />
              <Pressable onPress={() => setShowPassword((v) => !v)}>
                <Feather
                  name={showPassword ? "eye-off" : "eye"}
                  size={16}
                  color="rgba(255,255,255,0.35)"
                />
              </Pressable>
            </View>
          </View>

          {/* Confirm password (sign-up only) */}
          {isSignUp && (
            <View style={styles.field}>
              <Text style={styles.label}>Confirm Password</Text>
              <View style={styles.inputRow}>
                <Feather name="lock" size={16} color="rgba(255,255,255,0.35)" />
                <TextInput
                  style={styles.input}
                  placeholder="••••••••"
                  placeholderTextColor="rgba(255,255,255,0.25)"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={!showPassword}
                />
              </View>
            </View>
          )}

          {/* Submit */}
          <Pressable
            onPress={handleSubmit}
            disabled={loading}
            style={({ pressed }) => [styles.btn, { opacity: pressed ? 0.85 : 1 }]}
          >
            <LinearGradient
              colors={["#6366F1", "#F43F5E"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.btnGradient}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Text style={styles.btnText}>
                    {isSignUp ? "Create Account" : "Sign In"}
                  </Text>
                  <Feather name="arrow-right" size={17} color="#fff" />
                </>
              )}
            </LinearGradient>
          </Pressable>
        </Animated.View>

        {/* Toggle mode */}
        <Animated.View entering={FadeInDown.delay(400).springify()} style={styles.toggle}>
          <Text style={styles.toggleText}>
            {isSignUp ? "Already have an account?" : "Don't have an account?"}
          </Text>
          <Pressable onPress={() => setMode(isSignUp ? "signin" : "signup")}>
            <Text style={styles.toggleLink}>
              {isSignUp ? "Sign In" : "Sign Up"}
            </Text>
          </Pressable>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#030303" },
  scroll: { paddingHorizontal: 24, alignItems: "stretch" },
  glowTL: {
    position: "absolute",
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: "rgba(99,102,241,0.06)",
    left: -100,
    top: -60,
  },
  glowBR: {
    position: "absolute",
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: "rgba(236,72,153,0.05)",
    right: -80,
    bottom: 40,
  },
  logoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    marginBottom: 8,
  },
  logoIcon: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  logoText: {
    fontSize: 30,
    fontWeight: "800",
    color: "#fff",
    letterSpacing: -0.5,
  },
  tagline: { marginBottom: 32 },
  taglineText: {
    fontSize: 14,
    color: "rgba(255,255,255,0.38)",
    lineHeight: 20,
  },
  card: {
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    padding: 22,
    gap: 18,
  },
  field: { gap: 8 },
  label: {
    fontSize: 12,
    fontWeight: "600",
    color: "rgba(255,255,255,0.45)",
    letterSpacing: 0.3,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.1)",
    paddingBottom: 10,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: "#fff",
  },
  btn: { borderRadius: 14, overflow: "hidden", marginTop: 4 },
  btnGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 16,
  },
  btnText: { fontSize: 16, fontWeight: "700", color: "#fff" },
  toggle: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
    marginTop: 28,
  },
  toggleText: { fontSize: 14, color: "rgba(255,255,255,0.38)" },
  toggleLink: { fontSize: 14, fontWeight: "700", color: "#6366F1" },
});
