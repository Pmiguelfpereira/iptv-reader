import { AppHeader } from "@/components/AppHeader";
import { CategoryRow } from "@/components/CategoryRow";
import { NoData } from "@/components/NoData";
import { SyncButton } from "@/components/SyncButton";
import TabItem from "@/components/TabItem";
import { useBackToTabs } from "@/hook/useBackToTabs";
import useCategories from "@/hook/useCategories";
import { useCategorySync } from "@/hook/useCategorySync";
import { useFocusStore } from "@/store/focus";
import { CatalogType } from "@/store/sync";
import { useSyncQueue } from "@/store/syncQueue";
import { MEDIA, MEDIA_ENTRIES } from "@/types/mediaType";
import { FlashList, FlashListRef } from "@shopify/flash-list";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  findNodeHandle,
  Platform,
  Pressable,
  StyleSheet,
  Switch,
  Text,
  TVFocusGuideView,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function SyncCategories() {
  const [type, setType] = useState<CatalogType>("live");
  const setTabsHandle = useFocusStore((s) => s.setTabsHandle);
  const setTabsHasFocus = useFocusStore((s) => s.setTabsHasFocus);

  const tabsHandle = useFocusStore((s) => s.tabsHandle);
  const tabsFocusHandle = tabsHandle ? findNodeHandle(tabsHandle) : undefined;

  const taskSyncing = useSyncQueue((s) => s.running);
  const { data, setHidden, viewSync, toggleSwitch } = useCategories(type);

  const resetKey = `${type}:${toggleSwitch}`;

  const { onRowPress, onRowLongPress, syncCategories } = useCategorySync(
    type,
    setHidden,
  );

  const Container = Platform.isTV ? TVFocusGuideView : View;

  const onTabsRef = useCallback(
    (node: View | null) => {
      setTabsHandle(node ?? null);
    },
    [setTabsHandle],
  );

  useBackToTabs();
  const flashListRef = useRef<
    FlashListRef<{
      id: number;
      categoryId: number;
      name: string;
      type: "live" | "movie" | "series";
      hidden: boolean;
    }>
  >(null);

  useEffect(() => {
    if (!data?.length) return;

    const timeout = setTimeout(() => {
      flashListRef.current?.scrollToOffset({
        offset: 0,
        animated: false,
      });
    }, 0);

    return () => clearTimeout(timeout);
  }, [resetKey]);

  return (
    <>
      <AppHeader title={"Sync"} />
      <SafeAreaView
        edges={["bottom", "left", "right"]}
        style={styles.container}
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
                onPress={() => setType(tabKey)}
                disabled={taskSyncing.size > 0}
              />
            );
          })}
        </Container>
        <Container
          style={styles.main}
          {...(Platform.isTV && {
            autoFocus: true,
            trapFocusLeft: true,
            trapFocusRight: true,
          })}
        >
          <Container
            style={styles.header}
            {...(Platform.isTV && {
              autoFocus: true,
            })}
          >
            <Container
              style={styles.switchContainer}
              {...(Platform.isTV && {
                autoFocus: true,
              })}
            >
              <Pressable
                onPress={toggleSwitch}
                style={({ focused }) => [
                  styles.switchWrap,
                  Platform.isTV && focused && styles.switchWrapFocused,
                ]}
              >
                <Text style={styles.switchLabel}>Only Sync</Text>
                <Switch
                  value={viewSync}
                  onValueChange={toggleSwitch}
                  pointerEvents="none"
                />
              </Pressable>
            </Container>

            <SyncButton
              label="Sync"
              onPress={syncCategories}
              syncing={taskSyncing.has(`${type}:cats`)}
              preferFocus
              nextFocusUp={tabsFocusHandle ?? undefined}
            />
          </Container>

          <FlashList
            ref={flashListRef}
            data={data}
            keyExtractor={(item) => String(item.categoryId)}
            renderItem={({ item, index }) => (
              <CategoryRow
                item={item}
                onPress={onRowPress}
                onLongPress={onRowLongPress}
                nextFocusUp={
                  index === 0 ? (tabsFocusHandle ?? undefined) : undefined
                }
              />
            )}
            maxItemsInRecyclePool={10}
            ListEmptyComponent={<NoData />}
            onEndReachedThreshold={0.5}
            maintainVisibleContentPosition={{
              disabled: true,
            }}
          />
        </Container>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  main: {
    flex: 1,
  },
  header: {
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  container: {
    padding: 8,
    flex: 1,
    backgroundColor: "#fff",
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
  switchContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    fontSize: 12,
    fontWeight: "600",
  },
  switchWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 8,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: "transparent",
  },
  switchWrapFocused: {
    borderColor: "#4f9dff",
  },
  switchLabel: { fontSize: 15, color: "#1a1a18" },
});
