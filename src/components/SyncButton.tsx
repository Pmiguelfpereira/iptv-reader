import AntDesign from "@react-native-vector-icons/ant-design/static";
import { useRef } from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  StyleSheet,
  Text,
} from "react-native";

export function SyncButton({
  label = "Sincronizar tudo",
  onPress,
  syncing = false,
  preferFocus = false,
  nextFocusUp,
}: {
  label?: string;
  onPress: () => void;
  syncing?: boolean;
  preferFocus?: boolean;
  nextFocusUp?: number;
}) {
  const focusClaimed = useRef(false);

  return (
    <Pressable
      onPress={() => !syncing && onPress()}
      accessibilityLabel={label}
      style={({ focused }) => [styles.button, focused && styles.buttonFocused]}
      {...(Platform.isTV && {
        hasTVPreferredFocus: preferFocus,
        nextFocusUp,
      })}
      onFocus={() => {
        focusClaimed.current = true;
      }}
    >
      {({ focused }) => (
        <>
          {syncing ? (
            <ActivityIndicator size={20} color="#4f9dff" />
          ) : (
            <AntDesign
              name="sync"
              size={20}
              color={focused ? "#4f9dff" : "#000"}
            />
          )}
          <Text
            style={[styles.label, focused && styles.labelActive]}
            numberOfLines={1}
          >
            {label}
          </Text>
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#3a3a3a",
    backgroundColor: "transparent",
  },
  buttonFocused: {
    borderColor: "#4f9dff",
    backgroundColor: "rgba(79, 157, 255, 0.08)",
  },
  label: {
    color: "#000",
    fontSize: 15,
    fontWeight: "500",
  },
  labelActive: {
    color: "#4f9dff",
  },
});
