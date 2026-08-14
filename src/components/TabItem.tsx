import { Platform, Pressable, StyleSheet, Text } from "react-native";

export default function TabItem({
  label,
  isActive,
  onPress,
  onFocus,
  onBlur,
  hasTVPreferredFocus = false,
}: {
  label: string;
  isActive: boolean;
  onPress: () => void;
  onFocus?: () => void;
  onBlur?: () => void;
  hasTVPreferredFocus?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      onFocus={onFocus}
      onBlur={onBlur}
      {...(Platform.isTV && { hasTVPreferredFocus })}
      style={({ focused }) => [
        styles.tab,
        isActive && styles.tabActive,
        focused && styles.tabFocused,
      ]}
    >
      <Text style={[styles.tabText, isActive && styles.tabTextActive]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "transparent",
  },
  tabFocused: {
    borderColor: "#4f9dff",
  },
  tabActive: {
    backgroundColor: "#111111",
  },
  tabText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#6E6E6E",
  },
  tabTextActive: {
    color: "#FFFFFF",
  },
});
