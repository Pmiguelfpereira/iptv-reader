ALTER TABLE `account` ADD `externalPlayer` integer DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `account` DROP COLUMN `hidden`;