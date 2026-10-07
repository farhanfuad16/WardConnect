CREATE TABLE `incidents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`wardId` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`category` varchar(128) NOT NULL,
	`severity` enum('High','Medium','Low') NOT NULL,
	`description` text NOT NULL,
	`status` varchar(128) NOT NULL,
	`accent` varchar(16),
	`latitude` decimal(10,7),
	`longitude` decimal(10,7),
	`verifiedBy` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `incidents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `issues` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`wardId` int NOT NULL,
	`category` varchar(128) NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text NOT NULL,
	`status` enum('submitted','acknowledged','in_progress','resolved','rejected') NOT NULL DEFAULT 'submitted',
	`severity` enum('normal','emergency') NOT NULL DEFAULT 'normal',
	`landmark` varchar(255),
	`photoUrl` varchar(512),
	`latitude` decimal(10,7),
	`longitude` decimal(10,7),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `issues_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `notices` (
	`id` int AUTO_INCREMENT NOT NULL,
	`wardId` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`body` text NOT NULL,
	`category` enum('Emergency Alert','Utility Notice','General Notice') NOT NULL DEFAULT 'General Notice',
	`postedBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `notices_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `notifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`body` text NOT NULL,
	`isRead` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `notifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `resources` (
	`id` int AUTO_INCREMENT NOT NULL,
	`wardId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`category` varchar(128) NOT NULL,
	`contactInfo` varchar(255) NOT NULL,
	`address` varchar(512),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `resources_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `sos_alerts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`wardId` int NOT NULL,
	`type` varchar(64) NOT NULL,
	`status` enum('pending','dispatched','resolved','cancelled') NOT NULL DEFAULT 'pending',
	`note` text,
	`latitude` decimal(10,7),
	`longitude` decimal(10,7),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `sos_alerts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `volunteers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`wardId` int NOT NULL,
	`skillsOrInterest` text,
	`status` enum('pending','approved','active','inactive') NOT NULL DEFAULT 'pending',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `volunteers_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `wards` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`code` varchar(64) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `wards_id` PRIMARY KEY(`id`),
	CONSTRAINT `wards_code_unique` UNIQUE(`code`)
);
--> statement-breakpoint
ALTER TABLE `users` DROP INDEX `users_openId_unique`;--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `openId` varchar(64);--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `name` varchar(255);--> statement-breakpoint
ALTER TABLE `users` ADD `phone` varchar(32);--> statement-breakpoint
ALTER TABLE `users` ADD `passwordHash` varchar(255);--> statement-breakpoint
ALTER TABLE `users` ADD `wardId` int;--> statement-breakpoint
ALTER TABLE `users` ADD `isAdmin` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD CONSTRAINT `users_openId_idx` UNIQUE(`openId`);--> statement-breakpoint
ALTER TABLE `users` ADD CONSTRAINT `users_email_idx` UNIQUE(`email`);--> statement-breakpoint
CREATE INDEX `incidents_wardId_idx` ON `incidents` (`wardId`);--> statement-breakpoint
CREATE INDEX `incidents_severity_idx` ON `incidents` (`severity`);--> statement-breakpoint
CREATE INDEX `incidents_createdAt_idx` ON `incidents` (`createdAt`);--> statement-breakpoint
CREATE INDEX `issues_userId_idx` ON `issues` (`userId`);--> statement-breakpoint
CREATE INDEX `issues_wardId_idx` ON `issues` (`wardId`);--> statement-breakpoint
CREATE INDEX `issues_status_idx` ON `issues` (`status`);--> statement-breakpoint
CREATE INDEX `issues_createdAt_idx` ON `issues` (`createdAt`);--> statement-breakpoint
CREATE INDEX `notices_wardId_idx` ON `notices` (`wardId`);--> statement-breakpoint
CREATE INDEX `notices_category_idx` ON `notices` (`category`);--> statement-breakpoint
CREATE INDEX `notices_createdAt_idx` ON `notices` (`createdAt`);--> statement-breakpoint
CREATE INDEX `notifications_userId_idx` ON `notifications` (`userId`);--> statement-breakpoint
CREATE INDEX `notifications_isRead_idx` ON `notifications` (`isRead`);--> statement-breakpoint
CREATE INDEX `notifications_createdAt_idx` ON `notifications` (`createdAt`);--> statement-breakpoint
CREATE INDEX `resources_wardId_idx` ON `resources` (`wardId`);--> statement-breakpoint
CREATE INDEX `resources_category_idx` ON `resources` (`category`);--> statement-breakpoint
CREATE INDEX `sos_userId_idx` ON `sos_alerts` (`userId`);--> statement-breakpoint
CREATE INDEX `sos_wardId_idx` ON `sos_alerts` (`wardId`);--> statement-breakpoint
CREATE INDEX `sos_status_idx` ON `sos_alerts` (`status`);--> statement-breakpoint
CREATE INDEX `sos_createdAt_idx` ON `sos_alerts` (`createdAt`);--> statement-breakpoint
CREATE INDEX `volunteers_userId_idx` ON `volunteers` (`userId`);--> statement-breakpoint
CREATE INDEX `volunteers_wardId_idx` ON `volunteers` (`wardId`);--> statement-breakpoint
CREATE INDEX `volunteers_status_idx` ON `volunteers` (`status`);--> statement-breakpoint
CREATE INDEX `users_wardId_idx` ON `users` (`wardId`);