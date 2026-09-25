import { useFocusStore } from "@/store/focus";
import { useFocusEffect } from "expo-router";
import { useCallback } from "react";
import { BackHandler, Platform } from "react-native";

function requestTVFocus(node: unknown) {
  const n = node as { requestTVFocus?: () => void };
  n.requestTVFocus?.();
}

export function useBackToTabs() {
  useFocusEffect(
    useCallback(() => {
      if (!Platform.isTV) return;

      const sub = BackHandler.addEventListener("hardwareBackPress", () => {
        const { tabsHasFocus, tabsHandle } = useFocusStore.getState();

        if (tabsHasFocus) return false;

        if (tabsHandle) {
          requestTVFocus(tabsHandle);
          return true;
        }
        return false;
      });

      return () => sub.remove();
    }, []),
  );
}
