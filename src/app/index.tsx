import MediaBrowser from "@/components/MediaBrowser";
import { MediaItem } from "@/components/MediaCard";
import { SelectOption } from "@/components/Select";
import { useAccountStore } from "@/store/account";
import { playInVlc } from "@/utils/vlc";
import { and, eq } from "drizzle-orm";
import { useLiveQuery } from "drizzle-orm/expo-sqlite";
import { useState } from "react";
import { StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { db } from "../../db";
import { categories, tv } from "../../db/schema";

export default function HomeScreen() {
  const [category, setCategory] = useState<string | null>(null);
  const xtreamClient = useAccountStore((state) => state.client);

  const handlePressItem = (item: MediaItem) => {
    try {
      playInVlc(item.source, item.title);
    } catch (e) {
      console.error("Error launching VLC:", e);
    }
  };
  const { data } = useLiveQuery(
    db
      .select()
      .from(categories)
      .where(and(eq(categories.type, "live"), eq(categories.hidden, false))),
  );

  const { data: dataMedia } = useLiveQuery(
    db
      .select({
        tvId: tv.tvId,
        name: tv.name,
        image: tv.image,
      })
      .from(tv)
      .innerJoin(categories, eq(tv.categoryId, categories.categoryId))
      .where(
        category
          ? and(
              eq(categories.type, "live"),
              eq(categories.categoryId, Number(category)),
            )
          : eq(categories.type, "live"),
      ),
    [category],
  );
  const media: MediaItem[] = dataMedia.map((item) => ({
    id: String(item.tvId),
    title: item.name,
    poster: item.image,
    source: xtreamClient ? xtreamClient?.liveUrl(item.tvId) : "",
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
