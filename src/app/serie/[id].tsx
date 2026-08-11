import { useAccountStore } from "@/store/account";
import { useToastStore } from "@/store/toast";
import { logger } from "@/utils/logger";
import { playInVlc } from "@/utils/vlc";
import AntDesign from "@react-native-vector-icons/ant-design/static";
import { eq } from "drizzle-orm";
import { Stack, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TVFocusGuideView,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { db } from "../../../db";
import { serieEpisode, series } from "../../../db/schema";

type serieEpisodeSchema = typeof serieEpisode.$inferInsert;
type SerieRow = typeof series.$inferSelect;
type EpisodeRow = typeof serieEpisode.$inferSelect;
type EpisodeInsert = typeof serieEpisode.$inferInsert;

export default function Series() {
  const { id } = useLocalSearchParams<{ id: string }>();

  const toastShow = useToastStore((state) => state.show);

  const xtreamClient = useAccountStore((state) => state.client);

  const hydrated = useAccountStore((state) => state.hydrated);

  const [serie, setSerie] = useState<SerieRow | null>(null);

  const [episodes, setEpisodes] = useState<EpisodeRow[]>([]);

  const [loading, setLoading] = useState(true);

  const loadSerie = useCallback(async () => {
    await db
      .select()
      .from(series)
      .where(eq(series.serieId, Number(id)))
      .limit(1)
      .then((r) => setSerie(r[0] ?? null));
  }, [id]);

  const loadEpisodes = useCallback(async () => {
    const rows = await db
      .select()
      .from(serieEpisode)
      .where(eq(serieEpisode.serieId, Number(id)))
      .then((r) => {
        setEpisodes(r);
      });
  }, [id]);

  const Container = Platform.isTV ? TVFocusGuideView : View;

  const onSelect = async (item: serieEpisodeSchema) => {
    const source = xtreamClient?.seriesUrl(
      item.episodeId,
      item.containerExtension ?? "",
    );
    if (!source) return;
    try {
      playInVlc(source, item.name ?? "");
      await db
        .update(serieEpisode)
        .set({ watched: true })
        .where(eq(serieEpisode.episodeId, item.episodeId));

      setEpisodes((prev) =>
        prev.map((e) =>
          e.episodeId === item.episodeId ? { ...e, watched: true } : e,
        ),
      );
    } catch (e) {
      logger.error("Error launching VLC", e);
      toastShow("Error launching VLC", "error");
    }
  };

  const getEpisodes = async () => {
    try {
      const resultEpisodes = await xtreamClient?.getSeriesInfo(Number(id));
      const rows: EpisodeInsert[] = Object.values(
        resultEpisodes?.episodes ?? {},
      )
        .flat()
        .map((ep) => ({
          serieId: Number(id),
          episodeId: Number(ep.id),
          seasonNumber: Number(ep.season),
          episodeNum: Number(ep.episode_num),
          name: ep.title,
          containerExtension: ep.container_extension,
        }));

      logger.debug("Sync episodes: inserting", rows.length);

      if (rows.length) {
        await db.transaction(async (tx) => {
          await tx
            .delete(serieEpisode)
            .where(eq(serieEpisode.serieId, Number(id)));
          await tx.insert(serieEpisode).values(rows);
        });
      }

      await loadEpisodes();
      toastShow(`Sync completed: ${rows.length} episodes.`, "success");
    } catch (error) {
      logger.error("Sync episodes failed", error);
      toastShow(
        `Sync failed: ${error instanceof Error ? error.message : "Unknown error"}`,
        "error",
      );
    }
  };

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        await Promise.all([loadSerie(), loadEpisodes()]);
      } catch (e) {
        logger.error("Failed to load serie", e);
        toastShow("Failed to load episodes.", "error");
      } finally {
        setLoading(false);
      }
    })();
  }, [loadSerie, loadEpisodes, toastShow]);

  return (
    <>
      <Stack.Screen options={{ title: serie?.name ?? "Loading…" }} />
      <SafeAreaView
        style={styles.container}
        edges={["bottom", "left", "right"]}
      >
        {(!hydrated || loading) && <ActivityIndicator />}{" "}
        {hydrated && (
          <Container style={styles.main}>
            <View style={styles.header}>
              <Pressable onPress={getEpisodes} hitSlop={8}>
                {({ focused }) => (
                  <AntDesign
                    name={"sync"}
                    color={focused ? "#4f9dff" : "#FFF"}
                    size={20}
                  />
                )}
              </Pressable>
            </View>
            <FlatList
              data={episodes}
              keyExtractor={(item) => String(item.id)}
              contentContainerStyle={styles.content}
              renderItem={({ item, index }) => (
                <Pressable onPress={() => onSelect?.(item)}>
                  {({ focused }) => (
                    <Text
                      style={[
                        styles.text,
                        item.watched && styles.textWatched,
                        focused && styles.textFocused,
                      ]}
                    >
                      {item.name}
                    </Text>
                  )}
                </Pressable>
              )}
              ListEmptyComponent={
                <View style={styles.empty}>
                  <Text style={styles.emptyText}>No Data</Text>
                </View>
              }
            />
          </Container>
        )}
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
  main: {
    flex: 1,
  },
  content: {
    gap: 20,
  },
  header: {
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  text: {
    fontSize: 18,
    color: "#d1d1d6",
  },
  textFocused: {
    color: "#0A84FF",
    fontWeight: "700",
  },
  empty: {
    padding: 24,
  },
  emptyText: {
    color: "#8e8e93",
  },
  textWatched: {
    color: "#5a5a5e",
  },
});
