import { Category, CategoryRow } from "@/components/CategoryRow";
import { useAccountStore } from "@/store/account";
import { eq } from "drizzle-orm";
import { useLiveQuery } from "drizzle-orm/expo-sqlite";
import { useState } from "react";
import { Pressable, SectionList, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { db } from "../../db";
import { categories, movies, series, tv } from "../../db/schema";

type tvSchema = typeof tv.$inferInsert;
type movieSchema = typeof movies.$inferInsert;
type serieSchema = typeof series.$inferInsert;
type SectionKey = "live" | "movie" | "series";

export default function Categories() {
  const xtreamClient = useAccountStore((state) => state.client);
  const [expanded, setExpanded] = useState<Record<SectionKey, boolean>>({
    live: false,
    movie: false,
    series: false,
  });

  const { data: dataTv } = useLiveQuery(
    db.select().from(categories).where(eq(categories.type, "live")),
  );
  const { data: dataMovies } = useLiveQuery(
    db.select().from(categories).where(eq(categories.type, "movie")),
  );
  const { data: dataSeries } = useLiveQuery(
    db.select().from(categories).where(eq(categories.type, "series")),
  );

  const fetchAndInsert = async (item: Category) => {
    if (!xtreamClient) return;
    const catId = String(item.categoryId);

    switch (item.type) {
      case "live": {
        await db.delete(tv).where(eq(tv.categoryId, item.categoryId));
        const live = await xtreamClient.getLiveStreams(catId);
        if (live?.length) {
          const data: tvSchema[] = live.map((l) => ({
            tvId: l.stream_id,
            name: l.name,
            image: l.stream_icon,
            categoryId: item.categoryId,
          }));
          await db.insert(tv).values(data);
        }
        break;
      }
      case "movie": {
        await db.delete(movies).where(eq(movies.categoryId, item.categoryId));
        const vod = await xtreamClient.getVodStreams(catId);
        if (vod?.length) {
          const data: movieSchema[] = vod.map((m) => ({
            movieId: m.stream_id,
            name: m.name,
            image: m.stream_icon,
            categoryId: item.categoryId,
            containerExtension: m.container_extension,
          }));
          await db.insert(movies).values(data);
        }
        break;
      }
      case "series": {
        await db.delete(series).where(eq(series.categoryId, item.categoryId));
        const s = await xtreamClient.getSeries(catId);
        if (s?.length) {
          const data: serieSchema[] = s.map((serie) => ({
            serieId: serie.series_id,
            name: serie.name,
            image: serie.cover,
            categoryId: item.categoryId,
          }));
          await db.insert(series).values(data);
        }
        break;
      }
    }
  };

  const onHidden = async (item: Category) => {
    try {
      if (item.hidden) {
        await fetchAndInsert(item);
      }
      await db
        .update(categories)
        .set({ hidden: !item.hidden })
        .where(eq(categories.categoryId, item.categoryId));
    } catch (e) {
      console.error("Failed to toggle category", item.categoryId, e);
    }
  };
  const toggle = (key: SectionKey) =>
    setExpanded((p) => ({ ...p, [key]: !p[key] }));

  const sections = [
    { key: "live" as const, title: "Tv", data: expanded.live ? dataTv : [] },
    {
      key: "movie" as const,
      title: "Movies",
      data: expanded.movie ? dataMovies : [],
    },
    {
      key: "series" as const,
      title: "Series",
      data: expanded.series ? dataSeries : [],
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <SectionList
        sections={sections}
        keyExtractor={(item) => String(item.categoryId)}
        renderSectionHeader={({ section }) => (
          <View style={styles.header}>
            <Pressable
              onPress={() => toggle(section.key)}
              style={[styles.headerMain]}
              hitSlop={8}
            >
              {({ pressed, focused }) => (
                <Text
                  style={[
                    styles.title,
                    (pressed || focused) && styles.titleActive,
                  ]}
                  numberOfLines={1}
                >
                  {section.title}
                </Text>
              )}
            </Pressable>
          </View>
        )}
        renderItem={({ item }) => (
          <CategoryRow item={item} onHidden={onHidden} />
        )}
        stickySectionHeadersEnabled
        initialNumToRender={12}
        maxToRenderPerBatch={12}
        windowSize={7}
        removeClippedSubviews
      />
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  container: {
    padding: 8,
    flex: 1,
    backgroundColor: "#121212",
  },
  text: {
    color: "#FFFFFF",
  },
  titleActive: {
    color: "#4f9dff",
  },
  header: {
    backgroundColor: "#2f2f2f",
    borderRadius: 12,
    marginTop: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    zIndex: 1,
  },
  headerMain: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },

  title: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "600",
    flexShrink: 1,
  },
});
