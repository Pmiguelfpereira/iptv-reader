import AntDesign from "@react-native-vector-icons/ant-design/static";
import { useState } from "react";
import { Pressable, StyleSheet, Text } from "react-native";

export type Option = { label: string; value: string };

export function OptionRow({
  option,
  isActive,
  onSelect,
}: {
  option: Option;
  isActive: boolean;
  onSelect: () => void;
}) {
  const [focused, setFocused] = useState(false);

  return (
    <Pressable
      style={[
        styles.option,
        isActive && styles.optionActive,
        focused && styles.optionFocused, // <- destaque de foco
      ]}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      onPress={onSelect}
    >
      <Text
        style={[
          styles.optionText,
          (isActive || focused) && styles.optionTextActive,
        ]}
      >
        {option.label}
      </Text>
      {isActive && <AntDesign name="check" size={20} color="#111" />}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  option: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingVertical: 18,
  },
  optionActive: { backgroundColor: "#F5F5F5" },
  optionFocused: {
    backgroundColor: "rgba(79, 157, 255, 0.15)",
  },
  optionText: { color: "#1A1A1A", fontSize: 18 },
  optionTextActive: { color: "#111", fontWeight: "500" },
});
