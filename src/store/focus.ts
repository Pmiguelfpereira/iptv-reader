import { create } from "zustand";

type FocusState = {
  tabsHandle: number | null;
  setTabsHandle: (handle: number | null) => void;

  tabsHasFocus: boolean;
  setTabsHasFocus: (value: boolean) => void;

  focusTabsNonce: number;
  focusTabs: () => void;
};

export const useFocusStore = create<FocusState>((set) => ({
  tabsHandle: null,
  setTabsHandle: (tabsHandle) => set({ tabsHandle }),

  tabsHasFocus: false,
  setTabsHasFocus: (tabsHasFocus) => set({ tabsHasFocus }),

  focusTabsNonce: 0,
  focusTabs: () => set((s) => ({ focusTabsNonce: s.focusTabsNonce + 1 })),
}));
