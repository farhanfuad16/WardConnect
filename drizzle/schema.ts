import {
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
  decimal,
  boolean,
  uniqueIndex,
  index,
} from "drizzle-orm/mysql-core";

// ── Wards ───────────────────────────────────────────────────────────

export const wards = mysqlTable("wards", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  code: varchar("code", { length: 64 }).notNull().unique(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Ward = typeof wards.$inferSelect;
export type InsertWard = typeof wards.$inferInsert;

// ── Users ───────────────────────────────────────────────────────────

export const users = mysqlTable(
  "users",
  {
    id: int("id").autoincrement().primaryKey(),
    openId: varchar("openId", { length: 64 }),
    name: varchar("name", { length: 255 }),
    email: varchar("email", { length: 320 }),
    phone: varchar("phone", { length: 32 }),
    passwordHash: varchar("passwordHash", { length: 255 }),
    wardId: int("wardId"),
    loginMethod: varchar("loginMethod", { length: 64 }),
    role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
    isAdmin: boolean("isAdmin").default(false).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
    lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("users_openId_idx").on(table.openId),
    uniqueIndex("users_email_idx").on(table.email),
    index("users_wardId_idx").on(table.wardId),
  ],
);

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ── Issues (civic issue reports) ────────────────────────────────────

export const issues = mysqlTable(
  "issues",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull(),
    wardId: int("wardId").notNull(),
    category: varchar("category", { length: 128 }).notNull(),
    title: varchar("title", { length: 255 }).notNull(),
    description: text("description").notNull(),
    status: mysqlEnum("status", [
      "submitted",
      "acknowledged",
      "in_progress",
      "resolved",
      "rejected",
    ])
      .default("submitted")
      .notNull(),
    severity: mysqlEnum("severity", ["normal", "emergency"])
      .default("normal")
      .notNull(),
    landmark: varchar("landmark", { length: 255 }),
    photoUrl: varchar("photoUrl", { length: 512 }),
    latitude: decimal("latitude", { precision: 10, scale: 7 }),
    longitude: decimal("longitude", { precision: 10, scale: 7 }),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => [
    index("issues_userId_idx").on(table.userId),
    index("issues_wardId_idx").on(table.wardId),
    index("issues_status_idx").on(table.status),
    index("issues_createdAt_idx").on(table.createdAt),
  ],
);

export type Issue = typeof issues.$inferSelect;
export type InsertIssue = typeof issues.$inferInsert;

// ── SOS Alerts ──────────────────────────────────────────────────────

export const sosAlerts = mysqlTable(
  "sos_alerts",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull(),
    wardId: int("wardId").notNull(),
    type: varchar("type", { length: 64 }).notNull(),
    status: mysqlEnum("status", ["pending", "dispatched", "resolved", "cancelled"])
      .default("pending")
      .notNull(),
    note: text("note"),
    latitude: decimal("latitude", { precision: 10, scale: 7 }),
    longitude: decimal("longitude", { precision: 10, scale: 7 }),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => [
    index("sos_userId_idx").on(table.userId),
    index("sos_wardId_idx").on(table.wardId),
    index("sos_status_idx").on(table.status),
    index("sos_createdAt_idx").on(table.createdAt),
  ],
);

export type SosAlert = typeof sosAlerts.$inferSelect;
export type InsertSosAlert = typeof sosAlerts.$inferInsert;

// ── Incidents (verified public incidents) ───────────────────────────

export const incidents = mysqlTable(
  "incidents",
  {
    id: int("id").autoincrement().primaryKey(),
    wardId: int("wardId").notNull(),
    title: varchar("title", { length: 255 }).notNull(),
    category: varchar("category", { length: 128 }).notNull(),
    severity: mysqlEnum("severity", ["High", "Medium", "Low"]).notNull(),
    description: text("description").notNull(),
    status: varchar("status", { length: 128 }).notNull(),
    accent: varchar("accent", { length: 16 }),
    latitude: decimal("latitude", { precision: 10, scale: 7 }),
    longitude: decimal("longitude", { precision: 10, scale: 7 }),
    verifiedBy: int("verifiedBy"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => [
    index("incidents_wardId_idx").on(table.wardId),
    index("incidents_severity_idx").on(table.severity),
    index("incidents_createdAt_idx").on(table.createdAt),
  ],
);

export type Incident = typeof incidents.$inferSelect;
export type InsertIncident = typeof incidents.$inferInsert;

// ── Resources ───────────────────────────────────────────────────────

export const resources = mysqlTable(
  "resources",
  {
    id: int("id").autoincrement().primaryKey(),
    wardId: int("wardId").notNull(),
    name: varchar("name", { length: 255 }).notNull(),
    category: varchar("category", { length: 128 }).notNull(),
    contactInfo: varchar("contactInfo", { length: 255 }).notNull(),
    address: varchar("address", { length: 512 }),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => [
    index("resources_wardId_idx").on(table.wardId),
    index("resources_category_idx").on(table.category),
  ],
);

export type Resource = typeof resources.$inferSelect;
export type InsertResource = typeof resources.$inferInsert;

// ── Notices ─────────────────────────────────────────────────────────

export const notices = mysqlTable(
  "notices",
  {
    id: int("id").autoincrement().primaryKey(),
    wardId: int("wardId").notNull(),
    title: varchar("title", { length: 255 }).notNull(),
    body: text("body").notNull(),
    category: mysqlEnum("category", ["Emergency Alert", "Utility Notice", "General Notice"])
      .default("General Notice")
      .notNull(),
    postedBy: int("postedBy").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => [
    index("notices_wardId_idx").on(table.wardId),
    index("notices_category_idx").on(table.category),
    index("notices_createdAt_idx").on(table.createdAt),
  ],
);

export type Notice = typeof notices.$inferSelect;
export type InsertNotice = typeof notices.$inferInsert;

// ── Notifications (per-user) ────────────────────────────────────────

export const notifications = mysqlTable(
  "notifications",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull(),
    title: varchar("title", { length: 255 }).notNull(),
    body: text("body").notNull(),
    isRead: boolean("isRead").default(false).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => [
    index("notifications_userId_idx").on(table.userId),
    index("notifications_isRead_idx").on(table.isRead),
    index("notifications_createdAt_idx").on(table.createdAt),
  ],
);

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = typeof notifications.$inferInsert;

// ── Volunteers ──────────────────────────────────────────────────────

export const volunteers = mysqlTable(
  "volunteers",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull(),
    wardId: int("wardId").notNull(),
    skillsOrInterest: text("skillsOrInterest"),
    status: mysqlEnum("status", ["pending", "approved", "active", "inactive"])
      .default("pending")
      .notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => [
    index("volunteers_userId_idx").on(table.userId),
    index("volunteers_wardId_idx").on(table.wardId),
    index("volunteers_status_idx").on(table.status),
  ],
);

export type Volunteer = typeof volunteers.$inferSelect;
export type InsertVolunteer = typeof volunteers.$inferInsert;
