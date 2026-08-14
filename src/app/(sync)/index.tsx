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
import { categories, tv } from "../../../db/schema";

type tvSchema = typeof tv.$inferInsert;

export default function LiveCategories() {
  const liveCategories = useCategories("live");
  const tabsHandle = useFocusStore((s) => s.tabsHandle);

  const [loadingIds, setLoadingIds] = useState<Set<number>>(new Set());
  const [syncing, setSyncing] = useState(false);

  const xtreamClient = useAccountStore((state) => state.client);

  const bumpContent = useSyncStore((state) => state.bumpContent);
  const bumpCategories = useSyncStore((state) => state.bumpCategories);

  const toastShow = useToastStore((state) => state.show);

  const fetchAndInsert = async (item: Category) => {
    if (!xtreamClient || loadingIds.has(item.categoryId)) return;

    const catId = String(item.categoryId);

    setLoadingIds((prev) => new Set(prev).add(item.categoryId));

    try {
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

      toastShow(
        `Sync completed successfully. live - ${item.categoryId}`,
        "success",
      );
    } catch (e) {
      toastShow(`Failed to fetch/insert live - ${item.categoryId}`, "error");

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

    liveCategories.setHidden(item.categoryId, !wasHidden);

    await db
      .update(categories)
      .set({ hidden: !wasHidden })
      .where(eq(categories.categoryId, item.categoryId));

    if (wasHidden) {
      await fetchAndInsert(item);
      bumpContent("live");
      bumpCategories("live");
    }
  };

  const onRefreshItem = async (item: Category) => {
    await fetchAndInsert(item);
    bumpContent("live");
  };

  const syncCategories = async () => {
    const client = useAccountStore.getState().client;

    if (!client || syncing) return;

    setSyncing(true);
    try {
      const catg = await client.getLiveCategories();

      await db.transaction(async (tx) => {
        await tx.delete(categories).where(eq(categories.type, "live"));

        if (catg?.length) {
          const data = catg.map((c) => ({
            categoryId: Number(c.category_id),
            name: c.category_name,
            type: "live" as const,
          }));

          await tx.insert(categories).values(data);
        }
      });

      bumpCategories("live");

      toastShow("Sync completed successfully. live", "success");
    } catch (e) {
      toastShow("Failed to fetch/insert live", "error");

      logger.error("Failed to fetch/insert live", e);
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
          {liveCategories.data.length > 0 ? (
            <FlatList
              data={liveCategories.data}
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
