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
import { categories, movies } from "../../db/schema";

export default function Movies() {
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
      .where(and(eq(categories.type, "movie"), eq(categories.hidden, false))),
  );

  const { data: dataMedia } = useLiveQuery(
    db
      .select({
        movieId: movies.movieId,
        name: movies.name,
        image: movies.image,
        ext: movies.containerExtension,
      })
      .from(movies)
      .innerJoin(categories, eq(movies.categoryId, categories.categoryId))
      .where(
        category
          ? and(
              eq(categories.type, "movie"),
              eq(categories.categoryId, Number(category)),
            )
          : eq(categories.type, "movie"),
      ),
    [category],
  );
  const media: MediaItem[] = dataMedia.map((item) => ({
    id: String(item.movieId),
    title: item.name,
    poster: item.image,
    source: xtreamClient
      ? xtreamClient?.vodUrl(item.movieId, item.ext ?? "")
      : "",
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
