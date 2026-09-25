import { View } from "react-native";
import { create } from "zustand";

type FocusState = {
  tabsHandle: View | null;
  setTabsHandle: (handle: View | null) => void;

  tabsHasFocus: boolean;
  setTabsHasFocus: (value: boolean) => void;
};

export const useFocusStore = create<FocusState>((set) => ({
  tabsHandle: null,
  setTabsHandle: (tabsHandle) => set({ tabsHandle }),

  tabsHasFocus: false,
  setTabsHasFocus: (tabsHasFocus) => set({ tabsHasFocus }),
}));
