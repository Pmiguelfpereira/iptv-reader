import { AppHeader } from "@/components/AppHeader";
import MediaBrowser from "@/components/MediaBrowser";
import { MediaItem } from "@/components/MediaCard";
import { SearchBar } from "@/components/SearchBar";
import TabItem from "@/components/TabItem";
import { useBackToTabs } from "@/hook/useBackToTabs";
import { useCategoryOptions } from "@/hook/useCategoryOptions";
import { useContentPaged } from "@/hook/useContent";
import { useDebounced } from "@/hook/useDebouncedt";
import { useExternalPlayer } from "@/hook/useExternalPlayer";
import { usePlayInVlc } from "@/hook/usePlayInVlc";
import { useAccountStore } from "@/store/account";
import { useFocusStore } from "@/store/focus";
import { CatalogType } from "@/store/sync";
import { MEDIA_ENTRIES } from "@/types/mediaType";
import { router } from "expo-router";
import { useCallback, useRef, useState } from "react";
import {
  ActivityIndicator,
  Keyboard,
  Platform,
  StyleSheet,
  TVFocusGuideView,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function LiveVODSeriesScreen() {
  const [type, setType] = useState<CatalogType>("live");
  const [category, setCategory] = useState<string | null>(null);
  const [searching, setSearching] = useState(false);
  const [searchText, setSearchText] = useState("");
  const debouncedSearch = useDebounced(searchText, 350);
  const searchIconRef = useRef<View>(null);
  const client = useAccountStore((s) => s.client);
  const externalPlayer = useExternalPlayer();
  const playInVlc = usePlayInVlc();

  const setTabsHandle = useFocusStore((s) => s.setTabsHandle);
  const setTabsHasFocus = useFocusStore((s) => s.setTabsHasFocus);

  const options = useCategoryOptions(type);

  const effectiveCategory = category ?? options[0]?.value ?? null;

  const { items, loadMore, loading } = useContentPaged(
    type,
    effectiveCategory,
    searching ? debouncedSearch : undefined,
  );

  const resetKey = `${type}:${category}:${searchText ?? ""}`;

  const onTabsRef = useCallback(
    (node: View | null) => {
      setTabsHandle(node ?? null);
    },
    [setTabsHandle],
  );
  const onPressItem = useCallback(
    (item: MediaItem) => {
      if (type === "series") {
        router.navigate({ pathname: "/serie/[id]", params: { id: item.id } });
        return;
      }

      if (!externalPlayer) {
        router.push(`/player/${type}/${item.id}`);
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
    Keyboard.dismiss();
    setSearching(false);
    setSearchText("");
    setTimeout(() => {
      searchIconRef.current?.focus?.();
    }, 50);
  };
  const activeTab = MEDIA_ENTRIES.find((m) => m[0] === type);

  useBackToTabs();

  const Container = Platform.isTV ? TVFocusGuideView : View;

  return (
    <>
      <AppHeader title={activeTab?.[1].label} onSearch={openSearch} />
      <SafeAreaView
        style={styles.container}
        edges={["bottom", "left", "right"]}
      >
        <Container
          style={styles.tabs}
          ref={onTabsRef}
          {...(Platform.isTV && {
            autoFocus: true,
          })}
        >
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
        </Container>
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
            loading={loading}
            resetKey={resetKey}
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
