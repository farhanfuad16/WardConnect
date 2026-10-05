-- Migration 0005: notices target chosen wards (or all wards); volunteers offer help per incident
-- Applied with scripts/migrate-0005.mjs, which also carries over old ward-level
-- volunteer offers that named an incident ("Wants to help with incident #N").

-- Notices: "all wards" flag + a list of target wards. The old single wardId was
-- just the posting admin's own ward, so it's no longer written.
ALTER TABLE `notices`
  ADD COLUMN `allWards` boolean NOT NULL DEFAULT false AFTER `wardId`,
  MODIFY `wardId` int NULL;
-- Every existing notice was shown to everyone
UPDATE `notices` SET `allWards` = true;

CREATE TABLE `notice_wards` (
  `noticeId` int NOT NULL,
  `wardId` int NOT NULL,
  PRIMARY KEY (`noticeId`, `wardId`),
  KEY `notice_wards_wardId_idx` (`wardId`)
);

-- One offer per resident per incident; the admin approves or declines it
CREATE TABLE `incident_volunteers` (
  `id` int AUTO_INCREMENT NOT NULL,
  `incidentId` int NOT NULL,
  `userId` int NOT NULL,
  `note` text,
  `status` enum('pending','approved','declined') NOT NULL DEFAULT 'pending',
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  PRIMARY KEY (`id`),
  UNIQUE KEY `incident_volunteers_incident_user` (`incidentId`, `userId`),
  KEY `incident_volunteers_userId_idx` (`userId`)
);
