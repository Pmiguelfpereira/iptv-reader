import { ToastType, useToastStore } from "@/store/toast";
import { useEffect, useRef } from "react";
import { Animated, Pressable, StyleSheet, Text } from "react-native";

const COLORS: Record<ToastType, string> = {
  info: "#334155",
  success: "#15803d",
  error: "#b91c1c",
};

type Props = {
  duration?: number;
};

export function ToastHost({ duration = 3000 }: Props) {
  const current = useToastStore((s) => s.current);
  const hide = useToastStore((s) => s.hide);

  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!current) return;
    const id = current.id;

    anim.setValue(0);
    Animated.timing(anim, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
    }).start();

    const timer = setTimeout(() => {
      Animated.timing(anim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start(() => hide(id));
    }, duration);

    return () => clearTimeout(timer);
  }, [current, anim, duration, hide]);

  if (!current) return null;

  return (
    <Animated.View
      style={[
        styles.toast,
        {
          backgroundColor: COLORS[current.type],
          opacity: anim,
          transform: [
            {
              translateY: anim.interpolate({
                inputRange: [0, 1],
                outputRange: [16, 0],
              }),
            },
          ],
        },
      ]}
    >
      <Pressable onPress={() => hide()} style={styles.pressable}>
        <Text style={styles.text}>{current.message}</Text>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  toast: {
    position: "absolute",
    bottom: 48,
    left: 16,
    right: 16,
    borderRadius: 10,
    elevation: 6,
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  pressable: { paddingHorizontal: 16, paddingVertical: 12 },
  text: { color: "#fff", fontSize: 15, textAlign: "center" },
});
