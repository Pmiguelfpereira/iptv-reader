import type { ViewStyle } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";

type Props = {
  children: React.ReactNode;
  duration?: number;
  style?: ViewStyle;
};

export function ScreenFade({ children, duration = 180, style }: Props) {
  return (
    <Animated.View
      entering={FadeIn.duration(duration)}
      style={[{ flex: 1 }, style]}
    >
      {children}
    </Animated.View>
  );
}
