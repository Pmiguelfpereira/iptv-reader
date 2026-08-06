// components/MediaBrowser.tsx
import { MediaItem } from "@/components/MediaCard";
import MediaGrid from "@/components/MediaGrid";
import Select, { SelectOption } from "@/components/Select";
import {
  Platform,
  StyleSheet,
  Text,
  TVFocusGuideView,
  View,
} from "react-native";

export type MediaBrowserProps = {
  options: SelectOption[];
  value: string | null;
  onChange: (value: string | null) => void;
  media: MediaItem[];
  onPressItem: (item: MediaItem) => void;
  placeholder?: string;
};

export default function MediaBrowser({
  options,
  value,
  onChange,
  media,
  onPressItem,
  placeholder = "Categories",
}: MediaBrowserProps) {
  const Container = Platform.isTV ? TVFocusGuideView : View;

  return (
    <Container style={styles.main}>
      <Select
        options={options}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
      />
      <View style={{ flex: 1 }}>
        {media.length > 0 ? (
          <MediaGrid data={media} onPressItem={onPressItem} />
        ) : (
          <View style={styles.noData}>
            <Text style={styles.noDataText}>No media available</Text>
          </View>
        )}
      </View>
    </Container>
  );
}

const styles = StyleSheet.create({
  main: { gap: 10, flex: 1 },
  noData: { flex: 1, justifyContent: "center", alignItems: "center" },
  noDataText: { color: "#fff", fontSize: 18 },
});
