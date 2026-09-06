-- Migration 0001: Add wards table and update users for email/password auth

-- 1. Create wards table
CREATE TABLE IF NOT EXISTS `wards` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `code` varchar(64) NOT NULL,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `wards_code_idx` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 2. Seed placeholder wards (replace with official data later)
INSERT IGNORE INTO `wards` (`name`, `code`) VALUES
  ('Ward 1 - Mirpur', 'WARD-001'),
  ('Ward 2 - Mirpur', 'WARD-002'),
  ('Ward 3 - Mirpur', 'WARD-003'),
  ('Ward 10 - Mirpur', 'WARD-010'),
  ('Ward 11 - Mirpur', 'WARD-011'),
  ('Ward 12 - Mirpur', 'WARD-012');

-- 3. Add new columns to users table
ALTER TABLE `users`
  ADD COLUMN `phone` varchar(32) DEFAULT NULL AFTER `email`,
  ADD COLUMN `passwordHash` varchar(255) DEFAULT NULL AFTER `phone`,
  ADD COLUMN `wardId` int DEFAULT NULL AFTER `passwordHash`;

-- 4. Make openId nullable (was NOT NULL for OAuth-only users)
ALTER TABLE `users` MODIFY COLUMN `openId` varchar(64) DEFAULT NULL;

-- 5. Add unique index on email (partial — only enforced for non-null emails at app level)
ALTER TABLE `users` ADD UNIQUE INDEX `users_email_idx` (`email`);

-- 6. Add index on wardId for fast lookups
ALTER TABLE `users` ADD INDEX `users_wardId_idx` (`wardId`);
