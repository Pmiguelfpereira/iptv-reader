PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_account` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`url` text NOT NULL,
	`username` text NOT NULL,
	`password` text NOT NULL,
	`status` text
);
--> statement-breakpoint
INSERT INTO `__new_account`("id", "url", "username", "password", "status") SELECT "id", "url", "username", "password", "status" FROM `account`;--> statement-breakpoint
DROP TABLE `account`;--> statement-breakpoint
ALTER TABLE `__new_account` RENAME TO `account`;--> statement-breakpoint
PRAGMA foreign_keys=ON;