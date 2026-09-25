import { useFocusStore } from "@/store/focus";
import { FlashList, FlashListRef } from "@shopify/flash-list";
import { useCallback, useEffect, useRef } from "react";
import {
  findNodeHandle,
  Platform,
  StyleSheet,
  TVFocusGuideView,
  useWindowDimensions,
  View,
} from "react-native";
import MediaCard, { MediaItem } from "./MediaCard";

const GAP = 20;
const H_PADDING = 8;
const MIN_ITEM_WIDTH = 110;

export default function MediaGrid({
  data,
  onPressItem,
  onEndReached,
  loading = false,
  resetKey,
}: {
  data: MediaItem[];
  onPressItem?: (item: MediaItem) => void;
  onEndReached?: () => void;
  loading?: boolean;
  resetKey: string;
}) {
  const { width } = useWindowDimensions();
  const tabsHandle = useFocusStore((s) => s.tabsHandle);
  const tabsFocusHandle = tabsHandle ? findNodeHandle(tabsHandle) : undefined;
  const listRef = useRef<FlashListRef<MediaItem>>(null);

  // Nº de colunas: 6 fixo na TV; no telemóvel, quantas cabem pela largura (mín. 2)
  const numColumns = Platform.isTV
    ? 6
    : Math.max(2, Math.floor((width - H_PADDING * 2) / MIN_ITEM_WIDTH));

  // Largura de cada poster: espaço do ecrã menos os paddings e os gaps, dividido pelas colunas
  // (com N colunas há N-1 gaps entre elas)
  const itemWidth =
    (width - H_PADDING * 2 - GAP * (numColumns - 1)) / numColumns;

  const lastItemIndex = data.length - 1;

  const renderItem = useCallback(
    ({ item, index }: { item: MediaItem; index: number }) => (
      <MediaCard
        item={item}
        width={itemWidth}
        onPress={() => onPressItem?.(item)}
        nextFocusUp={
          index < numColumns ? (tabsFocusHandle ?? undefined) : undefined
        }
        isLast={index === lastItemIndex}
      />
    ),
    [itemWidth, numColumns, onPressItem, tabsHandle],
  );
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

  const list = (
    <FlashList
      ref={listRef}
      key={numColumns}
      data={data}
      keyExtractor={(item) => item.id}
      numColumns={numColumns}
      contentContainerStyle={styles.content}
      renderItem={renderItem}
      onEndReached={onEndReached}
      onEndReachedThreshold={0.8}
      drawDistance={2000}
    />
  );
  return Platform.isTV ? (
    <TVFocusGuideView style={{ flex: 1 }} trapFocusDown={loading}>
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
