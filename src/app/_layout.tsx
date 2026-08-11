import { IconButton } from "@/components/IconButton";
import TabItem from "@/components/TabItem";
import { ToastHost } from "@/components/ToastHost";
import { useAccountStore } from "@/store/account";
import { useToastStore } from "@/store/toast";
import { useMigrations } from "drizzle-orm/expo-sqlite/migrator";
import { Href, router, SplashScreen, Stack, usePathname } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import {
  Platform,
  StyleSheet,
  Text,
  TVFocusGuideView,
  View,
} from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { db } from "../../db";
import migrations from "../../drizzle/migrations";

SplashScreen.preventAutoHideAsync();

const TYPE_BY_TAB: Record<string, Href> = {
  Tv: "/",
  Series: "/series",
  Filmes: "/movies",
};

export default function Layout() {
  const { success, error } = useMigrations(db, migrations);
  const pathname = usePathname();
  const hydrate = useAccountStore((state) => state.hydrate);
  const toastShow = useToastStore((state) => state.show);
  useEffect(() => {
    if (success || error) {
      SplashScreen.hideAsync();
    }
    if (success) hydrate();
  }, [success, error]);

  const hiddenHeader =
    pathname == "/settings" ||
    pathname == "/categories" ||
    pathname.startsWith("/serie/");
  if (error) return <Text>Erro na BD: {error.message}</Text>;
  if (!success) return <Text>A preparar a base de dados…</Text>;

  const Container = Platform.isTV ? TVFocusGuideView : View;

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      {!hiddenHeader && (
        <SafeAreaView edges={["top", "left", "right"]}>
          <Container style={styles.container}>
            <View style={styles.header}>
              <IconButton
                name="cloud-sync"
                accessibilityLabel="Sync"
                href="/categories"
              />
              <IconButton
                name="setting"
                accessibilityLabel="Options"
                href="/settings"
              />
            </View>
            <View style={styles.tabs}>
              {Object.entries(TYPE_BY_TAB).map(([tabName, tabUrl]) => {
                const isActive = pathname === tabUrl;

                return (
                  <TabItem
                    key={tabName}
                    label={tabName}
                    isActive={isActive}
                    onPress={() => router.replace(tabUrl)}
                  />
                );
              })}
            </View>
          </Container>
        </SafeAreaView>
      )}

      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: "#121212" },
          headerTintColor: "#fff",
          contentStyle: { backgroundColor: "#121212" },
          animation: "none",
          freezeOnBlur: true,
        }}
      >
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="settings" options={{ headerTitle: "Settings" }} />
        <Stack.Screen name="series" options={{ headerShown: false }} />
        <Stack.Screen name="movies" options={{ headerShown: false }} />
        <Stack.Screen name="serie/[id]" />
        <Stack.Screen
          name="categories"
          options={{ headerTitle: "Categories" }}
        />
      </Stack>
      <ToastHost />
    </SafeAreaProvider>
  );
}
const styles = StyleSheet.create({
  container: {
    backgroundColor: "#121212",
    padding: 8,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    paddingHorizontal: 8,
    paddingVertical: 4,
    gap: 10,
    marginBottom: 8,
  },
  tabs: {
    flexDirection: "row",
    gap: 8,
    padding: 4,
    backgroundColor: "#1e1e1e",
    borderRadius: 12,
  },
});
