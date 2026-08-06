CREATE TABLE `account` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`username` text NOT NULL,
	`password` text,
	`status` text
);
--> statement-breakpoint
CREATE TABLE `categories` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`category_id` integer NOT NULL,
	`name` text NOT NULL,
	`type` text NOT NULL,
	`hidden` integer DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `categories_category_id_type_unique` ON `categories` (`category_id`,`type`);--> statement-breakpoint
CREATE TABLE `movie` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`movie_id` integer NOT NULL,
	`name` text NOT NULL,
	`container_extension` text,
	`image` text,
	`category_id` integer,
	FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `movie_movie_id_unique` ON `movie` (`movie_id`);--> statement-breakpoint
CREATE TABLE `serie_episode` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`episode_id` integer NOT NULL,
	`serie_id` integer NOT NULL,
	`name` text,
	`season_number` integer NOT NULL,
	`episode_num` integer NOT NULL,
	`container_extension` text,
	FOREIGN KEY (`serie_id`) REFERENCES `series`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `serie_episode_episode_id_unique` ON `serie_episode` (`episode_id`);--> statement-breakpoint
CREATE TABLE `series` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`serie_id` integer NOT NULL,
	`name` text NOT NULL,
	`image` text,
	`category_id` integer,
	FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `series_serie_id_unique` ON `series` (`serie_id`);--> statement-breakpoint
CREATE TABLE `tv` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`tv_id` integer NOT NULL,
	`name` text NOT NULL,
	`image` text,
	`category_id` integer,
	FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `tv_tv_id_unique` ON `tv` (`tv_id`);