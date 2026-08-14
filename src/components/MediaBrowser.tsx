// components/MediaBrowser.tsx
import { MediaItem } from "@/components/MediaCard";
import Select, { SelectOption } from "@/components/Select";
import { Platform, StyleSheet, TVFocusGuideView, View } from "react-native";
import MediaGrid from "./MediaGrid";
import MediaList from "./MediaList";
import { NoData } from "./NoData";

export type MediaBrowserProps = {
  options: SelectOption[];
  value: string | null;
  onChange: (value: string | null) => void;
  media: MediaItem[];
  onPressItem: (item: MediaItem) => void;
  placeholder?: string;
  useSelect?: boolean;
  useList?: boolean;
};

export default function MediaBrowser({
  options,
  value,
  onChange,
  media,
  onPressItem,
  placeholder = "Categories",
  useSelect = false,
  useList = false,
}: MediaBrowserProps) {
  const Container = Platform.isTV ? TVFocusGuideView : View;

  return (
    <Container style={styles.main}>
      {useSelect && (
        <Select
          options={options}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
        />
      )}

      <View style={{ flex: 1 }}>
        {media.length > 0 ? (
          useList ? (
            <MediaList data={media} onPressItem={onPressItem} />
          ) : (
            <MediaGrid data={media} onPressItem={onPressItem} />
          )
        ) : (
          <NoData />
        )}
      </View>
    </Container>
  );
}

const styles = StyleSheet.create({
  main: { gap: 10, flex: 1 },
});
