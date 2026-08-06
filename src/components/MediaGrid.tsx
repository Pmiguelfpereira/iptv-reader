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

  const numColumns = Math.max(
    2,
    Math.floor((width - H_PADDING * 2) / MIN_ITEM_WIDTH),
  );
  const itemWidth =
    (width - H_PADDING * 2 - GAP * (numColumns - 1)) / numColumns;

  const onLayout = (e: LayoutChangeEvent) => {
    setAreaHeight(e.nativeEvent.layout.height);
  };
  const list = (
    <FlatList
      style={{ height: areaHeight }}
      key={numColumns}
      data={data}
      keyExtractor={(item) => item.id}
      numColumns={numColumns}
      contentContainerStyle={styles.content}
      columnWrapperStyle={{ gap: GAP }}
      renderItem={({ item }) => (
        <MediaCard
          item={item}
          width={itemWidth}
          onPress={() => onPressItem?.(item)}
        />
      )}
    />
  );

  return (
    <View style={{ flex: 1 }} onLayout={onLayout}>
      {areaHeight > 0 &&
        (Platform.isTV ? (
          <TVFocusGuideView style={{ height: areaHeight }} autoFocus>
            {list}
          </TVFocusGuideView>
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
