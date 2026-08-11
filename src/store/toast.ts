import { create } from "zustand";

export type ToastType = "info" | "success" | "error";

export type ToastData = {
  id: number;
  message: string;
  type: ToastType;
};

type ToastState = {
  current: ToastData | null;
  show: (message: string, type?: ToastType) => void;
  hide: (id?: number) => void;
};

let nextId = 0;

export const useToastStore = create<ToastState>((set) => ({
  current: null,

  show: (message, type = "info") =>
    set({ current: { id: ++nextId, message, type } }),

  hide: (id) =>
    set((state) =>
      id === undefined || state.current?.id === id ? { current: null } : state,
    ),
}));
