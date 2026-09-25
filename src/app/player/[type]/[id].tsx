import { useMedia } from "@/hook/useMedia";
import { useAccountStore } from "@/store/account";
import { CatalogType } from "@/store/sync";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useRef } from "react";
import { BackHandler, StatusBar, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Video, { OnVideoErrorData, VideoRef } from "react-native-video";

const CONTROLS_STYLES = { hideSeekBar: true };

const HEADERS = { "User-Agent": "VLC/3.0.20 LibVLC/3.0.20" };
const BUFFER_CONFIG = {
  minBufferMs: 5000,
  maxBufferMs: 20000,
  bufferForPlaybackMs: 1500,
  bufferForPlaybackAfterRebufferMs: 3000,
};

export default function PlayerScreen() {
  const { type, id } = useLocalSearchParams<{
    type: CatalogType;
    id: string;
  }>();

  const videoRef = useRef<VideoRef>(null);

  const client = useAccountStore((s) => s.client);
  const router = useRouter();
  const media = useMedia(type, id);

  useEffect(() => {
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      router.back();
      return true;
    });
    return () => sub.remove();
  }, [router]);

  const handleError = useCallback(
    (error: OnVideoErrorData) => {
      console.log(error);
    },
    [media],
  );

  const source = useMemo(() => {
    if (!client || !media) return null;

    const url =
      type === "movie"
        ? client.vodUrl(Number(media.id), media.ext ?? "")
        : type === "series"
          ? client.seriesUrl(Number(media.id), media.ext ?? "")
          : client.liveUrl(Number(media.id));

    return { uri: url, headers: HEADERS };
  }, [client, media, type]);

  if (!source) return null;

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ contentStyle: { backgroundColor: "#000" } }} />
      <StatusBar hidden />
      <Video
        ref={videoRef}
        source={source}
        resizeMode="contain"
        style={styles.backgroundVideo}
        controls
        onError={handleError}
        controlsStyles={CONTROLS_STYLES}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  backgroundVideo: {
    flex: 1,
  },
});
