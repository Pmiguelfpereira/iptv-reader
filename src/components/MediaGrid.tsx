import { useFocusStore } from "@/store/focus";
import { useState } from "react";
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

const GAP = 12;
const H_PADDING = 8;
const MIN_ITEM_WIDTH = 110;

export default function MediaGrid({
  data,
  onPressItem,
}: {
  data: MediaItem[];
  onPressItem?: (item: MediaItem) => void;
}) {
  const { width } = useWindowDimensions();
  const [areaHeight, setAreaHeight] = useState(0);
  const tabsHandle = useFocusStore((s) => s.tabsHandle);

  const numColumns = Math.max(
    2,
    Math.floor((width - H_PADDING * 2) / MIN_ITEM_WIDTH),
  );
  const itemWidth =
    (width - H_PADDING * 2 - GAP * (numColumns - 1)) / numColumns;

  const onLayout = (e: LayoutChangeEvent) => {
    setAreaHeight(e.nativeEvent.layout.height);
  };

  const Container = Platform.isTV ? TVFocusGuideView : View;

  const list = (
    <FlatList
      style={{ height: areaHeight }}
      key={numColumns}
      data={data}
      keyExtractor={(item) => item.id}
      numColumns={numColumns}
      contentContainerStyle={styles.content}
      columnWrapperStyle={{ gap: GAP }}
      renderItem={({ item, index }) => (
        <MediaCard
          item={item}
          width={itemWidth}
          onPress={() => onPressItem?.(item)}
          nextFocusUp={index === 0 ? (tabsHandle ?? undefined) : undefined}
        />
      )}
    />
  );

  return (
    <View style={{ flex: 1 }} onLayout={onLayout}>
      {areaHeight > 0 &&
        (Platform.isTV ? (
          <Container style={{ height: areaHeight }} autoFocus>
            {list}
          </Container>
        ) : (
          list
        ))}
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
});
