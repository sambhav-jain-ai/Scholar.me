import React, { useEffect } from "react";
import Svg, { Path, Rect, Circle } from "react-native-svg";
import Animated, { 
  useAnimatedProps, 
  useSharedValue, 
  withSpring, 
  withDelay,
  interpolate
} from "react-native-reanimated";

const AnimatedPath = Animated.createAnimatedComponent(Path);

interface TaskIconProps {
  size?: number;
  color?: string;
  active?: boolean;
}

export function AnimatedTaskIcon({ size = 20, color = "#6366F1", active = false }: TaskIconProps) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withDelay(200, withSpring(active ? 1 : 0, { damping: 15, stiffness: 100 }));
  }, [active]);

  const checkmarkProps = useAnimatedProps(() => {
    const strokeDashoffset = interpolate(progress.value, [0, 1], [30, 0]);
    return {
      strokeDashoffset,
    };
  });

  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {/* Background Document Shape */}
      <Rect
        x="3"
        y="3"
        width="18"
        height="18"
        rx="5"
        stroke={color}
        strokeWidth="2"
        strokeOpacity={active ? 1 : 0.6}
      />
      
      {/* List Dots */}
      <Circle cx="8" cy="8" r="1" fill={color} opacity={active ? 1 : 0.5} />
      <Circle cx="8" cy="12" r="1" fill={color} opacity={active ? 1 : 0.5} />
      <Circle cx="8" cy="16" r="1" fill={color} opacity={active ? 1 : 0.5} />

      {/* List Lines */}
      <Path
        d="M12 8H17"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeOpacity={active ? 0.8 : 0.4}
      />
      <Path
        d="M12 12H17"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeOpacity={active ? 0.8 : 0.4}
      />
      <Path
        d="M12 16H14"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeOpacity={active ? 0.8 : 0.4}
      />

      {/* Animated Checkmark at the bottom right */}
      <AnimatedPath
        d="M16 16L18 18L22 13"
        stroke={color}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray="30"
        animatedProps={checkmarkProps}
      />
    </Svg>
  );
}
