import MediaBrowser from "@/components/MediaBrowser";
import { MediaItem } from "@/components/MediaCard";
import { ScreenFade } from "@/components/ScreenFade";
import { SelectOption } from "@/components/Select";
import { useSyncStore } from "@/store/sync";
import { and, eq } from "drizzle-orm";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { db } from "../../db";
import { categories, series } from "../../db/schema";

export default function Series() {
  const [category, setCategory] = useState<string | null>(null);
  const [options, setOptions] = useState<SelectOption[]>([]);
  const [mediaItem, setMediaItem] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);

  const categoryVersions = useSyncStore((s) => s.categoryVersions["series"]);
  const contentVersions = useSyncStore((s) => s.contentVersions["series"]);

  const handlePressItem = (item: MediaItem) => {
    router.navigate({
      pathname: "/serie/[id]",
      params: { id: item.id },
    });
  };

  useEffect(() => {
    let cancelled = false;
    db.select()
      .from(categories)
      .where(and(eq(categories.type, "series"), eq(categories.hidden, false)))
      .then(
        (r) =>
          !cancelled &&
          setOptions(
            (r ?? []).map((c) => ({
              label: c.name,
              value: String(c.categoryId),
            })),
          ),
      );
    return () => {
      cancelled = true;
    };
  }, [categoryVersions]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    db.select({
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
              eq(categories.hidden, false),
            )
          : and(eq(categories.type, "series"), eq(categories.hidden, false)),
      )
      .then((r) => {
        if (cancelled) return;
        setMediaItem(
          r.map((item) => ({
            id: String(item.serieId),
            title: item.name,
            poster: item.image,
          })),
        );
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [category, contentVersions]);

  return (
    <ScreenFade>
      <SafeAreaView
        style={styles.container}
        edges={["top", "bottom", "left", "right"]}
      >
        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator size={30} />
          </View>
        ) : (
          <MediaBrowser
            options={options}
            value={category}
            onChange={setCategory}
            media={mediaItem}
            onPressItem={handlePressItem}
          />
        )}
      </SafeAreaView>
    </ScreenFade>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#121212",
    padding: 8,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
