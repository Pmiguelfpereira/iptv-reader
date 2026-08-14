import { useState } from "react";
import {
  Image,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

export type MediaItem = {
  id: string;
  title: string;
  poster: string | null;
  ext?: string;
};

export default function MediaCard({
  item,
  width,
  onPress,
  nextFocusUp,
}: {
  item: MediaItem;
  width: number;
  hasInitialFocus?: boolean;
  onPress: () => void;
  nextFocusUp?: number;
}) {
  const [focused, setFocused] = useState(false);

  return (
    <Pressable
      style={({ focused }) => [{ width }, focused && styles.cardFocused]}
      onPress={onPress}
      {...(Platform.isTV && { nextFocusUp })}
    >
      {({ focused }) => (
        <>
          <View>
            {item.poster ? (
              <Image
                source={{ uri: item.poster }}
                style={[styles.poster, focused && styles.imageFocused]}
                resizeMode="cover"
              />
            ) : (
              <View style={[styles.poster, focused && styles.imageFocused]} />
            )}
          </View>
          <Text
            style={[styles.title, focused && styles.titleFocused]}
            numberOfLines={2}
          >
            {item.title}
          </Text>
        </>
      )}
    </Pressable>
  );
}
const styles = StyleSheet.create({
  poster: {
    width: "100%",
    aspectRatio: 2 / 3,
    borderRadius: 8,
    backgroundColor: "#1e1e1e",
    objectFit: "contain",
  },
  imageFocused: {
    borderWidth: 3,
    borderColor: "#4f9dff",
  },

  cardFocused: {
    zIndex: 1,
    backgroundColor: "#fff",
  },

  title: {
    color: "#000",
    fontSize: 12,
    fontWeight: "500",
    textAlign: "center",
    marginTop: 10,
  },
  titleFocused: { color: "#000" },

  favBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "rgba(0,0,0,0.6)",
    borderRadius: 999,
    padding: 6,
  },
});
