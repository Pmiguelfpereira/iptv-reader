import AntDesign from "@react-native-vector-icons/ant-design/static";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { categories } from "../../db/schema";

export type Category = typeof categories.$inferSelect;

export function CategoryRow({
  item,
  onHidden,
}: {
  item: Category;
  onHidden: (item: Category) => void;
}) {
  return (
    <View style={styles.row}>
      <Text style={styles.name}>{item.name}</Text>
      <Pressable
        style={({ focused }) => [
          styles.iconButton,
          focused && styles.iconButtonFocused,
        ]}
        onPress={() => onHidden(item)}
      >
        {({ focused }) => (
          <AntDesign
            name={item.hidden ? "eye-invisible" : "eye"}
            color={focused ? "#4f9dff" : "#FFF"}
            size={20}
          />
        )}
      </Pressable>
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
