import { useFocusStore } from "@/store/focus";
import { useFocusEffect } from "expo-router";
import { useCallback } from "react";
import { BackHandler, Platform } from "react-native";

export function useBackToTabs() {
  useFocusEffect(
    useCallback(() => {
      if (!Platform.isTV) return;

      const sub = BackHandler.addEventListener("hardwareBackPress", () => {
        const { tabsHasFocus } = useFocusStore.getState();

        if (tabsHasFocus) return false;

        return true;
      });

      return () => sub.remove();
    }, []),
  );
}
