import { AppHeader } from "@/components/AppHeader";
import MediaBrowser from "@/components/MediaBrowser";
import { MediaItem } from "@/components/MediaCard";
import { SearchBar } from "@/components/SearchBar";
import TabItem from "@/components/TabItem";
import { useBackToTabs } from "@/hook/useBackToTabs";
import { useCategoryOptions } from "@/hook/useCategoryOptions";
import { useContentPaged } from "@/hook/useContent";
import { useDebounced } from "@/hook/useDebouncedt";
import { usePlayInVlc } from "@/hook/usePlayInVlc";
import { useAccountStore } from "@/store/account";
import { useFocusStore } from "@/store/focus";
import { CatalogType } from "@/store/sync";
import { MEDIA_ENTRIES } from "@/types/mediaType";
import { router } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  findNodeHandle,
  StyleSheet,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function LiveVODSeriesScreen() {
  const [type, setType] = useState<CatalogType>("live");
  const [category, setCategory] = useState<string | null>(null);
  const [searching, setSearching] = useState(false);
  const [searchText, setSearchText] = useState("");
  const debouncedSearch = useDebounced(searchText, 350);

  const setTabsHandle = useFocusStore((s) => s.setTabsHandle);
  const setTabsHasFocus = useFocusStore((s) => s.setTabsHasFocus);

  const options = useCategoryOptions(type);

  const effectiveCategory = category ?? options[0]?.value ?? null;

  const { items, loadMore, loading } = useContentPaged(
    type,
    effectiveCategory,
    searching ? debouncedSearch : undefined,
  );

  const client = useAccountStore((s) => s.client);
  const playInVlc = usePlayInVlc();

  const onTabsRef = useCallback(
    (node: View | null) => {
      setTabsHandle(node ? findNodeHandle(node) : null);
    },
    [setTabsHandle],
  );

  const onPressItem = useCallback(
    (item: MediaItem) => {
      if (type === "series") {
        router.navigate({ pathname: "/serie/[id]", params: { id: item.id } });
        return;
      }

      if (!client) return;

      const url =
        type === "movie"
          ? client.vodUrl(Number(item.id), item.ext ?? "")
          : client.liveUrl(Number(item.id));

      playInVlc(url, item.title);
    },
    [type, client, playInVlc],
  );
  const openSearch = () => {
    setSearching(true);
    setSearchText("");
  };
  const closeSearch = () => {
    setSearching(false);
    setSearchText("");
  };
  const activeTab = MEDIA_ENTRIES.find((m) => m[0] === type);

  useBackToTabs();

  return (
    <>
      <AppHeader title={activeTab?.[1].label} onSearch={openSearch} />
      <SafeAreaView
        style={styles.container}
        edges={["bottom", "left", "right"]}
      >
        <View style={styles.tabs} ref={onTabsRef}>
          {MEDIA_ENTRIES.map(([tabKey, tabValue]) => {
            return (
              <TabItem
                key={tabKey}
                label={tabValue.label}
                isActive={tabKey === type}
                hasTVPreferredFocus={tabKey === type}
                onFocus={() => setTabsHasFocus(true)}
                onBlur={() => setTabsHasFocus(false)}
                onPress={() => {
                  setType(tabKey);
                  setCategory(null);
                }}
              />
            );
          })}
        </View>
        {searching ? (
          <SearchBar
            value={searchText}
            onChange={setSearchText}
            onClose={closeSearch}
          />
        ) : null}
        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator size={30} />
          </View>
        ) : (
          <MediaBrowser
            options={options}
            value={category}
            onChange={setCategory}
            media={items}
            onPressItem={onPressItem}
            onEndReached={loadMore}
            useList={!activeTab?.[1].hasImage}
            useSelect={!searching}
          />
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
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
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
    marginBottom: 8,
  },
});
