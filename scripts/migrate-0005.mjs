#!/usr/bin/env node
/**
 * Applies drizzle/0005_ward_targeting_incident_volunteers.sql to the database
 * in .env, then carries over old ward-level volunteer offers that named an
 * incident into incident_volunteers. Safe to run twice: each step checks first.
 *
 * Usage:  node scripts/migrate-0005.mjs
 */
import "dotenv/config";
import mysql from "mysql2/promise";

const db = await mysql.createConnection(process.env.DATABASE_URL);
const has = async (sql, params) => (await db.query(sql, params))[0].length > 0;
const column = (t, c) => has("SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?", [t, c]);
const table = (t) => has("SELECT 1 FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?", [t]);

if (!(await column("notices", "allWards"))) {
  await db.query("ALTER TABLE `notices` ADD COLUMN `allWards` boolean NOT NULL DEFAULT false AFTER `wardId`, MODIFY `wardId` int NULL");
  const [r] = await db.query("UPDATE `notices` SET `allWards` = true");
  console.log(`notices.allWards added; ${r.affectedRows} existing notice(s) set to all wards`);
} else console.log("notices.allWards already there");

if (!(await table("notice_wards"))) {
  await db.query("CREATE TABLE `notice_wards` (`noticeId` int NOT NULL, `wardId` int NOT NULL, PRIMARY KEY (`noticeId`, `wardId`), KEY `notice_wards_wardId_idx` (`wardId`))");
  console.log("notice_wards created");
} else console.log("notice_wards already there");

if (!(await table("incident_volunteers"))) {
  await db.query(
    "CREATE TABLE `incident_volunteers` (`id` int AUTO_INCREMENT NOT NULL, `incidentId` int NOT NULL, `userId` int NOT NULL, `note` text, " +
      "`status` enum('pending','approved','declined') NOT NULL DEFAULT 'pending', `createdAt` timestamp NOT NULL DEFAULT (now()), " +
      "PRIMARY KEY (`id`), UNIQUE KEY `incident_volunteers_incident_user` (`incidentId`, `userId`), KEY `incident_volunteers_userId_idx` (`userId`))",
  );
  console.log("incident_volunteers created");

  // Old "I can help" offers were stored per ward with the incident in free text
  const [old] = await db.query("SELECT v.userId, v.status, v.skillsOrInterest, v.createdAt FROM volunteers v WHERE v.skillsOrInterest LIKE 'Wants to help with incident #%'");
  let moved = 0;
  for (const v of old) {
    const id = Number(/incident #(\d+)/.exec(v.skillsOrInterest)?.[1]);
    if (!id || !(await has("SELECT 1 FROM incidents WHERE id = ?", [id]))) continue;
    const status = v.status === "pending" ? "pending" : v.status === "inactive" ? "declined" : "approved";
    const [r] = await db.query("INSERT IGNORE INTO incident_volunteers (incidentId, userId, status, createdAt) VALUES (?, ?, ?, ?)", [id, v.userId, status, v.createdAt]);
    moved += r.affectedRows;
  }
  console.log(`carried over ${moved} incident volunteer offer(s)`);
} else console.log("incident_volunteers already there");

await db.end();
