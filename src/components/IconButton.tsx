import AntDesign from "@react-native-vector-icons/ant-design/static";
import { Href, router } from "expo-router";
import { Pressable } from "react-native";

export type IconButtonProps = {
  name: React.ComponentProps<typeof AntDesign>["name"];
  accessibilityLabel: string;
  href?: Href;
  onPress?: () => void;
};
export function IconButton({
  name,
  accessibilityLabel,
  href,
  onPress,
}: IconButtonProps) {
  return (
    <Pressable
      onPress={onPress ?? (href ? () => router.navigate(href) : undefined)}
      hitSlop={8}
      accessibilityLabel={accessibilityLabel}
    >
      {({ focused }) => (
        <AntDesign name={name} color={focused ? "#4f9dff" : "#FFF"} size={20} />
      )}
    </Pressable>
  );
}
