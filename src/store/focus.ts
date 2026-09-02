import { create } from "zustand";

type FocusState = {
  tabsHandle: number | null;
  setTabsHandle: (handle: number | null) => void;

  tabsHasFocus: boolean;
  setTabsHasFocus: (value: boolean) => void;
};

export const useFocusStore = create<FocusState>((set) => ({
  tabsHandle: null,
  setTabsHandle: (tabsHandle) => set({ tabsHandle }),

  tabsHasFocus: false,
  setTabsHasFocus: (tabsHasFocus) => set({ tabsHasFocus }),
}));
