import { useState } from "react";
import {
  FlatList,
  LayoutChangeEvent,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { MediaItem } from "./MediaCard";

const GAP = 20;

export default function MediaList({
  data,
  onPressItem,
}: {
  data: MediaItem[];
  onPressItem?: (item: MediaItem) => void;
}) {
  const [areaHeight, setAreaHeight] = useState(0);
  const onLayout = (e: LayoutChangeEvent) => {
    setAreaHeight(e.nativeEvent.layout.height);
  };
  return (
    <View style={{ flex: 1 }} onLayout={onLayout}>
      <FlatList
        style={{ height: areaHeight }}
        data={data}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.content}
        renderItem={({ item, index }) => (
          <Pressable
            onPress={() => onPressItem?.(item)}
            style={({ focused }) => [
              styles.row,
              index < data.length - 1 && styles.itemBorder,
              focused && styles.rowFocused,
            ]}
          >
            <Text style={[styles.subtitle]} numberOfLines={2}>
              {item.id}
            </Text>
            <Text style={[styles.title]} numberOfLines={2}>
              {item.title}
            </Text>
          </Pressable>
        )}
      />
    </View>
  );
}
const styles = StyleSheet.create({
  content: {
    gap: GAP,
    boxSizing: "border-box",
  },
  text: {
    color: "#fff",
  },
  title: {
    color: "#1e1e1e",
    fontSize: 16,
    fontWeight: "500",
  },
  subtitle: {
    color: "#8a8a8a",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 20,
  },
  rowFocused: {
    backgroundColor: "rgba(79, 157, 255, 0.15)",
  },
  itemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: "#e5e5e5",
    paddingBottom: GAP,
  },
});
