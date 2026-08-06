import MediaBrowser from "@/components/MediaBrowser";
import { MediaItem } from "@/components/MediaCard";
import { SelectOption } from "@/components/Select";
import { playInVlc } from "@/utils/vlc";
import { and, eq } from "drizzle-orm";
import { useLiveQuery } from "drizzle-orm/expo-sqlite";
import { useState } from "react";
import { StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { db } from "../../db";
import { categories, series } from "../../db/schema";

export default function Series() {
  const [category, setCategory] = useState<string | null>(null);

  const handlePressItem = (item: MediaItem) => {
    try {
      playInVlc("https://iptv-org.github.io/iptv/index.m3u", item.title);
    } catch (e) {
      console.error("Error launching VLC:", e);
    }
  };
  const { data } = useLiveQuery(
    db
      .select()
      .from(categories)
      .where(and(eq(categories.type, "series"), eq(categories.hidden, false))),
  );

  const { data: dataMedia } = useLiveQuery(
    db
      .select({
        serieId: series.serieId,
        name: series.name,
        image: series.image,
      })
      .from(series)
      .innerJoin(categories, eq(series.categoryId, categories.categoryId))
      .where(
        category
          ? and(
              eq(categories.type, "series"),
              eq(categories.categoryId, Number(category)),
            )
          : eq(categories.type, "series"),
      ),
    [category],
  );
  const media: MediaItem[] = dataMedia.map((item) => ({
    id: String(item.serieId),
    title: item.name,
    poster: item.image,
    source: "https://iptv-org.github.io/iptv/index.m3u",
  }));

  const options: SelectOption[] = (data ?? []).map((c) => ({
    label: c.name,
    value: String(c.categoryId),
  }));

  return (
    <>
      <SafeAreaView
        style={styles.container}
        edges={["top", "bottom", "left", "right"]}
      >
        <MediaBrowser
          options={options}
          value={category}
          onChange={setCategory}
          media={media}
          onPressItem={handlePressItem}
        />
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#121212",
    padding: 8,
  },
});
