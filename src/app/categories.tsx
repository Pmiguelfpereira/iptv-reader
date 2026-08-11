import { Category, CategoryRow } from "@/components/CategoryRow";
import { IconButton } from "@/components/IconButton";
import { ScreenFade } from "@/components/ScreenFade";
import useCategories from "@/hook/useCategories";
import { useAccountStore } from "@/store/account";
import { CatalogType, useSyncStore } from "@/store/sync";
import { useToastStore } from "@/store/toast";
import { logger } from "@/utils/logger";
import { eq } from "drizzle-orm";
import { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  SectionList,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { db } from "../../db";
import { categories, movies, series, tv } from "../../db/schema";

type tvSchema = typeof tv.$inferInsert;
type movieSchema = typeof movies.$inferInsert;
type serieSchema = typeof series.$inferInsert;

export default function Categories() {
  const liveCategories = useCategories("live");
  const movieCategories = useCategories("movie");
  const seriesCategories = useCategories("series");

  const byType = {
    live: liveCategories,
    movie: movieCategories,
    series: seriesCategories,
  };
  const [loadingIds, setLoadingIds] = useState<Set<number>>(new Set());

  const xtreamClient = useAccountStore((state) => state.client);

  const bumpContent = useSyncStore((state) => state.bumpContent);
  const bumpCategories = useSyncStore((state) => state.bumpCategories);

  const toastShow = useToastStore((state) => state.show);

  const [expanded, setExpanded] = useState<Record<CatalogType, boolean>>({
    live: false,
    movie: false,
    series: false,
  });

  const [syncingKeys, setSyncingKeys] = useState<Set<CatalogType>>(new Set());

  const fetchAndInsert = async (item: Category) => {
    if (!xtreamClient || loadingIds.has(item.categoryId)) return;
    const catId = String(item.categoryId);
    setLoadingIds((prev) => new Set(prev).add(item.categoryId));
    try {
      switch (item.type) {
        case "live": {
          const live = await xtreamClient.getLiveStreams(catId);
          await db.transaction(async (tx) => {
            await tx.delete(tv).where(eq(tv.categoryId, item.categoryId));
            if (live?.length) {
              const data: tvSchema[] = live.map((l) => ({
                tvId: l.stream_id,
                name: l.name,
                image: l.stream_icon,
                categoryId: item.categoryId,
              }));
              await tx.insert(tv).values(data);
            }
          });
          break;
        }
        case "movie": {
          const vod = await xtreamClient.getVodStreams(catId);
          await db.transaction(async (tx) => {
            await tx
              .delete(movies)
              .where(eq(movies.categoryId, item.categoryId));
            if (vod?.length) {
              const data: movieSchema[] = vod.map((m) => ({
                movieId: m.stream_id,
                name: m.name,
                image: m.stream_icon,
                categoryId: item.categoryId,
                containerExtension: m.container_extension,
              }));
              await tx.insert(movies).values(data);
            }
          });
          break;
        }
        case "series": {
          const s = await xtreamClient.getSeries(catId);
          await db.transaction(async (tx) => {
            await tx
              .delete(series)
              .where(eq(series.categoryId, item.categoryId));
            if (s?.length) {
              const data: serieSchema[] = s.map((serie) => ({
                serieId: serie.series_id,
                name: serie.name,
                image: serie.cover,
                categoryId: item.categoryId,
              }));
              await tx.insert(series).values(data);
            }
          });
          break;
        }
      }
      toastShow(
        `Sync completed successfully. ${item.type} - ${item.categoryId}`,
        "success",
      );
    } catch (e) {
      toastShow(
        `Failed to fetch/insert ${item.type} - ${item.categoryId}`,
        "error",
      );
      logger.error("Failed to fetch/insert", item.categoryId, e);
    } finally {
      setLoadingIds((prev) => {
        const next = new Set(prev);
        next.delete(item.categoryId);
        return next;
      });
    }
  };

  const onHidden = async (item: Category) => {
    const wasHidden = item.hidden;

    byType[item.type].setHidden(item.categoryId, !wasHidden);

    await db
      .update(categories)
      .set({ hidden: !wasHidden })
      .where(eq(categories.categoryId, item.categoryId));

    if (wasHidden) {
      await fetchAndInsert(item);
      bumpContent(item.type);
      bumpCategories(item.type);
    }
  };

  const toggle = (key: CatalogType) =>
    setExpanded((p) => ({ ...p, [key]: !p[key] }));

  const onRefreshItem = async (item: Category) => {
    await fetchAndInsert(item);
    bumpContent(item.type);
  };

  const syncCategories = async (key: CatalogType) => {
    const client = useAccountStore.getState().client;
    if (!client || syncingKeys.has(key)) return;
    setSyncingKeys((prev) => new Set(prev).add(key));
    setExpanded((prev) => ({ ...prev, [key]: false }));

    try {
      const catg = await {
        live: () => client.getLiveCategories(),
        movie: () => client.getVodCategories(),
        series: () => client.getSeriesCategories(),
      }[key]();

      await db.transaction(async (tx) => {
        await tx.delete(categories).where(eq(categories.type, key));

        if (catg?.length) {
          const data = catg.map((c) => ({
            categoryId: Number(c.category_id),
            name: c.category_name,
            type: key,
          }));

          await tx.insert(categories).values(data);
        }
      });
      bumpCategories(key);
      toastShow(`Sync completed successfully. ${key}`, "success");
    } catch (e) {
      toastShow(`Failed to fetch/insert ${key}`, "error");
      logger.error("Failed to fetch/insert", key, e);
    } finally {
      setSyncingKeys((prev) => {
        const next = new Set(prev);
        next.delete(key);
        return next;
      });
    }
  };

  const sections = [
    {
      key: "live" as const,
      title: "Tv",
      data: expanded.live ? liveCategories.data : [],
    },
    {
      key: "movie" as const,
      title: "Movies",
      data: expanded.movie ? movieCategories.data : [],
    },
    {
      key: "series" as const,
      title: "Series",
      data: expanded.series ? seriesCategories.data : [],
    },
  ];
  return (
    <ScreenFade>
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
              {syncingKeys.has(section.key) ? (
                <ActivityIndicator size={30} />
              ) : (
                <IconButton
                  accessibilityLabel="Sync"
                  name="sync"
                  onPress={() => syncCategories(section.key)}
                />
              )}
            </View>
          )}
          renderItem={({ item }) => (
            <CategoryRow
              item={item}
              onHidden={onHidden}
              loading={loadingIds.has(item.categoryId)}
              refresh={onRefreshItem}
            />
          )}
          initialNumToRender={10}
          maxToRenderPerBatch={8}
          windowSize={5}
          updateCellsBatchingPeriod={50}
        />
      </SafeAreaView>
    </ScreenFade>
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
