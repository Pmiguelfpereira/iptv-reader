import { and, asc, eq } from "drizzle-orm";
import { useEffect, useState } from "react";
import { db } from "../../db";
import { categories } from "../../db/schema";
import { useSyncStore, type CatalogType } from "@/store/sync";
import type { SelectOption } from "@/components/Select";

export function useCategoryOptions(type: CatalogType) {
  const [options, setOptions] = useState<SelectOption[]>([]);
  const version = useSyncStore((s) => s.categoryVersions[type]);

  useEffect(() => {
    let cancelled = false;
    db.select()
      .from(categories)
      .where(and(eq(categories.type, type), eq(categories.hidden, false)))
      .orderBy(asc(categories.name))
      .then(
        (r) =>
          !cancelled &&
          setOptions(
            (r ?? []).map((c) => ({
              label: c.name,
              value: String(c.categoryId),
            })),
          ),
      );
    return () => {
      cancelled = true;
    };
  }, [type, version]);

  return options;
}
