import { MediaItem } from "@/components/MediaCard";
import { CatalogType } from "@/store/sync";
import { MediaType } from "@/types/mediaType";
import { useEffect, useState } from "react";
import { db } from "../../db";
import { movies, serieEpisode, tv } from "../../db/schema";
import { eq } from "drizzle-orm";

export function useMedia(type: CatalogType, id: string): MediaItem | null {
  const [media, setMedia] = useState<MediaItem | null>(null);

  useEffect(() => {
    let cancelled = false;
    resolveMedia(type, id).then((m) => !cancelled && setMedia(m));
    return () => {
      cancelled = true;
    };
  }, [type, id]);

  return media;
}

async function resolveMedia(
  type: MediaType,
  id: string,
): Promise<MediaItem | null> {
  const numericId = Number(id);
  if (!Number.isFinite(numericId)) return null;

  switch (type) {
    case "live": {
      const [result] = await db
        .select()
        .from(tv)
        .where(eq(tv.tvId, Number(id)))
        .limit(1);

      if (!result) return null;

      return {
        id: result.tvId.toString(),
        title: result.name,
        poster: result.image,
      };
    }
    case "movie": {
      const [result] = await db
        .select()
        .from(movies)
        .where(eq(movies.movieId, Number(id)))
        .limit(1);
      if (!result) return null;

      return {
        id: result.movieId.toString(),
        title: result.name,
        poster: result.image,
        ext: result.containerExtension ?? undefined,
      };
    }
    case "series": {
      const [result] = await db
        .select()
        .from(serieEpisode)
        .where(eq(serieEpisode.episodeId, Number(id)))
        .limit(1);
      if (!result) return null;

      return {
        id: result.episodeId.toString(),
        title: result.name ?? "",
        poster: null,
        ext: result.containerExtension ?? undefined,
      };
    }
    default:
      return null;
  }
}
