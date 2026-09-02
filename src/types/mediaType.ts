import { CatalogType } from "@/store/sync";

// config/mediaType.ts
export type MediaType = "live" | "movie" | "series";

export const MEDIA = {
  live: { label: "Tv", hasImage: false },
  movie: { label: "Filmes", hasImage: true },
  series: { label: "Séries", hasImage: true },
} as const;

export const MEDIA_ENTRIES = Object.entries(MEDIA) as [
  CatalogType,
  (typeof MEDIA)[CatalogType],
][];
