import * as IntentLauncher from "expo-intent-launcher";
import { Alert, Platform } from "react-native";

// a promise é o lock — espelha o estado interno do módulo
let pending: Promise<unknown> | null = null;

export function playInVlc(url: string, title: string): void {
  if (Platform.OS !== "android") return;
  if (pending) return;

  const mime = url.includes(".m3u8") ? "application/x-mpegURL" : "video/*";
  const base = { data: url, type: mime }; // sem FLAG_NEW_TASK

  pending = IntentLauncher.startActivityAsync("android.intent.action.VIEW", {
    ...base,
    packageName: "org.videolan.vlc",
    extra: { title, from_start: false },
  })
    .catch((e: any) => {
      // só vale a pena tentar o chooser se o VLC não resolveu;
      // se for ALREADY_STARTED, a segunda chamada falha igual
      if (e?.code === "E_ACTIVITY_ALREADY_STARTED") {
        Alert.alert("[vlc]", e?.code, e?.message);
      }
      return IntentLauncher.startActivityAsync(
        "android.intent.action.VIEW",
        base,
      );
    })
    .catch((e: any) => {
      Alert.alert("[vlc]", e?.code, e?.message);
    })
    .finally(() => {
      pending = null;
    });
}
