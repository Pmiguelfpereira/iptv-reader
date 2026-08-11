import { create } from "zustand";
import { categories } from "../../db/schema";

export type CatalogType = typeof categories.$inferSelect.type;

type SyncState = {
  categoryVersions: Record<CatalogType, number>;
  contentVersions: Record<CatalogType, number>;
  bumpCategories: (t: CatalogType) => void;
  bumpContent: (t: CatalogType) => void;
};

const zero: Record<CatalogType, number> = { live: 0, movie: 0, series: 0 };

export const useSyncStore = create<SyncState>((set) => ({
  categoryVersions: { ...zero },
  contentVersions: { ...zero },
  bumpCategories: (t) =>
    set((s) => ({
      categoryVersions: {
        ...s.categoryVersions,
        [t]: s.categoryVersions[t] + 1,
      },
    })),
  bumpContent: (t) =>
    set((s) => ({
      contentVersions: { ...s.contentVersions, [t]: s.contentVersions[t] + 1 },
    })),
}));
