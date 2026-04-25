import React, { useEffect, useRef } from "react";
import { View, StyleSheet, Animated, type ViewStyle } from "react-native";
import { useTheme } from "../../context/ThemeContext";

interface SkeletonProps {
  width?: number | string;
  height?: number | string;
  borderRadius?: number;
  style?: ViewStyle;
}

export function Skeleton({ width, height, borderRadius = 8, style }: SkeletonProps) {
  const { colors } = useTheme();
  const shimmerValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const shimmerAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerValue, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerValue, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    shimmerAnimation.start();
    return () => shimmerAnimation.stop();
  }, [shimmerValue]);

  const opacity = shimmerValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  return (
    <Animated.View
      style={[
        {
          width: width as any,
          height: height as any,
          borderRadius,
          backgroundColor: colors.border,
          opacity: opacity as any,
        },
        style,
      ]}
    />
  );
}

export function DashboardSkeleton() {
  return (
    <View style={styles.skeletonContainer}>
      <View style={styles.statsRow}>
        <Skeleton width="30%" height={80} borderRadius={16} />
        <Skeleton width="30%" height={80} borderRadius={16} />
        <Skeleton width="30%" height={80} borderRadius={16} />
      </View>
      <Skeleton width="100%" height={200} borderRadius={24} style={{ marginBottom: 20 }} />
      <Skeleton width="100%" height={150} borderRadius={24} />
    </View>
  );
}

const styles = StyleSheet.create({
  skeletonContainer: {
    padding: 20,
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 24,
  },
});
