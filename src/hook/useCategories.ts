// hook/useCategories.ts
import { and, asc, eq } from "drizzle-orm";
import { useCallback, useEffect, useRef, useState } from "react";
import { db } from "../../db";
import { categories } from "../../db/schema";
import { useSyncStore, type CatalogType } from "@/store/sync";

type Category = typeof categories.$inferSelect;

type Options = {
  paged?: boolean;
  pageSize?: number;
};

export default function useCategories(
  type: CatalogType,
  options: Options = {},
) {
  const { paged = false, pageSize = 50 } = options;
  const [loading, setLoading] = useState(true);

  const [data, setData] = useState<Category[]>([]);
  const version = useSyncStore((s) => s.categoryVersions[type]);

  const [viewSync, setViewSync] = useState(false);
  const toggleSwitch = () => setViewSync((previousState) => !previousState);

  const offset = useRef(0);
  const done = useRef(false);
  const busy = useRef(false);
  const runId = useRef(0);

  const baseQuery = useCallback(
    () =>
      db
        .select()
        .from(categories)
        .where(
          viewSync
            ? and(eq(categories.type, type), eq(categories.hidden, false))
            : eq(categories.type, type),
        ),
    [type, viewSync],
  );

  const loadMore = useCallback(async () => {
    if (!paged || done.current || busy.current) return;
    busy.current = true;
    const id = runId.current;

    try {
      const page = await baseQuery().limit(pageSize).offset(offset.current);
      if (id !== runId.current) return;
      if (page.length < pageSize) done.current = true;
      offset.current += page.length;
      setData((prev) => [...prev, ...page]);
    } finally {
      busy.current = false;
    }
  }, [paged, pageSize, baseQuery]);

  useEffect(() => {
    const id = ++runId.current;

    offset.current = 0;
    done.current = false;
    busy.current = false;
    setLoading(true);

    if (paged) {
      loadMore().finally(() => id === runId.current && setLoading(false));
    } else {
      baseQuery()
        .then((r) => {
          if (id !== runId.current) return;
          setData(r);
        })
        .finally(() => id === runId.current && setLoading(false));
    }
  }, [type, version, paged, pageSize, viewSync]);

  const setHidden = useCallback((categoryId: number, hidden: boolean) => {
    setData((prev) =>
      prev.map((c) => (c.categoryId === categoryId ? { ...c, hidden } : c)),
    );
  }, []);

  return { data, setHidden, loadMore, loading, viewSync, toggleSwitch };
}
