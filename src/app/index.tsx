import MediaBrowser from "@/components/MediaBrowser";
import { MediaItem } from "@/components/MediaCard";
import { ScreenFade } from "@/components/ScreenFade";
import { SelectOption } from "@/components/Select";
import { usePlayInVlc } from "@/hook/usePlayInVlc";
import { useAccountStore } from "@/store/account";
import { useSyncStore } from "@/store/sync";
import { and, eq } from "drizzle-orm";
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { db } from "../../db";
import { categories, tv } from "../../db/schema";

export default function HomeScreen() {
  const [category, setCategory] = useState<string | null>(null);
  const [options, setOptions] = useState<SelectOption[]>([]);
  const [mediaItem, setMediaItem] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);

  const xtreamClient = useAccountStore((state) => state.client);

  const categoryVersions = useSyncStore((s) => s.categoryVersions["live"]);
  const contentVersions = useSyncStore((s) => s.contentVersions["live"]);

  const playInVlc = usePlayInVlc();

  const handlePressItem = useCallback(
    (item: MediaItem) => {
      if (!xtreamClient) return;
      playInVlc(xtreamClient.liveUrl(Number(item.id)), item.title);
    },
    [xtreamClient, playInVlc],
  );

  useEffect(() => {
    let cancelled = false;
    db.select()
      .from(categories)
      .where(and(eq(categories.type, "live"), eq(categories.hidden, false)))
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
              eq(categories.hidden, false),
            )
          : and(eq(categories.type, "live"), eq(categories.hidden, false)),
      )
      .then((r) => {
        if (cancelled) return;
        setMediaItem(
          r.map((item) => ({
            id: String(item.tvId),
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
            <ActivityIndicator />
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
