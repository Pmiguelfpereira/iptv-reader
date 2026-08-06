PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_movies` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`movie_id` integer NOT NULL,
	`name` text NOT NULL,
	`container_extension` text,
	`image` text,
	`category_id` integer NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_movies`("id", "movie_id", "name", "container_extension", "image", "category_id") SELECT "id", "movie_id", "name", "container_extension", "image", "category_id" FROM `movies`;--> statement-breakpoint
DROP TABLE `movies`;--> statement-breakpoint
ALTER TABLE `__new_movies` RENAME TO `movies`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE UNIQUE INDEX `movies_movie_id_unique` ON `movies` (`movie_id`);--> statement-breakpoint
CREATE TABLE `__new_serie_episode` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`episode_id` integer NOT NULL,
	`serie_id` integer NOT NULL,
	`name` text,
	`season_number` integer NOT NULL,
	`episode_num` integer NOT NULL,
	`container_extension` text
);
--> statement-breakpoint
INSERT INTO `__new_serie_episode`("id", "episode_id", "serie_id", "name", "season_number", "episode_num", "container_extension") SELECT "id", "episode_id", "serie_id", "name", "season_number", "episode_num", "container_extension" FROM `serie_episode`;--> statement-breakpoint
DROP TABLE `serie_episode`;--> statement-breakpoint
ALTER TABLE `__new_serie_episode` RENAME TO `serie_episode`;--> statement-breakpoint
CREATE UNIQUE INDEX `serie_episode_episode_id_unique` ON `serie_episode` (`episode_id`);--> statement-breakpoint
CREATE TABLE `__new_series` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`serie_id` integer NOT NULL,
	`name` text NOT NULL,
	`image` text,
	`category_id` integer NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_series`("id", "serie_id", "name", "image", "category_id") SELECT "id", "serie_id", "name", "image", "category_id" FROM `series`;--> statement-breakpoint
DROP TABLE `series`;--> statement-breakpoint
ALTER TABLE `__new_series` RENAME TO `series`;--> statement-breakpoint
CREATE UNIQUE INDEX `series_serie_id_unique` ON `series` (`serie_id`);--> statement-breakpoint
CREATE TABLE `__new_tv` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`tv_id` integer NOT NULL,
	`name` text NOT NULL,
	`image` text,
	`category_id` integer NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_tv`("id", "tv_id", "name", "image", "category_id") SELECT "id", "tv_id", "name", "image", "category_id" FROM `tv`;--> statement-breakpoint
DROP TABLE `tv`;--> statement-breakpoint
ALTER TABLE `__new_tv` RENAME TO `tv`;--> statement-breakpoint
CREATE UNIQUE INDEX `tv_tv_id_unique` ON `tv` (`tv_id`);