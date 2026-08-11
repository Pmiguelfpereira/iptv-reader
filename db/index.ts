import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/expo-sqlite";
import { openDatabaseSync } from "expo-sqlite";
import * as schema from "./schema";

const expo = openDatabaseSync("xtream.db", { enableChangeListener: false });
export const db = drizzle(expo, { schema });

db.run(sql`PRAGMA foreign_keys = ON;`);
