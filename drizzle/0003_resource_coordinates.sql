-- Migration 0003: map coordinates for resources (incidents/issues/sos already have them)
ALTER TABLE `resources`
  ADD COLUMN `latitude` decimal(10,7) DEFAULT NULL AFTER `description`,
  ADD COLUMN `longitude` decimal(10,7) DEFAULT NULL AFTER `latitude`;
