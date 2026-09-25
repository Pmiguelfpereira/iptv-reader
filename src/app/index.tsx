import { useAccountStore } from "@/store/account";
import { Redirect } from "expo-router";
import { ActivityIndicator, View } from "react-native";

export default function HomeScreen() {
  const hydrated = useAccountStore((state) => state.hydrated);
  const account = useAccountStore((state) => state.account);

  if (!hydrated) {
    return <View style={{ flex: 1, backgroundColor: "#121212" }} />;
  }
  return <Redirect href={account ? "/(browse)" : "/settings"} />;
}
