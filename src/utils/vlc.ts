import * as IntentLauncher from "expo-intent-launcher";
import { Platform } from "react-native";

let isLaunching = false;

export async function playInVlc(url: string, title: string) {
  if (Platform.OS !== "android") return;
  if (isLaunching) return;

  const mime = url.includes(".m3u8") ? "application/x-mpegURL" : "video/*";

  try {
    isLaunching = true;
    await IntentLauncher.startActivityAsync("android.intent.action.VIEW", {
      data: url,
      type: mime,
      packageName: "org.videolan.vlc",
      flags: 268435456,
      extra: { title, from_start: false },
    });
  } catch (e) {
    await IntentLauncher.startActivityAsync("android.intent.action.VIEW", {
      data: url,
      type: mime,
      flags: 268435456,
    });
  } finally {
    isLaunching = false;
  }
}
