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
import { FlashList } from "@shopify/flash-list";
import { useCallback, useState } from "react";
import {
  findNodeHandle,
  Platform,
  StyleSheet,
  TVFocusGuideView,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function SyncCategories() {
  const [type, setType] = useState<CatalogType>("live");
  const setTabsHandle = useFocusStore((s) => s.setTabsHandle);
  const setTabsHasFocus = useFocusStore((s) => s.setTabsHasFocus);

  const tabsHandle = useFocusStore((s) => s.tabsHandle);

  const taskSyncing = useSyncQueue((s) => s.running);
  const { data, setHidden } = useCategories(type);

  const { onRowPress, onRowLongPress, syncCategories } = useCategorySync(
    type,
    setHidden,
  );

  const Container = Platform.isTV ? TVFocusGuideView : View;

  const onTabsRef = useCallback(
    (node: View | null) => {
      setTabsHandle(node ? findNodeHandle(node) : null);
    },
    [setTabsHandle],
  );

  useBackToTabs();

  return (
    <>
      <AppHeader title={"Sync"} />
      <SafeAreaView
        edges={["bottom", "left", "right"]}
        style={styles.container}
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
                onPress={() => setType(tabKey)}
                disabled={taskSyncing.size > 0}
              />
            );
          })}
        </View>
        <Container
          style={styles.main}
          {...(Platform.isTV && {
            autoFocus: true,
            trapFocusLeft: true,
            trapFocusRight: true,
          })}
        >
          <View style={styles.header}>
            <SyncButton
              label="Sync"
              onPress={syncCategories}
              syncing={taskSyncing.has(`${type}:cats`)}
              preferFocus
              nextFocusUp={tabsHandle ?? undefined}
            />
          </View>
          <FlashList
            data={data}
            keyExtractor={(item) => String(item.categoryId)}
            renderItem={({ item, index }) => (
              <CategoryRow
                item={item}
                onPress={onRowPress}
                onLongPress={onRowLongPress}
                nextFocusUp={
                  index === 0 ? (tabsHandle ?? undefined) : undefined
                }
              />
            )}
            maxItemsInRecyclePool={10}
            ListEmptyComponent={<NoData />}
            onEndReachedThreshold={0.5}
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
    justifyContent: "flex-end",
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
});
