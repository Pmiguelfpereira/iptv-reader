import { AppHeader } from "@/components/AppHeader";
import { NoData } from "@/components/NoData";
import { SyncButton } from "@/components/SyncButton";
import { useAccountStore } from "@/store/account";
import { useToastStore } from "@/store/toast";
import { logger } from "@/utils/logger";
import { playInVlc } from "@/utils/vlc";
import { eq } from "drizzle-orm";
import { useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
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

  const [syncing, setSyncing] = useState(false);

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
      await playInVlc(source, item.name ?? "");
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
      setSyncing(true);
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
    } finally {
      setSyncing(false);
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

  const focusClaimed = useRef(false);

  return (
    <>
      <AppHeader title={serie?.name ?? "Loading…"} />
      <SafeAreaView
        style={styles.container}
        edges={["top", "bottom", "left", "right"]}
      >
        {(!hydrated || loading) && (
          <View style={styles.loading}>
            <ActivityIndicator size="large" color="#0A84FF" />
          </View>
        )}
        {hydrated && (
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
                onPress={getEpisodes}
                syncing={syncing}
                preferFocus
              />
            </View>
            {episodes.length > 0 ? (
              <FlatList
                data={episodes}
                keyExtractor={(item) => String(item.id)}
                contentContainerStyle={styles.content}
                renderItem={({ item, index }) => (
                  <Pressable
                    onPress={() => onSelect(item)}
                    onFocus={() => {
                      focusClaimed.current = true;
                    }}
                    style={({ focused }) => [
                      styles.row,
                      index < episodes.length - 1 && styles.itemBorder,
                      focused && styles.rowFocused,
                    ]}
                  >
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
              />
            ) : (
              <NoData />
            )}
          </Container>
        )}
      </SafeAreaView>
    </>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
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
    color: "#000",
  },
  textFocused: {
    color: "#0A84FF",
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
  syncBtn: { padding: 4 },
  syncBox: {
    padding: 10,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: "transparent",
  },
  syncBoxFocused: { backgroundColor: "#2a2a2a", borderColor: "#0A84FF" },

  loading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 20,
  },
  rowFocused: {
    backgroundColor: "rgba(79, 157, 255, 0.15)",
  },
  itemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: "#e5e5e5",
    paddingBottom: 12,
  },
});
