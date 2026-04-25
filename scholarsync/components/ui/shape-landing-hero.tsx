import React, { useEffect } from "react";
import { View, Text, StyleSheet, Dimensions, Platform } from "react-native";
import Animated, { 
  useAnimatedStyle, 
  useSharedValue, 
  withTiming, 
  withDelay, 
  withRepeat,
  withSequence,
  Easing,
  interpolate,
  FadeIn
} from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import { Circle } from "lucide-react-native";
import { cn } from "@/lib/utils"; // Assuming utils exists, if not I'll create it or use a simple join

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

interface ElegantShapeProps {
  className?: string;
  delay?: number;
  width?: number;
  height?: number;
  rotate?: number;
  gradient?: string;
  colors: [string, string];
}

function ElegantShape({
  delay = 0,
  width = 400,
  height = 100,
  rotate = 0,
  colors,
  style,
}: ElegantShapeProps & { style?: any }) {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(-150);
  const rotation = useSharedValue(rotate - 15);
  const floatY = useSharedValue(0);

  useEffect(() => {
    opacity.value = withDelay(delay, withTiming(1, { duration: 1200 }));
    translateY.value = withDelay(
      delay,
      withTiming(0, {
        duration: 2400,
        easing: Easing.bezier(0.23, 0.86, 0.39, 0.96),
      })
    );
    rotation.value = withDelay(
      delay,
      withTiming(rotate, {
        duration: 2400,
        easing: Easing.bezier(0.23, 0.86, 0.39, 0.96),
      })
    );

    floatY.value = withRepeat(
      withSequence(
        withTiming(15, { duration: 6000, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 6000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      { translateY: translateY.value + floatY.value },
      { rotate: `${rotation.value}deg` },
    ],
  }));

  return (
    <Animated.View
      style={[
        {
          position: "absolute",
          width,
          height,
        },
        animatedStyle,
        style,
      ]}
    >
      <LinearGradient
        colors={colors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={[
          StyleSheet.absoluteFill,
          {
            borderRadius: height / 2,
            borderWidth: 2,
            borderColor: "rgba(255,255,255,0.15)",
            backgroundColor: "rgba(255,255,255,0.01)",
          },
        ]}
      />
    </Animated.View>
  );
}

export function HeroGeometric({
  badge = "Design Collective",
  title1 = "Elevate Your Digital Vision",
  title2 = "Crafting Exceptional Websites",
  asBackground = false,
}: {
  badge?: string;
  title1?: string;
  title2?: string;
  asBackground?: boolean;
}) {
  return (
    <View className="flex-1 w-full items-center justify-center bg-[#030303] overflow-hidden">
      {/* Background Glows */}
      <View style={styles.blurContainer}>
        <View style={[styles.glow, { backgroundColor: "rgba(79, 70, 229, 0.1)", top: SCREEN_HEIGHT * 0.2, left: -SCREEN_WIDTH * 0.2 }]} />
        <View style={[styles.glow, { backgroundColor: "rgba(244, 63, 94, 0.1)", bottom: SCREEN_HEIGHT * 0.2, right: -SCREEN_WIDTH * 0.2 }]} />
      </View>

      {/* Elegant Shapes */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <ElegantShape
          delay={300}
          width={SCREEN_WIDTH * 1.5}
          height={140}
          rotate={12}
          colors={["rgba(79, 70, 229, 0.15)", "transparent"]}
          style={{ left: -SCREEN_WIDTH * 0.2, top: SCREEN_HEIGHT * 0.15 }}
        />

        <ElegantShape
          delay={500}
          width={SCREEN_WIDTH * 1.2}
          height={120}
          rotate={-15}
          colors={["rgba(244, 63, 94, 0.15)", "transparent"]}
          style={{ right: -SCREEN_WIDTH * 0.1, top: SCREEN_HEIGHT * 0.7 }}
        />

        <ElegantShape
          delay={400}
          width={SCREEN_WIDTH * 0.8}
          height={80}
          rotate={-8}
          colors={["rgba(139, 92, 246, 0.15)", "transparent"]}
          style={{ left: SCREEN_WIDTH * 0.1, bottom: SCREEN_HEIGHT * 0.1 }}
        />

        <ElegantShape
          delay={600}
          width={SCREEN_WIDTH * 0.5}
          height={60}
          rotate={20}
          colors={["rgba(245, 158, 11, 0.15)", "transparent"]}
          style={{ right: SCREEN_WIDTH * 0.2, top: SCREEN_HEIGHT * 0.1 }}
        />

        <ElegantShape
          delay={700}
          width={SCREEN_WIDTH * 0.4}
          height={40}
          rotate={-25}
          colors={["rgba(6, 182, 212, 0.15)", "transparent"]}
          style={{ left: SCREEN_WIDTH * 0.25, top: SCREEN_HEIGHT * 0.1 }}
        />
      </View>

      {/* Content */}
      {!asBackground && (
        <View className="z-10 w-full px-6 items-center">
          <Animated.View 
            entering={FadeIn.delay(500).duration(1000)}
            className="flex-row items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 mb-8"
          >
            <Circle size={8} color="#F43F5E" fill="#F43F5E" />
            <Text className="text-white/60 text-sm font-medium tracking-wider">{badge}</Text>
          </Animated.View>

          <View className="items-center">
            <Text className="text-white text-5xl md:text-7xl font-bold text-center tracking-tight leading-tight">
              {title1}
            </Text>
            <Text className="text-indigo-300 text-5xl md:text-7xl font-bold text-center tracking-tight leading-tight">
              {title2}
            </Text>
          </View>

          <Text className="text-white/40 text-lg text-center mt-8 font-light leading-relaxed max-w-xs">
            Crafting exceptional digital experiences through innovative design and cutting-edge technology.
          </Text>
        </View>
      )}

      {/* Bottom Gradient Overlay */}
      <LinearGradient
        colors={["transparent", "#030303"]}
        style={styles.bottomOverlay}
        pointerEvents="none"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  blurContainer: {
    ...StyleSheet.absoluteFillObject,
    overflow: "hidden",
  },
  glow: {
    position: "absolute",
    width: 600,
    height: 600,
    borderRadius: 300,
  },
  bottomOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: SCREEN_HEIGHT * 0.3,
  },
});
