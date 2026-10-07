import { relations } from "drizzle-orm";
import {
  users,
  wards,
  issues,
  sosAlerts,
  incidents,
  resources,
  notices,
  notifications,
  volunteers,
} from "./schema";

// ── Wards ───────────────────────────────────────────────────────────

export const wardsRelations = relations(wards, ({ many }) => ({
  users: many(users),
  issues: many(issues),
  sosAlerts: many(sosAlerts),
  incidents: many(incidents),
  resources: many(resources),
  notices: many(notices),
  volunteers: many(volunteers),
}));

// ── Users ───────────────────────────────────────────────────────────

export const usersRelations = relations(users, ({ one, many }) => ({
  ward: one(wards, {
    fields: [users.wardId],
    references: [wards.id],
  }),
  issues: many(issues),
  sosAlerts: many(sosAlerts),
  notifications: many(notifications),
  volunteers: many(volunteers),
}));

// ── Issues ──────────────────────────────────────────────────────────

export const issuesRelations = relations(issues, ({ one }) => ({
  user: one(users, {
    fields: [issues.userId],
    references: [users.id],
  }),
  ward: one(wards, {
    fields: [issues.wardId],
    references: [wards.id],
  }),
}));

// ── SOS Alerts ──────────────────────────────────────────────────────

export const sosAlertsRelations = relations(sosAlerts, ({ one }) => ({
  user: one(users, {
    fields: [sosAlerts.userId],
    references: [users.id],
  }),
  ward: one(wards, {
    fields: [sosAlerts.wardId],
    references: [wards.id],
  }),
}));

// ── Incidents ───────────────────────────────────────────────────────

export const incidentsRelations = relations(incidents, ({ one }) => ({
  ward: one(wards, {
    fields: [incidents.wardId],
    references: [wards.id],
  }),
  verifiedByUser: one(users, {
    fields: [incidents.verifiedBy],
    references: [users.id],
  }),
}));

// ── Resources ───────────────────────────────────────────────────────

export const resourcesRelations = relations(resources, ({ one }) => ({
  ward: one(wards, {
    fields: [resources.wardId],
    references: [wards.id],
  }),
}));

// ── Notices ─────────────────────────────────────────────────────────

export const noticesRelations = relations(notices, ({ one }) => ({
  ward: one(wards, {
    fields: [notices.wardId],
    references: [wards.id],
  }),
  postedByUser: one(users, {
    fields: [notices.postedBy],
    references: [users.id],
  }),
}));

// ── Notifications ───────────────────────────────────────────────────

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
  }),
}));

// ── Volunteers ──────────────────────────────────────────────────────

export const volunteersRelations = relations(volunteers, ({ one }) => ({
  user: one(users, {
    fields: [volunteers.userId],
    references: [users.id],
  }),
  ward: one(wards, {
    fields: [volunteers.wardId],
    references: [wards.id],
  }),
}));
