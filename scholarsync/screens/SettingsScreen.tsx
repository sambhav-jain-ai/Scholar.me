import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useState } from "react";
import {
  Alert,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAcademic } from "../context/AcademicContext";
import { useProfile } from "../context/ProfileContext";
import { useSettings } from "../context/SettingsContext";
import { useTheme, THEMES, ThemeType } from "../context/ThemeContext";
import { generateId, SUBJECT_COLORS } from "../utils/ids";
import { signOut } from "../services/auth";
import { CalendarService } from "../services/CalendarService";


const THEME_LABELS: Record<ThemeType, string> = {
  ios: "iOS 26",
  winter: "Winter Chill",
  monochrome: "Neutral Mono",
  claude: "Claude",
};

export default function SettingsScreen() {
  const { colors, theme, mode, setTheme, toggleMode } = useTheme();
  const { profile, updateProfile } = useProfile();
  const { settings, updateSettings } = useSettings();
  const { subjects, addSubject, deleteSubject, exams } = useAcademic();

  const insets = useSafeAreaInsets();
  const [showAddSubject, setShowAddSubject] = useState(false);
  const [newSubjectName, setNewSubjectName] = useState("");
  const [newSubjectColor, setNewSubjectColor] = useState(SUBJECT_COLORS[0]);

  // Profile Edit State
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [editName, setEditName] = useState(profile.name);
  const [editStudentType, setEditStudentType] = useState<"college" | "school">(profile.studentType);

  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const handleAddSubject = () => {
    if (!newSubjectName.trim()) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    addSubject({
      id: generateId(),
      name: newSubjectName.trim(),
      color: newSubjectColor,
      totalPlanned: 40,
    });
    setNewSubjectName("");
    setNewSubjectColor(SUBJECT_COLORS[0]);
    setShowAddSubject(false);
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.bgPrimary }]}>
      <View
        style={[
          styles.header,
          { paddingTop: topPad + 10 },
        ]}
      >
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>
          Settings
        </Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeIn.duration(400)}>
          <Text style={[styles.section, { color: colors.textSecondary }]}>Profile</Text>

          <View style={[styles.card, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
            <View style={styles.row}>
              <Feather name="user" size={18} color={colors.textSecondary} />
              <Text style={[styles.rowLabel, { color: colors.textPrimary, flex: 1 }]}>{profile.name || "Student"}</Text>
              <Pressable onPress={() => { setEditName(profile.name); setEditStudentType(profile.studentType); setShowEditProfile(true); }}>
                <Feather name="edit-2" size={16} color={colors.accent} />
              </Pressable>
            </View>
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            <View style={styles.row}>
              <Feather name="book" size={18} color={colors.textSecondary} />
              <Text style={[styles.rowLabel, { color: colors.textPrimary }]}>
                {profile.studentType === "college" ? "College Student" : "School Student"}
              </Text>
            </View>
          </View>

          <Text style={[styles.section, { color: colors.textSecondary }]}>Subjects</Text>

          <View style={[styles.card, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
            {subjects.map((s, i) => (
              <View key={s.id}>
                <View style={styles.row}>
                  <View style={[styles.colorDot, { backgroundColor: s.color }]} />
                  <Text style={[styles.rowLabel, { color: colors.textPrimary, flex: 1 }]}>{s.name}</Text>
                  <Text style={[styles.rowSub, { color: colors.textSecondary }]}>{s.totalPlanned} classes</Text>
                  <Pressable onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    deleteSubject(s.id);
                  }}>
                    <Feather name="trash-2" size={16} color={colors.danger} />
                  </Pressable>
                </View>
                {i < subjects.length - 1 && <View style={[styles.divider, { backgroundColor: colors.border }]} />}
              </View>
            ))}

            <Pressable
              onPress={() => setShowAddSubject(true)}
              style={[styles.addRow, { borderColor: colors.accent }]}
            >
              <Feather name="plus" size={16} color={colors.accent} />
              <Text style={[styles.addRowText, { color: colors.accent }]}>Add Subject</Text>
            </Pressable>
          </View>

          <Text style={[styles.section, { color: colors.textSecondary }]}>Attendance</Text>

          <View style={[styles.card, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
            <View style={styles.row}>
              <Feather name="target" size={18} color={colors.textSecondary} />
              <Text style={[styles.rowLabel, { color: colors.textPrimary, flex: 1 }]}>Threshold</Text>
              <Text style={[styles.rowVal, { color: colors.accent }]}>{profile.attendanceThreshold}%</Text>
            </View>
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            <View style={styles.row}>
              <Feather name="clock" size={18} color={colors.textSecondary} />
              <Text style={[styles.rowLabel, { color: colors.textPrimary, flex: 1 }]}>Late = 0.5 Present</Text>
              <Switch
                value={settings.lateCountsHalfPresent}
                onValueChange={(v) => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  updateSettings({ lateCountsHalfPresent: v });
                }}
                trackColor={{ false: colors.border, true: colors.accent + "80" }}
                thumbColor={settings.lateCountsHalfPresent ? colors.accent : colors.textSecondary}
              />
            </View>
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            <View style={styles.row}>
              <Feather name="bar-chart-2" size={18} color={colors.textSecondary} />
              <Text style={[styles.rowLabel, { color: colors.textPrimary, flex: 1 }]}>Threshold Bar</Text>
              <Switch
                value={settings.showAttendanceThreshold}
                onValueChange={(v) => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  updateSettings({ showAttendanceThreshold: v });
                }}
                trackColor={{ false: colors.border, true: colors.accent + "80" }}
                thumbColor={settings.showAttendanceThreshold ? colors.accent : colors.textSecondary}
              />
            </View>
          </View>

          <Text style={[styles.section, { color: colors.textSecondary }]}>Theme</Text>

          <View style={[styles.card, { backgroundColor: colors.bgCard, borderColor: colors.border, marginBottom: 12 }]}>
            <View style={styles.row}>
              <Feather name={mode === "dark" ? "moon" : "sun"} size={18} color={colors.textSecondary} />
              <Text style={[styles.rowLabel, { color: colors.textPrimary, flex: 1 }]}>Dark Mode</Text>
              <Switch
                value={mode === "dark"}
                onValueChange={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  toggleMode();
                }}
                trackColor={{ false: colors.border, true: colors.accent + "80" }}
                thumbColor={mode === "dark" ? colors.accent : colors.textSecondary}
              />
            </View>
          </View>

          <View style={styles.themeGrid}>
            {(Object.keys(THEMES) as ThemeType[]).map((t) => {
              const tc = THEMES[t][mode];
              return (
                <Pressable
                  key={t}
                  onPress={() => {
                    Haptics.selectionAsync();
                    setTheme(t);
                  }}
                  style={[
                    styles.themeCard,
                    {
                      backgroundColor: tc.bgCard,
                      borderColor: theme === t ? tc.accent : colors.border,
                      borderWidth: theme === t ? 2 : 1,
                    },
                  ]}
                >
                  <View style={styles.themePreviewRow}>
                    <View style={[styles.themeAccent, { backgroundColor: tc.accent }]} />
                    <View style={[styles.themeText, { backgroundColor: tc.textPrimary + "60" }]} />
                  </View>
                  <Text style={[styles.themeLabel, { color: tc.textPrimary }]}>{THEME_LABELS[t]}</Text>
                  {theme === t && (
                    <View style={[styles.themeCheck, { backgroundColor: tc.accent }]}>
                      <Feather name="check" size={10} color="#FFF" />
                    </View>
                  )}
                </Pressable>
              );
            })}
          </View>

          <Text style={[styles.section, { color: colors.textSecondary }]}>Appearance</Text>

          <View style={[styles.card, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
            <View style={styles.row}>
              <Feather name="droplet" size={18} color={colors.textSecondary} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.rowLabel, { color: colors.textPrimary }]}>Liquid Glass Chat</Text>
                <Text style={[styles.rowSub, { color: colors.textSecondary, fontSize: 11 }]}>
                  Frosted glass style for AI chat bubbles
                </Text>
              </View>
              <Switch
                value={(settings as any).liquidGlass ?? false}
                onValueChange={(v) => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  updateSettings({ liquidGlass: v } as any);
                }}
                trackColor={{ false: colors.border, true: colors.accent + "80" }}
                thumbColor={(settings as any).liquidGlass ? colors.accent : colors.textSecondary}
              />
            </View>
          </View>

          <Text style={[styles.section, { color: colors.textSecondary }]}>Sound & Haptics</Text>

          <View style={[styles.card, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
            <View style={styles.row}>
              <Feather name="volume-2" size={18} color={colors.textSecondary} />
              <Text style={[styles.rowLabel, { color: colors.textPrimary, flex: 1 }]}>Sound Effects</Text>
              <Switch
                value={settings.soundEnabled}
                onValueChange={(v) => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  updateSettings({ soundEnabled: v });
                }}
                trackColor={{ false: colors.border, true: colors.accent + "80" }}
                thumbColor={settings.soundEnabled ? colors.accent : colors.textSecondary}
              />
            </View>
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            <View style={styles.row}>
              <Feather name="zap" size={18} color={colors.textSecondary} />
              <Text style={[styles.rowLabel, { color: colors.textPrimary, flex: 1 }]}>Haptic Feedback</Text>
              <Switch
                value={settings.hapticEnabled}
                onValueChange={(v) => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  updateSettings({ hapticEnabled: v });
                }}
                trackColor={{ false: colors.border, true: colors.accent + "80" }}
                thumbColor={settings.hapticEnabled ? colors.accent : colors.textSecondary}
              />
            </View>
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            <View style={styles.row}>
              <Feather name="battery" size={18} color={colors.textSecondary} />
              <Text style={[styles.rowLabel, { color: colors.textPrimary, flex: 1 }]}>Eco Mode</Text>
              <Switch
                value={settings.ecoMode}
                onValueChange={(v) => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  updateSettings({ ecoMode: v });
                }}
                trackColor={{ false: colors.border, true: colors.accent + "80" }}
                thumbColor={settings.ecoMode ? colors.accent : colors.textSecondary}
              />
            </View>
          </View>

          <Text style={[styles.section, { color: colors.textSecondary }]}>Optimization</Text>
          <View style={[styles.card, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
            <View style={styles.row}>
              <Feather name="cpu" size={18} color={colors.textSecondary} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.rowLabel, { color: colors.textPrimary }]}>Performance Mode</Text>
                <Text style={[styles.rowSub, { color: colors.textSecondary, fontSize: 11 }]}>
                  {settings.performanceMode === 'auto' ? 'Currently: Automatic detection' :
                    settings.performanceMode === 'low' ? 'Prioritizes speed (Low-end focus)' :
                      'Prioritizes visuals (High-end focus)'}
                </Text>
              </View>
              <Pressable
                onPress={() => {
                  const modes: ("auto" | "low" | "high")[] = ['auto', 'low', 'high'];
                  const currentIdx = modes.indexOf(settings.performanceMode || 'auto');
                  const nextMode = modes[(currentIdx + 1) % modes.length];
                  updateSettings({ performanceMode: nextMode });
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }}
                style={[styles.stepBtn, { borderColor: colors.border, width: 70, height: 32 }]}
              >
                <Text style={{ color: colors.accent, fontWeight: '700', fontSize: 11 }}>
                  {settings.performanceMode?.toUpperCase() || 'AUTO'}
                </Text>
              </Pressable>
            </View>
          </View>

          <Text style={[styles.section, { color: colors.textSecondary }]}>Ecosystem Sync</Text>
          <View style={[styles.card, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
            <View style={styles.row}>
              <Feather name="calendar" size={18} color={colors.textSecondary} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.rowLabel, { color: colors.textPrimary }]}>Sync with Device Calendar</Text>
                <Text style={[styles.rowSub, { color: colors.textSecondary, fontSize: 11 }]}>
                  Automatically add classes & exams to your system calendar
                </Text>
              </View>
              <Switch
                value={(settings as any).calendarSync ?? false}
                onValueChange={async (v) => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  updateSettings({ calendarSync: v } as any);
                  if (v) {
                    // Trigger initial sync
                    try {
                      await CalendarService.syncExams(exams);
                      Alert.alert("Sync Active", "Your exams have been mirrored to the 'ScholarSync' calendar.");
                    } catch (e) {
                      Alert.alert("Sync Error", "Could not sync with local calendar.");
                    }
                  }
                }}
                trackColor={{ false: colors.border, true: colors.accent + "80" }}
                thumbColor={(settings as any).calendarSync ? colors.accent : colors.textSecondary}
              />
            </View>
          </View>

          <Text style={[styles.section, { color: colors.textSecondary }]}>Pomodoro</Text>


          <View style={[styles.card, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
            {[
              { label: "Focus Duration", key: "pomodoroFocus", range: [15, 60] },
              { label: "Short Break", key: "pomodoroShortBreak", range: [3, 15] },
              { label: "Long Break", key: "pomodoroLongBreak", range: [10, 30] },
            ].map(({ label, key, range }, i) => (
              <View key={key}>
                <View style={styles.row}>
                  <Text style={[styles.rowLabel, { color: colors.textPrimary, flex: 1 }]}>{label}</Text>
                  <Pressable
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      updateSettings({ [key]: Math.max(range[0], (settings as any)[key] - 5) } as any);
                    }}
                    style={[styles.stepBtn, { borderColor: colors.border }]}
                  >
                    <Feather name="minus" size={14} color={colors.textPrimary} />
                  </Pressable>
                  <Text style={[styles.stepVal, { color: colors.accent }]}>
                    {(settings as any)[key]}m
                  </Text>
                  <Pressable
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      updateSettings({ [key]: Math.min(range[1], (settings as any)[key] + 5) } as any);
                    }}
                    style={[styles.stepBtn, { borderColor: colors.border }]}
                  >
                    <Feather name="plus" size={14} color={colors.textPrimary} />
                  </Pressable>
                </View>
                {i < 2 && <View style={[styles.divider, { backgroundColor: colors.border }]} />}
              </View>
            ))}
          </View>

          <Text style={[styles.section, { color: colors.textSecondary }]}>Account Actions</Text>
          <View style={[styles.card, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
            <Pressable
              onPress={() => {
                Alert.alert("Sign Out", "Are you sure you want to sign out?", [
                  { text: "Cancel", style: "cancel" },
                  {
                    text: "Sign Out",
                    style: "destructive",
                    onPress: async () => {
                      try {
                        await signOut();
                      } catch (e) {
                        Alert.alert("Error", "Could not sign out. Please try again.");
                      }
                    }
                  }
                ]);
              }}
              style={[styles.row, { justifyContent: "center" }]}
            >
              <Feather name="log-out" size={16} color={colors.danger} />
              <Text style={[styles.rowVal, { color: colors.danger, marginLeft: 4 }]}>Sign Out</Text>
            </Pressable>
          </View>

          <View style={{ height: 100 }} />
        </Animated.View>
      </ScrollView>

      <Modal
        visible={showAddSubject}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAddSubject(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setShowAddSubject(false)}>
          <Pressable
            style={[styles.sheet, { backgroundColor: colors.bgCard }]}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={styles.sheetHandle} />
            <Text style={[styles.sheetTitle, { color: colors.textPrimary }]}>Add Subject</Text>
            <TextInput
              style={[
                styles.sheetInput,
                { backgroundColor: colors.bgSecondary, color: colors.textPrimary, borderColor: colors.border },
              ]}
              placeholder="Subject name"
              placeholderTextColor={colors.textSecondary}
              value={newSubjectName}
              onChangeText={setNewSubjectName}
              autoFocus
            />
            <View style={styles.colorRow}>
              {SUBJECT_COLORS.map((c) => (
                <Pressable
                  key={c}
                  onPress={() => setNewSubjectColor(c)}
                  style={[
                    styles.colorDot,
                    { backgroundColor: c, width: 30, height: 30, borderRadius: 15 },
                    newSubjectColor === c && { borderWidth: 3, borderColor: "#FFF" },
                  ]}
                />
              ))}
            </View>
            <View style={styles.sheetBtnRow}>
              <Pressable
                onPress={() => setShowAddSubject(false)}
                style={[styles.sheetBtn, { backgroundColor: colors.bgSecondary }]}
              >
                <Text style={{ color: colors.textSecondary, fontWeight: "600" }}>Cancel</Text>
              </Pressable>
              <Pressable
                onPress={handleAddSubject}
                style={[styles.sheetBtn, { backgroundColor: colors.accent }]}
              >
                <Text style={{ color: "#FFF", fontWeight: "700" }}>Add</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Edit Profile Modal */}
      <Modal
        visible={showEditProfile}
        transparent
        animationType="slide"
        onRequestClose={() => setShowEditProfile(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setShowEditProfile(false)}>
          <Pressable
            style={[styles.sheet, { backgroundColor: colors.bgCard }]}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={styles.sheetHandle} />
            <Text style={[styles.sheetTitle, { color: colors.textPrimary }]}>Edit Profile</Text>
            <TextInput
              style={[
                styles.sheetInput,
                { backgroundColor: colors.bgSecondary, color: colors.textPrimary, borderColor: colors.border },
              ]}
              placeholder="Your Name"
              placeholderTextColor={colors.textSecondary}
              value={editName}
              onChangeText={setEditName}
            />

            <View style={{ flexDirection: "row", gap: 10, marginTop: 4 }}>
              <Pressable
                onPress={() => setEditStudentType("college")}
                style={[
                  styles.sheetBtn,
                  {
                    backgroundColor: editStudentType === "college" ? colors.accent + "40" : colors.bgSecondary,
                    borderWidth: 1, borderColor: editStudentType === "college" ? colors.accent : "transparent"
                  }
                ]}
              >
                <Text style={{ color: editStudentType === "college" ? colors.accent : colors.textSecondary, fontWeight: "600" }}>College</Text>
              </Pressable>
              <Pressable
                onPress={() => setEditStudentType("school")}
                style={[
                  styles.sheetBtn,
                  {
                    backgroundColor: editStudentType === "school" ? colors.accent + "40" : colors.bgSecondary,
                    borderWidth: 1, borderColor: editStudentType === "school" ? colors.accent : "transparent"
                  }
                ]}
              >
                <Text style={{ color: editStudentType === "school" ? colors.accent : colors.textSecondary, fontWeight: "600" }}>School</Text>
              </Pressable>
            </View>

            <View style={styles.sheetBtnRow}>
              <Pressable
                onPress={() => setShowEditProfile(false)}
                style={[styles.sheetBtn, { backgroundColor: colors.bgSecondary }]}
              >
                <Text style={{ color: colors.textSecondary, fontWeight: "600" }}>Cancel</Text>
              </Pressable>
              <Pressable
                onPress={() => {
                  updateProfile({ name: editName.trim(), studentType: editStudentType });
                  setShowEditProfile(false);
                  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                }}
                style={[styles.sheetBtn, { backgroundColor: colors.accent }]}
              >
                <Text style={{ color: "#FFF", fontWeight: "700" }}>Save</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingRight: 20,
    paddingLeft: 60,
    paddingBottom: 12,
  },
  headerTitle: { fontSize: 24, fontWeight: "800" },
  section: {
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginTop: 20,
    marginBottom: 8,
    paddingHorizontal: 20,
  },
  card: {
    marginHorizontal: 16,
    borderRadius: 14,
    borderWidth: 1,
    overflow: "hidden",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
  },
  rowLabel: { fontSize: 15 },
  rowSub: { fontSize: 12 },
  rowVal: { fontSize: 15, fontWeight: "700" },
  divider: { height: 1, marginHorizontal: 14 },
  addRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    margin: 10,
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderStyle: "dashed",
    justifyContent: "center",
  },
  addRowText: { fontSize: 14, fontWeight: "600" },
  colorDot: { width: 14, height: 14, borderRadius: 7 },
  themeGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, paddingHorizontal: 16 },
  themeCard: {
    width: "47%",
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    gap: 8,
    position: "relative",
  },
  themePreviewRow: { flexDirection: "row", gap: 8, alignItems: "center" },
  themeAccent: { width: 24, height: 10, borderRadius: 5 },
  themeText: { flex: 1, height: 6, borderRadius: 3 },
  themeLabel: { fontSize: 14, fontWeight: "600" },
  themeCheck: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  stepBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  stepVal: { fontSize: 16, fontWeight: "700", minWidth: 36, textAlign: "center" },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "flex-end" },
  sheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, gap: 12 },
  sheetHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: "#555", alignSelf: "center", marginBottom: 8 },
  sheetTitle: { fontSize: 18, fontWeight: "700" },
  sheetInput: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, fontSize: 15 },
  colorRow: { flexDirection: "row", gap: 10, flexWrap: "wrap" },
  sheetBtnRow: { flexDirection: "row", gap: 12, marginTop: 8 },
  sheetBtn: { flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: "center" },
});
