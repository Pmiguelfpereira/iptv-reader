import { Pressable, StyleSheet, Text } from "react-native";

export default function TabItem({
  label,
  isActive,
  onPress,
}: {
  label: string;
  isActive: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
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
    backgroundColor: "#2f2f2f",
  },
  tabText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#8a8a8a",
  },
  tabTextActive: {
    color: "#fff",
  },
});
