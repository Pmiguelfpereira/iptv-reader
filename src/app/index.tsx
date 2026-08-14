import { useAccountStore } from "@/store/account";
import { Redirect } from "expo-router";
import { ActivityIndicator, View } from "react-native";

export default function HomeScreen() {
  const hydrated = useAccountStore((state) => state.hydrated);
  const account = useAccountStore((state) => state.account);

  if (!hydrated) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#000",
        }}
      >
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (account) {
    return <Redirect href="/(browse)" />;
  }

  return <Redirect href="/settings" />;
}
