import { Category } from "@/components/CategoryRow";
import { CONFIG } from "@/lib/config";
import { useAccountStore } from "@/store/account";
import { CatalogType, useSyncStore } from "@/store/sync";
import { useSyncQueue } from "@/store/syncQueue";
import { useToastStore } from "@/store/toast";
import { XtreamCategory } from "@/types/xtream/types";
import { logger } from "@/utils/logger";
import { eq } from "drizzle-orm";
import { db } from "../../db";
import { categories } from "../../db/schema";

export function useCategorySync(
  type: CatalogType,
  setHidden: (id: number, h: boolean) => void,
) {
  const cfg = CONFIG[type];
  const enqueue = useSyncQueue((s) => s.enqueue);

  const bumpContent = useSyncStore((s) => s.bumpContent);
  const bumpCategories = useSyncStore((s) => s.bumpCategories);

  const toastShow = useToastStore((s) => s.show);

  const fetchAndInsert = async (item: Category) => {
    const key = `${type}:cat:${item.categoryId}`;
    enqueue(key, async () => {
      const client = useAccountStore.getState().client;
      if (!client) return;
      try {
        const items = await cfg.getStreams(client, String(item.categoryId));
        await db.transaction(async (tx) => {
          await tx
            .delete(cfg.table)
            .where(eq(cfg.table.categoryId, item.categoryId));

          if (items?.length) {
            const data = items.map((x: any) => cfg.map(x, item.categoryId));
            for (let i = 0; i < data.length; i += 400) {
              await tx.insert(cfg.table).values(data.slice(i, i + 400));
            }
          }
        });
        toastShow(`Sync ${type} - ${item.categoryId}`, "success");
      } catch (e) {
        toastShow(`Failed ${type} - ${item.categoryId}`, "error");
        logger.error("Failed to fetch/insert", item.categoryId, e);
      }
    });
  };

  const onHidden = async (item: Category) => {
    const wasHidden = item.hidden;
    setHidden(item.categoryId, !wasHidden);
    await db
      .update(categories)
      .set({ hidden: !wasHidden })
      .where(eq(categories.categoryId, item.categoryId));
    if (wasHidden) {
      fetchAndInsert(item);
      bumpContent(type);
      bumpCategories(type);
    }
  };

  const onRowPress = (item: Category) => {
    if (item.hidden) onHidden(item);
    else fetchAndInsert(item).then(() => bumpContent(type));
  };

  const syncCategories = () => {
    const key = `${type}:cats`;
    enqueue(key, async () => {
      const client = useAccountStore.getState().client;
      if (!client) return;
      try {
        const catg = await cfg.getCategories(client);
        await db.transaction(async (tx) => {
          await tx.delete(categories).where(eq(categories.type, type));
          if (catg?.length) {
            await tx.insert(categories).values(
              catg.map((c: XtreamCategory) => ({
                categoryId: Number(c.category_id),
                name: c.category_name,
                type,
              })),
            );
          }
        });
        bumpCategories(type);
        toastShow(`Sync ${type}`, "success");
      } catch (e) {
        toastShow(`Failed ${type}`, "error");
        logger.error(`Failed ${type}`, e);
      }
    });
  };

  const onRowLongPress = (item: Category) => {
    onHidden(item);
  };
  return { onRowPress, onRowLongPress, syncCategories };
}
