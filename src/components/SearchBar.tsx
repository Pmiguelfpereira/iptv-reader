// components/SearchBar.tsx
import AntDesign from "@react-native-vector-icons/ant-design/static";
import { useEffect, useRef } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";

export function SearchBar({
  value,
  onChange,
  onClose,
}: {
  value: string;
  onChange: (t: string) => void;
  onClose: () => void;
}) {
  const ref = useRef<TextInput>(null);
  useEffect(() => {
    ref.current?.focus();
  }, []);

  return (
    <View style={styles.bar}>
      <AntDesign name="search" size={20} color="#6f6e6a" />
      <TextInput
        ref={ref}
        value={value}
        onChangeText={onChange}
        placeholder="Search..."
        placeholderTextColor="#8a8a8a"
        style={styles.input}
        returnKeyType="search"
        autoFocus
      />
      <Pressable
        onPress={onClose}
        accessibilityLabel="Close"
        style={({ focused }) => [styles.close, focused && styles.closeFocused]}
      >
        <AntDesign name="close" size={20} color="#6f6e6a" />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#4f9dff",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 8,
  },
  input: { flex: 1, color: "#1a1a18", fontSize: 16, padding: 0 },
  close: {
    width: 20,
    height: 20,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
  },
  closeFocused: { backgroundColor: "rgba(79,157,255,0.15)" },
});
