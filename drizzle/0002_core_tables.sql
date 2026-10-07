-- Migration 0002: Core tables for WardConnect features

-- 1. Add isAdmin column to users
ALTER TABLE `users`
  ADD COLUMN `isAdmin` tinyint(1) NOT NULL DEFAULT 0 AFTER `role`;

-- 2. Issues (civic issue reports)
CREATE TABLE IF NOT EXISTS `issues` (
  `id` int NOT NULL AUTO_INCREMENT,
  `userId` int NOT NULL,
  `wardId` int NOT NULL,
  `category` varchar(128) NOT NULL,
  `title` varchar(255) NOT NULL,
  `description` text NOT NULL,
  `status` enum('submitted','acknowledged','in_progress','resolved','rejected') NOT NULL DEFAULT 'submitted',
  `severity` enum('normal','emergency') NOT NULL DEFAULT 'normal',
  `landmark` varchar(255) DEFAULT NULL,
  `photoUrl` varchar(512) DEFAULT NULL,
  `latitude` decimal(10,7) DEFAULT NULL,
  `longitude` decimal(10,7) DEFAULT NULL,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `issues_userId_idx` (`userId`),
  INDEX `issues_wardId_idx` (`wardId`),
  INDEX `issues_status_idx` (`status`),
  INDEX `issues_createdAt_idx` (`createdAt`),
  CONSTRAINT `issues_user_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  CONSTRAINT `issues_ward_fk` FOREIGN KEY (`wardId`) REFERENCES `wards`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 3. SOS Alerts
CREATE TABLE IF NOT EXISTS `sos_alerts` (
  `id` int NOT NULL AUTO_INCREMENT,
  `userId` int NOT NULL,
  `wardId` int NOT NULL,
  `type` varchar(64) NOT NULL,
  `status` enum('pending','dispatched','resolved','cancelled') NOT NULL DEFAULT 'pending',
  `note` text DEFAULT NULL,
  `latitude` decimal(10,7) DEFAULT NULL,
  `longitude` decimal(10,7) DEFAULT NULL,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `sos_userId_idx` (`userId`),
  INDEX `sos_wardId_idx` (`wardId`),
  INDEX `sos_status_idx` (`status`),
  INDEX `sos_createdAt_idx` (`createdAt`),
  CONSTRAINT `sos_user_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  CONSTRAINT `sos_ward_fk` FOREIGN KEY (`wardId`) REFERENCES `wards`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 4. Incidents (verified public incidents)
CREATE TABLE IF NOT EXISTS `incidents` (
  `id` int NOT NULL AUTO_INCREMENT,
  `wardId` int NOT NULL,
  `title` varchar(255) NOT NULL,
  `category` varchar(128) NOT NULL,
  `severity` enum('High','Medium','Low') NOT NULL,
  `description` text NOT NULL,
  `status` varchar(128) NOT NULL,
  `accent` varchar(16) DEFAULT NULL,
  `latitude` decimal(10,7) DEFAULT NULL,
  `longitude` decimal(10,7) DEFAULT NULL,
  `verifiedBy` int DEFAULT NULL,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `incidents_wardId_idx` (`wardId`),
  INDEX `incidents_severity_idx` (`severity`),
  INDEX `incidents_createdAt_idx` (`createdAt`),
  CONSTRAINT `incidents_ward_fk` FOREIGN KEY (`wardId`) REFERENCES `wards`(`id`) ON DELETE CASCADE,
  CONSTRAINT `incidents_verifiedBy_fk` FOREIGN KEY (`verifiedBy`) REFERENCES `users`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 5. Resources
CREATE TABLE IF NOT EXISTS `resources` (
  `id` int NOT NULL AUTO_INCREMENT,
  `wardId` int NOT NULL,
  `name` varchar(255) NOT NULL,
  `category` varchar(128) NOT NULL,
  `contactInfo` varchar(255) NOT NULL,
  `address` varchar(512) DEFAULT NULL,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `resources_wardId_idx` (`wardId`),
  INDEX `resources_category_idx` (`category`),
  CONSTRAINT `resources_ward_fk` FOREIGN KEY (`wardId`) REFERENCES `wards`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 6. Notices
CREATE TABLE IF NOT EXISTS `notices` (
  `id` int NOT NULL AUTO_INCREMENT,
  `wardId` int NOT NULL,
  `title` varchar(255) NOT NULL,
  `body` text NOT NULL,
  `category` enum('Emergency Alert','Utility Notice','General Notice') NOT NULL DEFAULT 'General Notice',
  `postedBy` int NOT NULL,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `notices_wardId_idx` (`wardId`),
  INDEX `notices_category_idx` (`category`),
  INDEX `notices_createdAt_idx` (`createdAt`),
  CONSTRAINT `notices_ward_fk` FOREIGN KEY (`wardId`) REFERENCES `wards`(`id`) ON DELETE CASCADE,
  CONSTRAINT `notices_postedBy_fk` FOREIGN KEY (`postedBy`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 7. Notifications (per-user)
CREATE TABLE IF NOT EXISTS `notifications` (
  `id` int NOT NULL AUTO_INCREMENT,
  `userId` int NOT NULL,
  `title` varchar(255) NOT NULL,
  `body` text NOT NULL,
  `isRead` tinyint(1) NOT NULL DEFAULT 0,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `notifications_userId_idx` (`userId`),
  INDEX `notifications_isRead_idx` (`isRead`),
  INDEX `notifications_createdAt_idx` (`createdAt`),
  CONSTRAINT `notifications_user_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 8. Volunteers
CREATE TABLE IF NOT EXISTS `volunteers` (
  `id` int NOT NULL AUTO_INCREMENT,
  `userId` int NOT NULL,
  `wardId` int NOT NULL,
  `skillsOrInterest` text DEFAULT NULL,
  `status` enum('pending','approved','active','inactive') NOT NULL DEFAULT 'pending',
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `volunteers_userId_idx` (`userId`),
  INDEX `volunteers_wardId_idx` (`wardId`),
  INDEX `volunteers_status_idx` (`status`),
  CONSTRAINT `volunteers_user_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  CONSTRAINT `volunteers_ward_fk` FOREIGN KEY (`wardId`) REFERENCES `wards`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
