import { useCallback, useEffect, useRef, useState } from "react";
import {
  FlatList,
  LayoutChangeEvent,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { MediaItem } from "./MediaCard";
import { FlashList, FlashListRef } from "@shopify/flash-list";

const GAP = 20;

export default function MediaList({
  data,
  onPressItem,
  onEndReached,
  resetKey,
}: {
  data: MediaItem[];
  onPressItem?: (item: MediaItem) => void;
  onEndReached?: () => void;
  resetKey: string;
}) {
  const listRef = useRef<FlashListRef<MediaItem>>(null);

  useEffect(() => {
    if (!data?.length) return;

    const timeout = setTimeout(() => {
      listRef.current?.scrollToOffset({
        offset: 0,
        animated: false,
      });
    }, 0);

    return () => clearTimeout(timeout);
  }, [resetKey]);

  const renderItem = useCallback(
    ({ item }: { item: MediaItem }) => {
      return (
        <Pressable
          onPress={() => onPressItem?.(item)}
          style={({ focused }) => [styles.row, focused && styles.rowFocused]}
        >
          <Text style={[styles.subtitle]} numberOfLines={1}>
            {item.id}
          </Text>
          <Text style={[styles.title]} numberOfLines={1}>
            {item.title}
          </Text>
        </Pressable>
      );
    },
    [onPressItem],
  );
  const Separator = () => <View style={styles.separator} />;

  return (
    <View style={{ flex: 1 }}>
      <FlashList
        ref={listRef}
        data={data}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        onEndReachedThreshold={0.5}
        maxItemsInRecyclePool={12}
        ItemSeparatorComponent={Separator}
        onEndReached={onEndReached}
      />
    </View>
  );
}
const styles = StyleSheet.create({
  text: {
    color: "#3a2525",
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
