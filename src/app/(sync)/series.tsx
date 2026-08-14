import { Category, CategoryRow } from "@/components/CategoryRow";
import { NoData } from "@/components/NoData";
import { ScreenFade } from "@/components/ScreenFade";
import { SyncButton } from "@/components/SyncButton";
import { useBackToTabs } from "@/hook/useBackToTabs";
import useCategories from "@/hook/useCategories";
import { useAccountStore } from "@/store/account";
import { useFocusStore } from "@/store/focus";
import { useSyncStore } from "@/store/sync";
import { useToastStore } from "@/store/toast";
import { logger } from "@/utils/logger";
import { eq } from "drizzle-orm";
import { useState } from "react";
import {
  FlatList,
  Platform,
  StyleSheet,
  TVFocusGuideView,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { db } from "../../../db";
import { categories, series } from "../../../db/schema";

type serieSchema = typeof series.$inferInsert;

export default function SeriesCategories() {
  const seriesCategories = useCategories("series");
  const tabsHandle = useFocusStore((s) => s.tabsHandle);

  const [loadingIds, setLoadingIds] = useState<Set<number>>(new Set());
  const [expanded, setExpanded] = useState(false);
  const [syncing, setSyncing] = useState(false);

  const xtreamClient = useAccountStore((state) => state.client);

  const bumpContent = useSyncStore((state) => state.bumpContent);
  const bumpCategories = useSyncStore((state) => state.bumpCategories);

  const toastShow = useToastStore((state) => state.show);

  const fetchAndInsert = async (item: any) => {
    if (!xtreamClient || loadingIds.has(item.categoryId)) return;

    const catId = String(item.categoryId);

    setLoadingIds((prev) => new Set(prev).add(item.categoryId));

    try {
      const s = await xtreamClient.getSeries(catId);

      await db.transaction(async (tx) => {
        await tx.delete(series).where(eq(series.categoryId, item.categoryId));

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

      toastShow(
        `Sync completed successfully. series - ${item.categoryId}`,
        "success",
      );
    } catch (e) {
      toastShow(`Failed to fetch/insert series - ${item.categoryId}`, "error");

      logger.error("Failed to fetch/insert", item.categoryId, e);
    } finally {
      setLoadingIds((prev) => {
        const next = new Set(prev);
        next.delete(item.categoryId);
        return next;
      });
    }
  };

  const onHidden = async (item: any) => {
    const wasHidden = item.hidden;

    seriesCategories.setHidden(item.categoryId, !wasHidden);

    await db
      .update(categories)
      .set({ hidden: !wasHidden })
      .where(eq(categories.categoryId, item.categoryId));

    if (wasHidden) {
      await fetchAndInsert(item);
      bumpContent("series");
      bumpCategories("series");
    }
  };

  const onRefreshItem = async (item: any) => {
    await fetchAndInsert(item);
    bumpContent("series");
  };

  const syncCategories = async () => {
    const client = useAccountStore.getState().client;

    if (!client || syncing) return;

    setSyncing(true);
    setExpanded(false);

    try {
      const catg = await client.getSeriesCategories();

      await db.transaction(async (tx) => {
        await tx.delete(categories).where(eq(categories.type, "series"));

        if (catg?.length) {
          const data = catg.map((c) => ({
            categoryId: Number(c.category_id),
            name: c.category_name,
            type: "series" as const,
          }));

          await tx.insert(categories).values(data);
        }
      });

      bumpCategories("series");

      toastShow("Sync completed successfully. series", "success");
    } catch (e) {
      toastShow("Failed to fetch/insert series", "error");

      logger.error("Failed to fetch/insert series", e);
    } finally {
      setSyncing(false);
    }
  };

  const Container = Platform.isTV ? TVFocusGuideView : View;

  const onRowPress = (item: Category) => {
    if (item.hidden) {
      onHidden(item);
    } else {
      onRefreshItem(item);
    }
  };

  useBackToTabs();

  return (
    <ScreenFade>
      <SafeAreaView
        edges={["bottom", "left", "right"]}
        style={styles.container}
      >
        <Container
          style={styles.main}
          {...(Platform.isTV && {
            autoFocus: true,
            trapFocusLeft: true,
            trapFocusRight: true,
          })}
        >
          <View style={styles.header}>
            <SyncButton
              label="Sync"
              onPress={syncCategories}
              syncing={syncing}
              preferFocus
              nextFocusUp={tabsHandle ?? undefined}
            />
          </View>
          {seriesCategories.data.length > 0 ? (
            <FlatList
              data={seriesCategories.data}
              keyExtractor={(item) => String(item.categoryId)}
              renderItem={({ item, index }) => (
                <CategoryRow
                  item={item}
                  onPress={onRowPress}
                  loading={loadingIds.has(item.categoryId)}
                  nextFocusUp={
                    index === 0 ? (tabsHandle ?? undefined) : undefined
                  }
                />
              )}
              initialNumToRender={10}
              maxToRenderPerBatch={8}
              windowSize={5}
              removeClippedSubviews={Platform.isTV}
            />
          ) : (
            <NoData />
          )}
        </Container>
      </SafeAreaView>
    </ScreenFade>
  );
}

const styles = StyleSheet.create({
  main: {
    flex: 1,
  },
  header: {
    display: "flex",
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  container: {
    padding: 8,
    flex: 1,
    backgroundColor: "#fff",
  },
});
