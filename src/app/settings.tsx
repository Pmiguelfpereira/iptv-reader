import Field from "@/components/Field";
import { ScreenFade } from "@/components/ScreenFade";
import { XtreamClient } from "@/lib/xtream";
import { useAccountStore } from "@/store/account";
import { useSyncStore } from "@/store/sync";
import { useToastStore } from "@/store/toast";
import { logger } from "@/utils/logger";
import { useEffect, useState } from "react";
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

const CATEGORY_SOURCES = [
  { fetch: (c: XtreamClient) => c.getLiveCategories(), type: "live" as const },
  { fetch: (c: XtreamClient) => c.getVodCategories(), type: "movie" as const },
  {
    fetch: (c: XtreamClient) => c.getSeriesCategories(),
    type: "series" as const,
  },
];

export default function Settings() {
  const [url, setUrl] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const hydrated = useAccountStore((state) => state.hydrated);

  const accountStored = useAccountStore((s) => s.account);

  const setAccount = useAccountStore((state) => state.setAccount);

  const [saving, setSaving] = useState(false);

  const toastShow = useToastStore((state) => state.show);

  const bumpCategories = useSyncStore.getState().bumpCategories;

  const canSave =
    url.trim() !== "" && username.trim() !== "" && password !== "";

  const handleSave = async () => {
    setSaving(true);
    try {
      const accountData = await db.transaction(async (tx) => {
        await Promise.all([
          tx.delete(account),
          tx.delete(series),
          tx.delete(tv),
          tx.delete(categories),
          tx.delete(movies),
        ]);

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

      if (accountData) setAccount(accountData);

      const client = useAccountStore.getState().client;
      if (!client) return;

      const results = await Promise.all(
        CATEGORY_SOURCES.map(async (source) => ({
          type: source.type,
          list: await source.fetch(client),
        })),
      );

      const rows = results.flatMap(({ type, list }) =>
        (list ?? []).map((catg) => ({
          categoryId: Number(catg.category_id),
          name: catg.category_name,
          type,
        })),
      );

      if (rows.length) {
        await db.insert(categories).values(rows);
      }
      toastShow("Sync completed successfully.", "success");
    } catch (err) {
      logger.error("Sync failed", err);
      toastShow("Sync failed.", "error");
    } finally {
      setSaving(false);
      (["live", "movie", "series"] as const).forEach(bumpCategories);
    }
  };

  useEffect(() => {
    if (!hydrated) return;
    setUrl(accountStored?.url ?? process.env.EXPO_PUBLIC_XTREAM_URL ?? "");
    setUsername(
      accountStored?.username ?? process.env.EXPO_PUBLIC_XTREAM_USERNAME ?? "",
    );
    setPassword(
      accountStored?.password ?? process.env.EXPO_PUBLIC_XTREAM_PASSWORD ?? "",
    );
  }, [hydrated, accountStored]);

  return (
    <ScreenFade>
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
    </ScreenFade>
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
