import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Image,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { AnimatedTaskIcon } from "./ui/AnimatedTaskIcon";
import Reanimated, { FadeIn } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../context/ThemeContext";
import { useApp } from "../context/AppContext";

interface TabBarProps {
  activeTab: string;
  onTabPress: (tab: string) => void;
}

// Bottom bar: Tasks | Chat | Schedule
const MAIN_TABS = [
  { id: "todo", label: "Tasks", icon: "list" as const },
  { id: "__chat__", label: "Chat", icon: "message-circle" as const },
  { id: "timetable", label: "Schedule", icon: "calendar" as const },
];

// Sidebar now includes ALL application sections
const SIDEBAR_ITEMS = [
  { id: "dashboard", label: "Dashboard", icon: "grid" as const, color: "#3B82F6", desc: "Analytics & totals" },
  { id: "chat", label: "AI Chat", icon: "message-circle" as const, color: "#6366F1", desc: "AI study companion" },
  { id: "todo", label: "Tasks", icon: "list" as const, color: "#F43F5E", desc: "To-do & assignments" },
  { id: "timetable", label: "Schedule", icon: "calendar" as const, color: "#8B5CF6", desc: "Academic calendar" },
  { id: "attendance", label: "Attendance", icon: "user-check" as const, color: "#10B981", desc: "Class tracking" },
  { id: "notes", label: "Notes", icon: "edit-3" as const, color: "#EC4899", desc: "Study transcripts" },
  { id: "exams", label: "Exams", icon: "award" as const, color: "#F59E0B", desc: "Future planning" },
  { id: "pomodoro", label: "Focus Timer", icon: "clock" as const, color: "#A78BFA", desc: "Productivity sessions" },
  { id: "settings", label: "Settings", icon: "settings" as const, color: "#9B9BB4", desc: "App preferences" },
];

// ── Sidebar Item ──────────────────────────────────────────────────
function SidebarItem({
  item, index, isVisible, isActive, onPress, colors,
}: {
  item: (typeof SIDEBAR_ITEMS)[0];
  index: number;
  isVisible: boolean;
  isActive: boolean;
  onPress: () => void;
  colors: any;
}) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(anim, {
      toValue: isVisible ? 1 : 0,
      delay: isVisible ? index * 65 : 0,
      useNativeDriver: true,
      speed: 14,
      bounciness: 8,
    }).start();
  }, [isVisible]);

  const translateX = anim.interpolate({ inputRange: [0, 1], outputRange: [60, 0] });
  const opacity = anim.interpolate({ inputRange: [0, 0.4, 1], outputRange: [0, 0.7, 1] });

  return (
    <Animated.View style={{ transform: [{ translateX }], opacity }}>
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          styles.sidebarItem,
          isActive && { backgroundColor: item.color + "18" },
          pressed && { backgroundColor: item.color + "28" },
        ]}
      >
        <View style={[styles.sidebarIconBox, { backgroundColor: item.color + "20" }]}>
          {item.id === "todo" ? (
            <AnimatedTaskIcon size={18} color={item.color} active={isActive} />
          ) : (
            <Feather name={item.icon} size={18} color={item.color} />
          )}
        </View>
        <View style={styles.sidebarItemText}>
          <Text style={[styles.sidebarItemLabel, { color: colors.textPrimary, fontWeight: isActive ? "700" : "500" }]}>
            {item.label}
          </Text>
          <Text style={[styles.sidebarItemDesc, { color: colors.textSecondary }]}>
            {item.desc}
          </Text>
        </View>
        <Feather
          name="chevron-right"
          size={16}
          color={isActive ? item.color : colors.textSecondary}
          style={{ opacity: isActive ? 1 : 0.35 }}
        />
      </Pressable>
    </Animated.View>
  );
}

