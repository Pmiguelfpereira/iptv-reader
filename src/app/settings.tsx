import Field from "@/components/Field";
import { useAccountStore } from "@/store/account";
import { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { db } from "../../db";
import { account, categories, movies, series, tv } from "../../db/schema";

export default function Settings() {
  const [url, setUrl] = useState(process.env.EXPO_PUBLIC_XTREAM_URL ?? "");
  const [username, setUsername] = useState(
    process.env.EXPO_PUBLIC_XTREAM_USERNAME ?? "",
  );
  const [password, setPassword] = useState(
    process.env.EXPO_PUBLIC_XTREAM_PASSWORD ?? "",
  );
  const hydrated = useAccountStore((state) => state.hydrated);
  const setAccount = useAccountStore((state) => state.setAccount);
  const xtreamClient = useAccountStore((state) => state.client);
  const [saving, setSaving] = useState(false);

  const canSave =
    url.trim() !== "" && username.trim() !== "" && password !== "";

  const handleSave = async () => {
    setSaving(true);
    try {
      const accountData = await db.transaction(async (tx) => {
        await tx.delete(account);
        await tx.delete(series);
        await tx.delete(tv);
        await tx.delete(categories);
        await tx.delete(movies);

        const [data] = await tx
          .insert(account)
          .values({ url, username, password })
          .returning({
            id: account.id,
            url: account.url,
            username: account.username,
            password: account.password,
            status: account.status,
          });

        return data;
      });

      if (accountData) {
        setAccount(accountData);
      }
      if (xtreamClient) {
        const [live, vod, series] = await Promise.all([
          xtreamClient.getLiveCategories(),
          xtreamClient.getVodCategories(),
          xtreamClient.getSeriesCategories(),
        ]);

        if (live) {
          const tvCatgData = live.map((catg) => {
            return {
              categoryId: Number(catg.category_id),
              name: catg.category_name,
              type: "live" as const,
            };
          });

          await db.insert(categories).values(tvCatgData);
        }
        if (vod) {
          const tvCatgData = vod.map((catg) => {
            return {
              categoryId: Number(catg.category_id),
              name: catg.category_name,
              type: "movie" as const,
            };
          });

          await db.insert(categories).values(tvCatgData);
        }
        if (series) {
          const tvCatgData = series.map((catg) => {
            return {
              categoryId: Number(catg.category_id),
              name: catg.category_name,
              type: "series" as const,
            };
          });

          await db.insert(categories).values(tvCatgData);
        }
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.form}>
        <Field label="URL">
          <TextInput
            style={styles.input}
            value={url}
            onChangeText={setUrl}
            placeholder="https://exemplo.pt"
            placeholderTextColor={styles.placeholder.color}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
            inputMode="url"
          />
        </Field>

        <Field label="Utilizador">
          <TextInput
            style={styles.input}
            value={username}
            onChangeText={setUsername}
            placeholder="utilizador"
            placeholderTextColor={styles.placeholder.color}
            autoCapitalize="none"
            autoCorrect={false}
          />
        </Field>

        <Field label="Password">
          <TextInput
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            placeholder="••••••••"
            placeholderTextColor={styles.placeholder.color}
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
          />
        </Field>
      </View>

      <Pressable
        onPress={handleSave}
        disabled={!canSave || saving || !hydrated}
        style={({ pressed }) => [
          styles.button,
          { opacity: !canSave || saving ? 0.4 : pressed ? 0.85 : 1 },
        ]}
      >
        {saving ? (
          <ActivityIndicator color="#ffffff" />
        ) : (
          <Text style={styles.buttonText}>Save</Text>
        )}
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, gap: 24 },
  title: { fontSize: 26, fontWeight: "700", color: "#fff" },
  form: { gap: 18 },
  input: {
    borderWidth: 1,
    borderColor: "#d0d0d0",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: "#111111",
    backgroundColor: "#ffffff",
  },
  placeholder: { color: "#999999" },
  button: {
    backgroundColor: "#2563eb",
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: "auto",
  },
  buttonText: { color: "#ffffff", fontSize: 16, fontWeight: "600" },
});
