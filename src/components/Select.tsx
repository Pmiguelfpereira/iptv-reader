import AntDesign from "@react-native-vector-icons/ant-design/static";
import { useMemo, useState } from "react";
import {
  FlatList,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TVFocusGuideView,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { OptionRow } from "./OptionRow";

export type SelectOption = { label: string; value: string };

export default function Select({
  options,
  value,
  onChange,
  placeholder = "Selecionar",
  searchable = true,
}: {
  options: SelectOption[];
  value: string | null;
  onChange: (v: string) => void;
  placeholder?: string;
  searchable?: boolean;
}) {
  const insets = useSafeAreaInsets();
  const [open, setOpen] = useState(false);
  const selected = options.find((o) => o.value === value);
  const [query, setQuery] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);

  const filtered = useMemo(() => {
    if (!query.trim()) return options;
    const q = query.toLowerCase();
    return options.filter((o) => o.label.toLowerCase().includes(q));
  }, [options, query]);

  const close = () => {
    setOpen(false);
    setQuery("");
  };
  const Container = Platform.isTV ? TVFocusGuideView : View;

  return (
    <>
      <Pressable
        style={({ focused }) => [styles.field, focused && styles.fieldFocused]}
        onPress={() => setOpen(true)}
      >
        <Text style={[styles.fieldText, !selected && styles.placeholder]}>
          {selected ? selected.label : placeholder}
        </Text>
        <AntDesign name="down" size={18} color="#6E6E6E" />
      </Pressable>

      <Modal
        visible={open}
        transparent
        animationType="fade"
        onRequestClose={close}
      >
        <View style={[styles.backdrop, { paddingTop: insets.top + 12 }]}>
          <Container
            style={styles.sheet}
            autoFocus
            trapFocusUp
            trapFocusDown
            trapFocusLeft
            trapFocusRight
          >
            {searchable && (
              <View style={[styles.searchWrapper]}>
                <AntDesign
                  name="search"
                  size={16}
                  color="#8A8A8A"
                  style={[searchFocused && styles.searchFocused]}
                />
                <TextInput
                  style={styles.search}
                  placeholder="Search..."
                  placeholderTextColor="#1A1A1A"
                  value={query}
                  onChangeText={setQuery}
                  onFocus={() => setSearchFocused(true)}
                  onBlur={() => setSearchFocused(false)}
                />
              </View>
            )}

            <FlatList
              data={filtered}
              keyExtractor={(item) => item.value}
              keyboardShouldPersistTaps="handled"
              style={styles.list}
              contentContainerStyle={styles.listContent}
              removeClippedSubviews={false}
              initialNumToRender={20}
              windowSize={11}
              ListEmptyComponent={
                <Text style={styles.empty}>Sem resultados</Text>
              }
              renderItem={({ item }) => (
                <OptionRow
                  option={item}
                  isActive={item.value === value}
                  onSelect={() => {
                    onChange(item.value);
                    close();
                  }}
                />
              )}
            />
          </Container>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  field: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#D6D6D6",
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  fieldFocused: {
    borderColor: "#4f9dff",
  },
  fieldText: { color: "#000", fontSize: 16 },
  placeholder: { color: "#000" },

  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,.24)",
    justifyContent: "flex-start",
    paddingHorizontal: 24,
  },

  sheet: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#FFFFFF",
    borderRadius: 12,
    overflow: "hidden",
    maxHeight: "70%", // <- trava a altura, o resto faz scroll
  },
  searchWrapper: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#2f2f2f",
    borderWidth: 2,
    borderColor: "transparent",
  },
  searchFocused: { color: "#4f9dff" },
  search: { flex: 1, color: "#1A1A1A", fontSize: 18, padding: 0 },

  list: { flexShrink: 1, color: "#1A1A1A" },

  empty: { color: "#1A1A1A", fontSize: 15, textAlign: "center", padding: 24 },
  listContent: { paddingVertical: 6 },
});
