import { useCallback, useState } from "react";
import {
  FlatList,
  LayoutChangeEvent,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { MediaItem } from "./MediaCard";
import { FlashList } from "@shopify/flash-list";

const GAP = 20;

export default function MediaList({
  data,
  onPressItem,
  onEndReached,
}: {
  data: MediaItem[];
  onPressItem?: (item: MediaItem) => void;
  onEndReached?: () => void;
}) {
  const [areaHeight, setAreaHeight] = useState(0);
  const onLayout = (e: LayoutChangeEvent) => {
    setAreaHeight(e.nativeEvent.layout.height);
  };

  const renderItem = useCallback(
    ({ item }: { item: MediaItem }) => (
      <Pressable
        onPress={() => onPressItem?.(item)}
        style={({ focused }) => [styles.row, focused && styles.rowFocused]}
      >
        <Text style={[styles.subtitle]} numberOfLines={2}>
          {item.id}
        </Text>
        <Text style={[styles.title]} numberOfLines={2}>
          {item.title}
        </Text>
      </Pressable>
    ),
    [onPressItem],
  );
  const Separator = () => <View style={styles.separator} />;

  return (
    <View style={{ flex: 1 }} onLayout={onLayout}>
      <FlashList
        style={{ height: areaHeight }}
        data={data}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.content}
        renderItem={renderItem}
        onEndReachedThreshold={0.5}
        maxItemsInRecyclePool={12}
        ItemSeparatorComponent={Separator}
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

  separator: {
    height: 1,
    backgroundColor: "#e5e5e5",
  },
});
