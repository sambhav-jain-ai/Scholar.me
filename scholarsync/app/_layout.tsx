import "../global.css";
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from "@expo-google-fonts/inter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { View } from "react-native";

import { ErrorBoundary } from "@/components/ErrorBoundary";
import { AppProvider } from "@/context/AppContext";
import { ThemeProvider, useTheme } from "@/context/ThemeContext";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { ProfileProvider } from "@/context/ProfileContext";
import { SettingsProvider } from "@/context/SettingsContext";
import { AcademicProvider } from "@/context/AcademicContext";
import LoginScreen from "@/screens/auth/LoginScreen";
import { configureNotifications } from "@/services/notifications";
import { useApp } from "@/context/AppContext";
import OnboardingScreen from "@/screens/OnboardingScreen";
import { useNetworkState } from "expo-network";
import { Text } from "react-native";
import { Feather } from "@expo/vector-icons";
import Animated, { SlideInDown, SlideOutDown } from "react-native-reanimated";
import { HeroGeometric } from "@/components/ui/shape-landing-hero";

SplashScreen.preventAutoHideAsync();
configureNotifications();

const queryClient = new QueryClient();

const OfflineBanner = () => {
  const networkInfo = useNetworkState();
  if (networkInfo.isConnected === true || networkInfo.isConnected === null)
    return null;

  return (
    <Animated.View
      entering={SlideInDown.springify()}
      exiting={SlideOutDown}
      style={{
        position: "absolute",
        bottom: 90, // above tabs
        left: 20,
        right: 20,
        backgroundColor: "#EF4444",
        padding: 12,
        borderRadius: 12,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 10,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
        elevation: 5,
      }}
    >
      <Feather name="wifi-off" size={16} color="#FFF" />
      <Text style={{ color: "#FFF", fontWeight: "600", fontSize: 13 }}>
        No Internet Connection
      </Text>
    </Animated.View>
  );
};

/** Shows LoginScreen when not authenticated, main app when signed in. */
function AuthGate({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const { isLoaded, profile } = useApp();
  const { colors } = useTheme();

  if (isLoading || (user && !isLoaded)) {
    // Still resolving auth state — keep splash up via the font/load check
    return <View style={{ flex: 1, backgroundColor: colors.bgPrimary }} />;
  }

  if (!user) {
    return <LoginScreen />;
  }

  if (!profile.onboardingComplete) {
    return <OnboardingScreen />;
  }

  return (
    <>
      {children}
      <OfflineBanner />
    </>
  );
}

function RootLayoutNav() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
    </Stack>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  const [initialAnimDone, setInitialAnimDone] = React.useState(false);

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
      // Start a 2-second timer for the premium entry animation
      const timer = setTimeout(() => {
        setInitialAnimDone(true);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) return null;

  if (!initialAnimDone) {
    return (
      <View style={{ flex: 1, backgroundColor: "#030303" }}>
        <HeroGeometric 
          badge="ScholarSync" 
          title1="Unlocking" 
          title2="Your Potential" 
        />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <ThemeProvider>
          <AuthProvider>
            <ProfileProvider>
              <SettingsProvider>
                <AcademicProvider>
                  <AppProvider>
                    <QueryClientProvider client={queryClient}>
                      <GestureHandlerRootView style={{ flex: 1 }}>
                        <KeyboardProvider>
                          <AuthGate>
                            <RootLayoutNav />
                          </AuthGate>
                        </KeyboardProvider>
                      </GestureHandlerRootView>
                    </QueryClientProvider>
                  </AppProvider>
                </AcademicProvider>
              </SettingsProvider>
            </ProfileProvider>
          </AuthProvider>
        </ThemeProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}
