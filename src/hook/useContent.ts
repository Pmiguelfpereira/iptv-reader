// hook/useContentPaged.ts
import { and, asc, eq, like } from "drizzle-orm";
import { useCallback, useEffect, useRef, useState } from "react";
import { db } from "../../db";
import { categories } from "../../db/schema";
import { CONFIG } from "@/lib/config";
import { useSyncStore, type CatalogType } from "@/store/sync";
import type { MediaItem } from "@/components/MediaCard";

const PAGE = 60;

export function useContentPaged(
  type: CatalogType,
  categoryId: string | null,
  query = "",
) {
  const cfg = CONFIG[type];

  const [items, setItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(false);

  const offset = useRef(0);
  const done = useRef(false);
  const busy = useRef(false);

  const version = useSyncStore((s) => s.contentVersions[type]);
  const q = query.trim();

  const runId = useRef(0);

  const buildWhere = useCallback(() => {
    if (q) {
      return and(
        eq(categories.type, type),
        eq(categories.hidden, false),
        like(cfg.table.name, `%${q}%`),
      );
    }
    if (!categoryId) return null;
    return and(
      eq(categories.type, type),
      eq(categories.categoryId, Number(categoryId)),
      eq(categories.hidden, false),
    );
  }, [type, categoryId, q, cfg.table]);

  const loadMore = useCallback(async () => {
    if (done.current || busy.current) return;

    const where = buildWhere();
    if (!where) {
      setLoading(false);
      return;
    }
    const id = runId.current;

    busy.current = true;
    setLoading(true);
    try {
      const rows = await db
        .select(cfg.select)
        .from(cfg.table)
        .innerJoin(categories, eq(cfg.table.categoryId, categories.categoryId))
        .where(where)
        .orderBy(asc(cfg.table.name))
        .limit(PAGE)
        .offset(offset.current);

      if (id !== runId.current) return;

      if (rows.length < PAGE) done.current = true;
      offset.current += rows.length;

      const mapped: MediaItem[] = rows.map((r) => ({
        id: String(r.id),
        title: r.name,
        poster: r.image ?? null,
        ext: "ext" in r ? (r.ext ?? "") : undefined,
      }));

      setItems((prev) => [...prev, ...mapped]);
    } finally {
      if (id === runId.current) {
        busy.current = false;
        setLoading(false);
      }
    }
  }, [buildWhere, cfg]);

  useEffect(() => {
    runId.current++;
    offset.current = 0;
    done.current = false;
    busy.current = false;
    setItems([]);
    loadMore();
  }, [type, categoryId, q, version]);

  return { items, loadMore, loading };
}
