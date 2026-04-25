import React, { useState } from "react";
import { Platform, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import TabBar from "@/components/TabBar";
import { useApp } from "@/context/AppContext";
import { useTheme } from "@/context/ThemeContext";
import OnboardingScreen from "@/components/OnboardingScreen";
import ChatScreen from "@/screens/ChatScreen";
import TimetableScreen from "@/screens/TimetableScreen";
import AttendanceScreen from "@/screens/AttendanceScreen";
import TodoScreen from "@/screens/TodoScreen";
import DashboardScreen from "@/screens/DashboardScreen";
import NotesScreen from "@/screens/NotesScreen";
import ExamsScreen from "@/screens/ExamsScreen";
import PomodoroScreen from "@/screens/PomodoroScreen";
import SettingsScreen from "@/screens/SettingsScreen";

export default function MainApp() {
  const { profile, isLoaded } = useApp();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState("chat");

  if (!isLoaded) return null;

  if (!profile.onboardingComplete) {
    return (
      <View style={[styles.root, { backgroundColor: colors.bgPrimary }]}>
        <OnboardingScreen onComplete={() => {}} />
      </View>
    );
  }

  const bottomPad = Platform.OS === "web" ? 84 : insets.bottom > 0 ? insets.bottom + 60 : 68;
  const chatBottomPad = Platform.OS === "web" ? 16 : insets.bottom > 0 ? insets.bottom + 12 : 16;

  const renderScreen = () => {
    switch (activeTab) {
      case "chat": return <ChatScreen />;
      case "timetable": return <TimetableScreen />;
      case "attendance": return <AttendanceScreen />;
      case "todo": return <TodoScreen />;
      case "dashboard": return <DashboardScreen />;
      case "notes": return <NotesScreen />;
      case "exams": return <ExamsScreen />;
      case "pomodoro": return <PomodoroScreen />;
      case "settings": return <SettingsScreen />;
      default: return <ChatScreen />;
    }
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.bgPrimary }]}>
      <View style={[styles.content, { paddingBottom: activeTab === "chat" ? chatBottomPad : bottomPad }]}>
        {renderScreen()}
      </View>
      <View style={styles.tabBarWrapper} pointerEvents="box-none">
        <TabBar activeTab={activeTab} onTabPress={setActiveTab} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { flex: 1 },
  tabBarWrapper: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 100,
  },
});
