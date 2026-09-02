import { useFocusStore } from "@/store/focus";
import { useCallback, useState } from "react";
import {
  FlatList,
  LayoutChangeEvent,
  Platform,
  StyleSheet,
  TVFocusGuideView,
  useWindowDimensions,
  View,
} from "react-native";
import MediaCard, { MediaItem } from "./MediaCard";
import { FlashList } from "@shopify/flash-list";

const GAP = 20;
const H_PADDING = 8;
const MIN_ITEM_WIDTH = 110;

export default function MediaGrid({
  data,
  onPressItem,
  onEndReached,
}: {
  data: MediaItem[];
  onPressItem?: (item: MediaItem) => void;
  onEndReached?: () => void;
}) {
  const { width } = useWindowDimensions();
  const tabsHandle = useFocusStore((s) => s.tabsHandle);

  // Nº de colunas: 6 fixo na TV; no telemóvel, quantas cabem pela largura (mín. 2)
  const numColumns = Platform.isTV
    ? 6
    : Math.max(2, Math.floor((width - H_PADDING * 2) / MIN_ITEM_WIDTH));

  // Largura de cada poster: espaço do ecrã menos os paddings e os gaps, dividido pelas colunas
  // (com N colunas há N-1 gaps entre elas)
  const itemWidth =
    (width - H_PADDING * 2 - GAP * (numColumns - 1)) / numColumns;

  const renderItem = useCallback(
    ({ item, index }: { item: MediaItem; index: number }) => (
      <MediaCard
        item={item}
        width={itemWidth}
        onPress={() => onPressItem?.(item)}
        nextFocusUp={index < numColumns ? (tabsHandle ?? undefined) : undefined}
      />
    ),
    [itemWidth, numColumns, onPressItem, tabsHandle],
  );
  const list = (
    <FlashList
      key={numColumns}
      data={data}
      keyExtractor={(item) => item.id}
      numColumns={numColumns}
      contentContainerStyle={styles.content}
      renderItem={renderItem}
      onEndReached={onEndReached}
      onEndReachedThreshold={0.5}
    />
  );
  return Platform.isTV ? (
    <TVFocusGuideView style={{ flex: 1 }} autoFocus>
      {list}
    </TVFocusGuideView>
  ) : (
    <View style={{ flex: 1 }}>{list}</View>
  );
}

const styles = StyleSheet.create({
  content: {
    boxSizing: "border-box",
  },
  text: {
    color: "#fff",
  },
});
