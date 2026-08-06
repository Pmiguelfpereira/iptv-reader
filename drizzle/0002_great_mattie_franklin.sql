PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_categories` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`category_id` integer NOT NULL,
	`name` text NOT NULL,
	`type` text NOT NULL,
	`hidden` integer DEFAULT true NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_categories`("id", "category_id", "name", "type", "hidden") SELECT "id", "category_id", "name", "type", "hidden" FROM `categories`;--> statement-breakpoint
DROP TABLE `categories`;--> statement-breakpoint
ALTER TABLE `__new_categories` RENAME TO `categories`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE UNIQUE INDEX `categories_category_id_type_unique` ON `categories` (`category_id`,`type`);