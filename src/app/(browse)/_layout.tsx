import { AppHeader } from "@/components/AppHeader";
import TabItem from "@/components/TabItem";
import { useFocusStore } from "@/store/focus";
import { Href, router, Stack, usePathname } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";

const TYPE_BY_TAB = {
  Tv: "/",
  Series: "/series",
  Filmes: "/movies",
} as const;

export default function Layout() {
  const pathname = usePathname();
  const setTabsHandle = useFocusStore((s) => s.setTabsHandle);
  const focusTabsNonce = useFocusStore((s) => s.focusTabsNonce);
  const setTabsHasFocus = useFocusStore((s) => s.setTabsHasFocus);
  const [forceFocus, setForceFocus] = useState(false);

  useEffect(() => {
    if (focusTabsNonce === 0) return;

    setForceFocus(true);
    const id = setTimeout(() => setForceFocus(false), 100);
    return () => clearTimeout(id);
  }, [focusTabsNonce]);

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <AppHeader title={"Stream"} />
      <SafeAreaView edges={["left", "right"]} style={styles.tabsContent}>
        <View style={styles.tabs}>
          {Object.entries(TYPE_BY_TAB).map(([tabName, tabUrl]) => {
            const isActive = pathname === tabUrl;

            return (
              <TabItem
                key={tabName}
                label={tabName}
                isActive={isActive}
                hasTVPreferredFocus={isActive && forceFocus}
                onFocus={() => setTabsHasFocus(true)}
                onBlur={() => setTabsHasFocus(false)}
                onPress={() =>
                  pathname != tabUrl && router.replace(tabUrl as Href)
                }
              />
            );
          })}
        </View>
      </SafeAreaView>

      <Stack
        screenOptions={{
          contentStyle: {
            backgroundColor: "#fff",
          },
        }}
      >
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="series" options={{ headerShown: false }} />
        <Stack.Screen name="movies" options={{ headerShown: false }} />
      </Stack>
    </SafeAreaProvider>
  );
}
const styles = StyleSheet.create({
  tabsContent: {
    padding: 8,
    backgroundColor: "#fff",
  },
  tabs: {
    flexDirection: "row",
    gap: 8,
    padding: 4,
    backgroundColor: "#F0F0F0",
    borderRadius: 12,
  },
});
