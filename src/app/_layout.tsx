import { ToastHost } from "@/components/ToastHost";
import { useAccountStore } from "@/store/account";
import { useMigrations } from "drizzle-orm/expo-sqlite/migrator";
import { SplashScreen, Stack, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { Platform, Text } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { db } from "../../db";
import migrations from "../../drizzle/migrations";

SplashScreen.preventAutoHideAsync();

export default function Layout() {
  const { success, error } = useMigrations(db, migrations);
  const hydrate = useAccountStore((state) => state.hydrate);
  const segments = useSegments();

  useEffect(() => {
    if (success || error) {
      SplashScreen.hideAsync();
    }
    if (success) hydrate();
  }, [success, error]);

  if (error) return <Text>Erro na BD: {error.message}</Text>;
  if (!success) return <Text>A preparar a base de dados…</Text>;

  return (
    <SafeAreaProvider>
      <StatusBar style="light" />

      <Stack
        screenOptions={{
          contentStyle: {
            backgroundColor: "#fff",
          },
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
      </Stack>
      <ToastHost />
    </SafeAreaProvider>
  );
}
