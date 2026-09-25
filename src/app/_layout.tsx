import { ToastHost } from "@/components/ToastHost";
import { useAccountStore } from "@/store/account";
import { useMigrations } from "drizzle-orm/expo-sqlite/migrator";
import { SplashScreen, Stack, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { Platform, Text, View, StyleSheet } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { db } from "../../db";
import migrations from "../../drizzle/migrations";

SplashScreen.preventAutoHideAsync();

export default function Layout() {
  const { success, error } = useMigrations(db, migrations);
  const hydrate = useAccountStore((state) => state.hydrate);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!success && !error) return;
    (async () => {
      try {
        if (success) await hydrate();
      } catch (e) {
        console.error("hydrate falhou", e);
      } finally {
        setReady(true);
      }
    })();
  }, [success, error, hydrate]);

  useEffect(() => {
    if (ready) SplashScreen.hideAsync().catch(() => {});
  }, [ready]);

  if (error) return <Text>Erro na BD: {error.message}</Text>;

  return (
    <>
      <StatusBar style="light" />

      <Stack
        screenOptions={{
          animation: Platform.isTV ? "none" : "default",
          headerShown: false,
        }}
      >
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="settings" options={{ headerShown: false }} />
        <Stack.Screen
          name="(browse)"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen name="(sync)" options={{ headerShown: false }} />
        <Stack.Screen
          name="player/[type]/[id]"
          options={{
            headerShown: false,
            contentStyle: { backgroundColor: "#000" },
          }}
        />
      </Stack>
      <ToastHost />
    </>
  );
}