// ── Sidebar Panel (slide from left) ───────────────────────────────
function SidebarPanel({
  visible, activeTab, onNavigate, onClose, colors,
}: {
  visible: boolean;
  activeTab: string;
  onNavigate: (id: string) => void;
  onClose: () => void;
  colors: any;
}) {
  const { profile } = useApp();
  const insets = useSafeAreaInsets();
  const slideAnim = useRef(new Animated.Value(0)).current;
  const overlayAnim = useRef(new Animated.Value(0)).current;
  const [itemsVisible, setItemsVisible] = useState(false);

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(slideAnim, { toValue: 1, useNativeDriver: true, speed: 18, bounciness: 4 }),
        Animated.timing(overlayAnim, { toValue: 1, duration: 220, useNativeDriver: true }),
      ]).start(() => setItemsVisible(true));
    } else {
      setItemsVisible(false);
      Animated.parallel([
        Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, speed: 22 }),
        Animated.timing(overlayAnim, { toValue: 0, duration: 160, useNativeDriver: true }),
      ]).start();
    }
  }, [visible]);

  // Slides in from the LEFT
  const translateX = slideAnim.interpolate({ inputRange: [0, 1], outputRange: [-320, 0] });

  const initials = (profile.name || "S").split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
  const studentLabel = profile.studentType === "college" ? "College Student" : "School Student";

  return (
    <Modal transparent visible={visible} animationType="none" onRequestClose={onClose} statusBarTranslucent>
      {/* Dim overlay — tap right side to close */}
      <Animated.View style={[styles.sidebarOverlay, { opacity: overlayAnim }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      </Animated.View>

      {/* Panel — LEFT side */}
      <Animated.View
        style={[
          styles.sidebarPanel,
          {
            backgroundColor: colors.bgCard,
            paddingTop: insets.top + 20,
            paddingBottom: insets.bottom + 24,
            transform: [{ translateX }],
          },
        ]}
      >
        {/* Close button */}
        <Pressable
          onPress={onClose}
          style={[styles.sidebarCloseBtn, { backgroundColor: colors.bgSecondary }]}
        >
          <Feather name="x" size={17} color={colors.textSecondary} />
        </Pressable>

        {/* Profile */}
        <View style={styles.sidebarProfile}>
          <View style={[styles.avatarRing, { borderColor: colors.accent + "40" }]}>
            <LinearGradient colors={["#6366F1", "#7C3AED"]} style={styles.avatarInitials}>
              <Text style={styles.initialsText}>{initials}</Text>
            </LinearGradient>
          </View>
          <View style={styles.profileInfo}>
            <Text style={[styles.profileName, { color: colors.textPrimary }]} numberOfLines={1}>
              {profile.name || "Student"}
            </Text>
            <View style={[styles.profileBadge, { backgroundColor: colors.accent + "18", borderColor: colors.accent + "35" }]}>
              <Feather name="user" size={10} color={colors.accent} />
              <Text style={[styles.profileBadgeText, { color: colors.accent }]}>{studentLabel}</Text>
            </View>
          </View>
        </View>

        <View style={[styles.divider, { backgroundColor: colors.border }]} />
        <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>NAVIGATION</Text>

        <ScrollView style={styles.sidebarScroll} showsVerticalScrollIndicator={false}>
          {SIDEBAR_ITEMS.map((item, i) => (
            <SidebarItem
              key={item.id}
              item={item}
              index={i}
              isVisible={itemsVisible}
              isActive={activeTab === item.id}
              onPress={() => onNavigate(item.id)}
              colors={colors}
            />
          ))}
        </ScrollView>

        <View style={[styles.sidebarFooter, { borderTopColor: colors.border }]}>
          <Feather name="zap" size={12} color={colors.accent} />
          <Text style={[styles.sidebarFooterText, { color: colors.textSecondary }]}>
            ScholarSync · AI-Powered
          </Text>
        </View>
      </Animated.View>
    </Modal>
  );
}

// ── Main TabBar ────────────────────────────────────────────────────
export default function TabBar({ activeTab, onTabPress }: TabBarProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const chatScaleAnim = useRef(new Animated.Value(1)).current;
  const homePulse = useRef(new Animated.Value(1)).current;
  const menuScale = useRef(new Animated.Value(1)).current;

  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom > 0 ? insets.bottom : 8;
  const navHeight = 62 + bottomPad;
  const topPad = Platform.OS === "web" ? 16 : insets.top;

  // Pulse home icon in chat mode
  useEffect(() => {
    if (activeTab === "chat") {
      Animated.loop(
        Animated.sequence([
          Animated.timing(homePulse, { toValue: 1.12, duration: 900, useNativeDriver: true }),
          Animated.timing(homePulse, { toValue: 1, duration: 900, useNativeDriver: true }),
        ])
      ).start();
    } else {
      homePulse.setValue(1);
    }
  }, [activeTab]);

  const openSidebar = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    // Tap animation on the hamburger
    Animated.sequence([
      Animated.spring(menuScale, { toValue: 0.82, useNativeDriver: true, speed: 30 }),
      Animated.spring(menuScale, { toValue: 1, useNativeDriver: true, speed: 18, bounciness: 14 }),
    ]).start();
    setSidebarOpen(true);
  };

  const closeSidebar = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSidebarOpen(false);
  };

  const handleSidebarNavigate = (tabId: string) => {
    closeSidebar();
    onTabPress(tabId);
  };

  const handleTabPress = (tabId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (tabId === "__chat__") {
      Animated.sequence([
        Animated.spring(chatScaleAnim, { toValue: 0.86, useNativeDriver: true, speed: 30 }),
        Animated.spring(chatScaleAnim, { toValue: 1, useNativeDriver: true, speed: 18, bounciness: 14 }),
      ]).start();
      onTabPress("chat");
      return;
    }
    onTabPress(tabId);
  };

  const isMoreActive = SIDEBAR_ITEMS.some((m) => m.id === activeTab);

  // ── Header Action button (top-left corner, absolute) ──────────────────
  const isChat = activeTab === "chat";

  const HamburgerBtn = (
    <Reanimated.View
      entering={FadeIn.duration(400)}
      style={[
        styles.hamburgerWrapper,
        { top: topPad + 10, transform: [{ scale: menuScale as any }] },
      ]}
    >
      {isChat ? (
        /* Only Back Arrow in Chat Mode */
        <Pressable
          onPress={() => onTabPress("dashboard")}
          style={styles.hamburgerBtn}
        >
          <Feather name="arrow-left" size={20} color={colors.accent} />
        </Pressable>
      ) : (
        /* Standard Hamburger Menu */
        <Pressable
          onPress={openSidebar}
          style={[
            styles.hamburgerBtn,
            {
              backgroundColor: isMoreActive ? colors.accent + "15" : colors.bgCard,
            },
          ]}
        >
          <Feather name="menu" size={20} color={isMoreActive ? colors.accent : colors.textSecondary} />
        </Pressable>
      )}
    </Reanimated.View>
  );


  // ── Chat mode: no bottom bar, only top-left header action ─────────────
  if (isChat) {
    return (
      <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
        {HamburgerBtn}
        <SidebarPanel
          visible={sidebarOpen}
          activeTab={activeTab}
          onNavigate={handleSidebarNavigate}
          onClose={closeSidebar}
          colors={colors}
        />
      </View>
    );
  }

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      {HamburgerBtn}

      <SidebarPanel
        visible={sidebarOpen}
        activeTab={activeTab}
        onNavigate={handleSidebarNavigate}
        onClose={closeSidebar}
        colors={colors}
      />

      {/* Main bottom tab bar */}
      <View
        style={[
          styles.container,
          {
            backgroundColor: colors.bgCard,
            borderTopColor: colors.border,
            paddingBottom: bottomPad,
            height: navHeight,
          },
        ]}
      >
        {MAIN_TABS.map((tab) => {
          const actualTabId = tab.id === "__chat__" ? "chat" : tab.id;
          const isActive = activeTab === actualTabId;

          return (
            <Pressable key={tab.id} onPress={() => handleTabPress(tab.id)} style={styles.tabBtn}>
              <View
                style={[
                  styles.tabIconWrap,
                  isActive && { backgroundColor: colors.accent + "22", borderRadius: 10 },
                ]}
              >
                {tab.id === "todo" ? (
                  <AnimatedTaskIcon size={20} color={isActive ? colors.accent : colors.textSecondary} active={isActive} />
                ) : (
                  <Feather name={tab.icon} size={20} color={isActive ? colors.accent : colors.textSecondary} />
                )}
              </View>
              <Text
                style={[
                  styles.tabLabel,
                  {
                    color: isActive ? colors.accent : colors.textSecondary,
                    fontWeight: isActive ? "600" : "400",
                  },
                ]}
              >
                {tab.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  // Hamburger — top-left absolute
  hamburgerWrapper: {
    position: "absolute",
    left: 10,
    zIndex: 200,

    flexDirection: "row",
    alignItems: "center",
  },

  hamburgerBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },

  // Bottom bar
  container: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 4,
  },
  tabBtn: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 8,
    gap: 2,
  },
  tabIconWrap: { padding: 5, alignItems: "center", justifyContent: "center" },
  tabLabel: { fontSize: 10 },

  // Sidebar overlay
  sidebarOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.52)",
    zIndex: 100,
  },

  // Sidebar panel (left side)
  sidebarPanel: {
    position: "absolute",
    top: 0,
    left: 0,
    bottom: 0,
    width: 300,
    zIndex: 101,
    shadowColor: "#000",
    shadowOffset: { width: 4, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 24,
    borderTopRightRadius: 24,
    borderBottomRightRadius: 24,
    gap: 0,
  },
  sidebarCloseBtn: {
    position: "absolute",
    top: 16,
    right: 16,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1,
  },

  // Profile
  sidebarProfile: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 20,
  },
  avatarRing: {
    width: 56, height: 56, borderRadius: 28,
    borderWidth: 2, overflow: "hidden",
    alignItems: "center", justifyContent: "center",
  },
  avatarInitials: {
    width: 52, height: 52, borderRadius: 26,
    alignItems: "center", justifyContent: "center",
  },
  initialsText: { fontSize: 20, fontWeight: "700", color: "#fff" },
  profileInfo: { flex: 1, gap: 6 },
  profileName: { fontSize: 17, fontWeight: "700", letterSpacing: -0.3 },
  profileBadge: {
    flexDirection: "row", alignItems: "center", gap: 5,
    paddingHorizontal: 9, paddingVertical: 3,
    borderRadius: 20, borderWidth: 1, alignSelf: "flex-start",
  },
  profileBadgeText: { fontSize: 11, fontWeight: "600" },

  divider: { height: StyleSheet.hairlineWidth, marginHorizontal: 20, marginBottom: 12 },
  sectionLabel: { fontSize: 10, fontWeight: "700", letterSpacing: 1, paddingHorizontal: 20, marginBottom: 6 },

  sidebarScroll: { flex: 1, paddingHorizontal: 12 },
  sidebarItem: {
    flexDirection: "row", alignItems: "center", gap: 14,
    paddingVertical: 13, paddingHorizontal: 10,
    borderRadius: 14, marginBottom: 4,
  },
  sidebarIconBox: {
    width: 38, height: 38, borderRadius: 11,
    alignItems: "center", justifyContent: "center", flexShrink: 0,
  },
  sidebarItemText: { flex: 1, gap: 2 },
  sidebarItemLabel: { fontSize: 15 },
  sidebarItemDesc: { fontSize: 11 },

  sidebarFooter: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 6, paddingTop: 14, marginHorizontal: 20,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  sidebarFooterText: { fontSize: 11 },
});
