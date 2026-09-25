import AntDesign from "@react-native-vector-icons/ant-design/static";
import { Image } from "expo-image";
import { useState } from "react";
import {
  findNodeHandle,
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
  isLast = false,
}: {
  item: MediaItem;
  width: number;
  hasInitialFocus?: boolean;
  onPress: () => void;
  nextFocusUp?: number;
  isLast?: boolean;
}) {
  const [selfHandle, setSelfHandle] = useState<number | null>(null);
  const [hasError, setHasError] = useState(false);

  return (
    <Pressable
      ref={(node) => {
        if (node) setSelfHandle(findNodeHandle(node));
      }}
      style={({ focused }) => [
        { width },
        styles.main,
        focused && styles.cardFocused,
      ]}
      onPress={onPress}
      {...(Platform.isTV && { nextFocusUp })}
      {...(Platform.isTV && { nextFocusDown: isLast ? selfHandle : undefined })}
      nextFocusLeft={nextFocusUp}
    >
      {({ focused }) => (
        <>
          <View>
            {item.poster && !hasError ? (
              <Image
                source={{ uri: item.poster }}
                style={[
                  styles.poster,
                  Platform.isTV && focused && styles.imageFocused,
                ]}
                contentFit="cover"
                recyclingKey={item.id}
                cachePolicy="disk"
                transition={0}
                onError={() => setHasError(true)}
              />
            ) : (
              <View
                style={[
                  styles.errorPoster,
                  Platform.isTV && focused && styles.imageFocused,
                ]}
              >
                <AntDesign name="picture" size={40} color="#6E6E6E" />
              </View>
            )}
          </View>
          <Text
            style={[
              styles.title,
              Platform.isTV && focused && styles.titleFocused,
            ]}
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
  main: {
    padding: 8,
  },
  errorPoster: {
    width: "100%",
    aspectRatio: 2 / 3,
    borderRadius: 8,
    backgroundColor: "#1e1e1e",
    alignItems: "center",
    justifyContent: "center",
  },
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
