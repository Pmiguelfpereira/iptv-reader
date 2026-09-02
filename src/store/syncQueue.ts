import { create } from "zustand";

const queue: Array<() => Promise<void>> = [];
let active = 0;
const MAX = 2;

function drain() {
  while (active < MAX && queue.length) {
    const task = queue.shift()!;
    active++;
    task()
      .catch(() => {})
      .finally(() => {
        active--;
        drain();
      });
  }
}

export const useSyncQueue = create<{
  running: Set<string>;
  enqueue: (key: string, fn: () => Promise<void>) => void;
}>((set, get) => ({
  running: new Set(),
  enqueue(key, fn) {
    if (get().running.has(key)) return;
    queue.push(async () => {
      set((s) => ({ running: new Set(s.running).add(key) }));
      try {
        await fn();
      } finally {
        set((s) => {
          const n = new Set(s.running);
          n.delete(key);
          return { running: n };
        });
      }
    });
    drain();
  },
}));
