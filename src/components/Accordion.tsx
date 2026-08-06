import { useState, type ReactNode } from "react";
import {
  LayoutAnimation,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  UIManager,
  View,
} from "react-native";

if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

type Props = {
  title: string;
  children?: ReactNode;
  /** label -> handler. Se existir, mostra o "⋯" que abre o menu. */
  actions?: Record<string, () => void>;
  defaultExpanded?: boolean;
};

export function Accordion({
  title,
  children,
  actions,
  defaultExpanded = true,
}: Props) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const [menuOpen, setMenuOpen] = useState(false);

  const toggle = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded((v) => !v);
  };

  const hasActions = actions && Object.keys(actions).length > 0;

  return (
    <View>
      <View style={styles.header}>
        <Pressable onPress={toggle} style={[styles.headerMain]} hitSlop={8}>
          {({ pressed, focused }) => (
            <Text
              style={[styles.title, (pressed || focused) && styles.titleActive]}
              numberOfLines={1}
            >
              {title}
            </Text>
          )}
        </Pressable>

        {hasActions && (
          <Pressable onPress={() => setMenuOpen((o) => !o)} hitSlop={8}>
            <Text style={styles.dots}>{"\u22EF"}</Text>
          </Pressable>
        )}

        {hasActions && menuOpen && (
          <View style={styles.menu}>
            {Object.entries(actions!).map(([label, fn], i, arr) => (
              <Pressable
                key={label}
                onPress={() => {
                  setMenuOpen(false);
                  fn();
                }}
                style={[
                  styles.menuItem,
                  i < arr.length - 1 && styles.menuItemBorder,
                ]}
              >
                <Text style={styles.menuLabel}>{label}</Text>
              </Pressable>
            ))}
          </View>
        )}
      </View>
      {expanded && <View style={styles.children}>{children}</View>}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: "#2f2f2f",
    borderRadius: 12,
    marginTop: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    zIndex: 1,
  },
  titleActive: {
    color: "#4f9dff",
  },
  headerMain: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },

  title: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "600",
    flexShrink: 1,
  },

  dots: {
    color: "#FFFFFF",
    fontSize: 22,
    fontWeight: "700",
  },

  menu: {
    position: "absolute",
    top: "100%",
    right: 8,
    marginTop: 4,
    minWidth: 180,
    backgroundColor: "#2C2C2E",
    borderRadius: 10,
    paddingVertical: 4,
    zIndex: 10,
    elevation: 8, // Android
    shadowColor: "#000",
    shadowOpacity: 0.4,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
  },
  menuItem: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  menuItemBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#3A3A3C",
  },
  menuLabel: {
    color: "#FFFFFF",
    fontSize: 16,
  },
  children: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
});
