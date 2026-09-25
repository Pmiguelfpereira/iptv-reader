import AntDesign from "@react-native-vector-icons/ant-design/static";
import { Href, router, usePathname } from "expo-router";
import { forwardRef } from "react";
import { Platform, Pressable, View } from "react-native";

export type IconButtonProps = {
  name: React.ComponentProps<typeof AntDesign>["name"];
  accessibilityLabel: string;
  href?: Href;
  onPress?: () => void;
  disabled?: boolean;
};

export const IconButton = forwardRef<View, IconButtonProps>(function IconButton(
  { name, href, onPress, accessibilityLabel, disabled = false },
  ref,
) {
  const pathname = usePathname();

  const handlePress = () => {
    if (onPress) return onPress();
    if (!href) return;

    const target =
      typeof href === "string" ? href.split("?")[0] : href.pathname;
    if (target === pathname) return;

    router.navigate(href);
  };
  return (
    <Pressable
      ref={ref}
      onPress={handlePress}
      hitSlop={8}
      accessibilityLabel={accessibilityLabel}
      disabled={disabled}
    >
      {({ focused }) => (
        <AntDesign
          name={name}
          color={Platform.isTV && focused ? "#4f9dff" : "#1e1e1e"}
          size={25}
        />
      )}
    </Pressable>
  );
});
