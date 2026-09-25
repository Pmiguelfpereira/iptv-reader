import { IconButton } from "@/components/IconButton";
import { Icon } from "expo-router";
import {
  Platform,
  StyleSheet,
  Text,
  TVFocusGuideView,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const Container = Platform.isTV ? TVFocusGuideView : View;

export function AppHeader({
  title,
  onSearch,
  searchRef,
}: {
  title?: string;
  onSearch?: () => void;
  searchRef?: React.RefObject<View>;
}) {
  return (
    <SafeAreaView edges={["top", "left", "right"]} style={styles.safe}>
      <Container
        style={styles.header}
        {...(Platform.isTV && {
          trapFocusLeft: true,
          trapFocusRight: true,
        })}
      >
        <View style={styles.left}>
          <Text style={styles.title}>{title}</Text>
        </View>

        <View style={styles.actions}>
          <IconButton
            name="play-square"
            accessibilityLabel="Stream"
            href={"/(browse)"}
          />
          <IconButton
            name="cloud-sync"
            accessibilityLabel="Sync"
            href="/(sync)"
          />
          <IconButton
            name="setting"
            accessibilityLabel="Settings"
            href="/settings"
          />
          {onSearch && (
            <IconButton
              name="search"
              onPress={onSearch}
              accessibilityLabel="Search"
              ref={searchRef}
            />
          )}
        </View>
      </Container>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { backgroundColor: "#fff" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  left: { flexDirection: "row", alignItems: "center", gap: 8 },
  title: { fontSize: 18, fontWeight: "600" },
  actions: { flexDirection: "row", gap: 10 },
});
