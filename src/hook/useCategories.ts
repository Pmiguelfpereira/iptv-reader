import { CatalogType, useSyncStore } from "@/store/sync";
import { eq } from "drizzle-orm";
import { useCallback, useEffect, useState } from "react";
import { db } from "../../db";
import { categories } from "../../db/schema";

export default function useCategories(type: CatalogType) {
  const [data, setData] = useState<(typeof categories.$inferSelect)[]>([]);
  const version = useSyncStore((s) => s.categoryVersions[type]);

  useEffect(() => {
    let cancelled = false;
    db.select()
      .from(categories)
      .where(eq(categories.type, type))
      .then((r) => !cancelled && setData(r));
    return () => {
      cancelled = true;
    };
  }, [type, version]);

  const setHidden = useCallback((categoryId: number, hidden: boolean) => {
    setData((prev) =>
      prev.map((c) => (c.categoryId === categoryId ? { ...c, hidden } : c)),
    );
  }, []);

  return { data, setHidden };
}
