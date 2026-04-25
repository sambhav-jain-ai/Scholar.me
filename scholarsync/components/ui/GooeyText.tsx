import React, { useRef, useEffect, useState } from "react";
import { View, StyleSheet, Dimensions, StyleProp, ViewStyle, TextStyle } from "react-native";
import Svg, { Defs, Filter, FeColorMatrix, Text as SvgText } from "react-native-svg";
import Animated, { useAnimatedStyle, useSharedValue, withTiming, withDelay } from "react-native-reanimated";
import { useSettings } from "../../context/SettingsContext";

interface GooeyTextProps {
  texts: string[];
  morphTime?: number;
  cooldownTime?: number;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  fontSize?: number;
}

export function GooeyText({
  texts,
  morphTime = 1,
  cooldownTime = 0.5,
  fontSize = 48,
  style,
  textStyle,
}: GooeyTextProps) {
  const { settings } = useSettings();
  const performanceMode = settings.performanceMode || "auto";

  // Shared values for animation
  const fraction = useSharedValue(0);
  const [index, setIndex] = useState(0);

  // If performance is low, we simplify the effect
  const isLowEnd = performanceMode === "low";

  useEffect(() => {
    let interval: any;
    
    const run = () => {
      // Morph phase
      fraction.value = withTiming(1, { duration: morphTime * 1000 }, () => {
        // Cooldown phase
        fraction.value = withDelay(
          cooldownTime * 1000,
          withTiming(0, { duration: 0 }, () => {
            setIndex((prev) => (prev + 1) % texts.length);
          })
        );
      });
    };

    run();
    interval = setInterval(run, (morphTime + cooldownTime) * 1000);

    return () => clearInterval(interval);
  }, [texts, morphTime, cooldownTime]);

  const text1Style = useAnimatedStyle(() => {
    return {
      opacity: 1 - fraction.value,
      // Blur is expensive on native, so only apply if not low-end
      transform: [{ scale: 1 + (isLowEnd ? 0 : fraction.value * 0.1) }],
    };
  });

  const text2Style = useAnimatedStyle(() => {
    return {
      opacity: fraction.value,
      transform: [{ scale: 1.1 - (isLowEnd ? 0 : fraction.value * 0.1) }],
    };
  });

  const nextIndex = (index + 1) % texts.length;

  return (
    <View style={[styles.container, style]}>
      {/* 
          Standard Native Morphing (Simplified if low-end)
          SVG Filters are extremely expensive on mobile. 
          We use opacity + scale morphing by default, and SVG filter only if explicitly high quality.
      */}
      <View style={styles.textWrapper}>
        <Animated.Text
          style={[
            styles.text,
            { fontSize, color: "#D97757" }, // Default fallback
            textStyle,
            text1Style,
          ]}
        >
          {texts[index]}
        </Animated.Text>
        <Animated.Text
          style={[
            styles.text,
            { fontSize, color: "#D97757" },
            textStyle,
            text2Style,
          ]}
        >
          {texts[nextIndex]}
        </Animated.Text>
      </View>

      {!isLowEnd && (
        <Svg height="0" width="0" style={{ position: "absolute" }}>
          <Defs>
            <Filter id="goo">
              <FeColorMatrix
                type="matrix"
                values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 18 -7"
              />
            </Filter>
          </Defs>
        </Svg>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 44,
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  textWrapper: {
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
  },
  text: {
    position: "absolute",
    fontWeight: "800",
    textAlign: "center",
  },
});
