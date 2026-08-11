import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { categories } from "../../db/schema";
import { IconButton } from "./IconButton";

export type Category = typeof categories.$inferSelect;

export function CategoryRow({
  item,
  onHidden,
  refresh,
  loading = false,
}: {
  item: Category;
  onHidden: (item: Category) => void;
  refresh: (item: Category) => void;
  loading?: boolean;
}) {
  return (
    <View style={styles.row}>
      <Text style={styles.name}>{item.name}</Text>
      {loading ? (
        <ActivityIndicator size={30} />
      ) : (
        <>
          <IconButton
            accessibilityLabel="Sync"
            name="sync"
            onPress={() => refresh(item)}
            disabled={loading}
          />
          <IconButton
            accessibilityLabel="Hidden"
            name={item.hidden ? "eye-invisible" : "eye"}
            onPress={() => onHidden(item)}
            disabled={loading}
          />
        </>
      )}
    </View>
  );
}
const styles = StyleSheet.create({
  container: {
    padding: 8,
    flex: 1,
    backgroundColor: "#121212",
  },
  text: {
    color: "#FFFFFF",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 20,
  },
  name: {
    color: "#FFF",
    fontSize: 16,
    flex: 1,
    marginRight: 12,
  },
  iconButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
  },
  iconButtonFocused: {
    backgroundColor: "rgba(79, 157, 255, 0.15)",
  },
});
