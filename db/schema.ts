import { integer, sqliteTable, text, unique } from "drizzle-orm/sqlite-core";

// id = PK interno (autoincrement) | *Id = id externo da API Xtream

export const account = sqliteTable("account", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  url: text("url").notNull(),
  username: text("username").notNull(),
  password: text("password").notNull(),
  status: text("status"),
});

export const categories = sqliteTable(
  "categories",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    categoryId: integer("category_id").notNull(), // externo, para o match no import
    name: text("name").notNull(),
    type: text("type", { enum: ["live", "movie", "series"] }).notNull(),
    // false = visível | true = escondida. Guardado como 0/1 no SQLite.
    hidden: integer("hidden", { mode: "boolean" }).notNull().default(true),
  },
  (t) => [unique().on(t.categoryId, t.type)],
);

export const movies = sqliteTable("movies", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  movieId: integer("movie_id").notNull().unique(),
  name: text("name").notNull(),
  containerExtension: text("container_extension"),
  image: text("image"),
  categoryId: integer("category_id").notNull(),
});

export const tv = sqliteTable("tv", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  tvId: integer("tv_id").notNull().unique(),
  name: text("name").notNull(),
  image: text("image"),
  categoryId: integer("category_id").notNull(),
});

export const series = sqliteTable("series", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  serieId: integer("serie_id").notNull().unique(),
  name: text("name").notNull(),
  image: text("image"),
  categoryId: integer("category_id").notNull(),
});

export const serieEpisode = sqliteTable("serie_episode", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  episodeId: integer("episode_id").notNull().unique(),
  serieId: integer("serie_id").notNull(),
  name: text("name"),
  seasonNumber: integer("season_number").notNull(),
  episodeNum: integer("episode_num").notNull(),
  containerExtension: text("container_extension"),
});
