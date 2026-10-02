-- Migration 0004: when the reporter last edited a report, and an optional photo on SOS alerts
ALTER TABLE `issues`
  ADD COLUMN `editedAt` timestamp NULL DEFAULT NULL AFTER `updatedAt`;
ALTER TABLE `sos_alerts`
  ADD COLUMN `photoUrl` varchar(512) DEFAULT NULL AFTER `note`;
