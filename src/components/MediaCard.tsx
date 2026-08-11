import { useState } from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";

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
}: {
  item: MediaItem;
  width: number;
  hasInitialFocus?: boolean;
  onPress: () => void;
}) {
  const [focused, setFocused] = useState(false);

  return (
    <Pressable
      style={[{ width }, focused && styles.cardFocused]}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      onPress={() => onPress()}
    >
      <View>
        {item.poster && (
          <Image
            source={{ uri: item.poster }}
            style={[styles.poster, focused && styles.imageFocused]}
            resizeMode="cover"
          />
        )}
        {!item.poster && (
          <View style={[styles.poster, focused && styles.imageFocused]} />
        )}
      </View>
      <Text
        style={[styles.title, focused && styles.titleFocused]}
        numberOfLines={2}
      >
        {item.title}
      </Text>
      {/* <View style={styles.favBadge}>
        <AntDesign name="heart" size={18} color="#4f9dff" />
      </View> */}
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
  },

  title: {
    color: "#8a8a8a",
    fontSize: 16,
    fontWeight: "500",
    textAlign: "center",
    marginTop: 10,
  },
  titleFocused: { color: "#fff" },

  favBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "rgba(0,0,0,0.6)",
    borderRadius: 999,
    padding: 6,
  },
});
