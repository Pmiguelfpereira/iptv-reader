import AntDesign from "@react-native-vector-icons/ant-design/static";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  StyleSheet,
  Text,
} from "react-native";
import { categories } from "../../db/schema";

export type Category = typeof categories.$inferSelect;

export function CategoryRow({
  item,
  onPress,
  loading = false,
  nextFocusUp,
}: {
  item: Category;
  onPress: (item: Category) => void;
  loading?: boolean;
  nextFocusUp?: number;
}) {
  return (
    <Pressable
      onPress={() => !loading && onPress(item)}
      style={({ focused }) => [styles.row, focused && styles.rowFocused]}
      {...(Platform.isTV && {
        nextFocusUp,
      })}
    >
      {({ focused }) => (
        <>
          <Text style={[styles.name]} numberOfLines={1}>
            {item.name}
          </Text>

          {loading ? (
            <ActivityIndicator size={24} />
          ) : (
            <AntDesign
              name={item.hidden ? "eye-invisible" : "sync"}
              size={24}
              color={focused ? "#4f9dff" : "#000"}
            />
          )}
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 20,
  },
  rowFocused: {
    backgroundColor: "rgba(79, 157, 255, 0.15)",
  },
  name: {
    color: "#000",
    fontSize: 16,
    flex: 1,
  },
  iconButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
  },
});
