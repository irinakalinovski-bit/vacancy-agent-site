/**
 * VACANCY TRACKER — durable domain schema
 * Timestamps are UTC. The report is public; scheduled write access is restricted to authenticated cron calls.
 */
import { boolean, index, integer, jsonb, pgEnum, pgTable, serial, text, timestamp, uniqueIndex, varchar } from "drizzle-orm/pg-core";

const userRoleEnum = pgEnum("user_role", ["user", "admin"]);
const refreshStatusEnum = pgEnum("refresh_status", ["idle", "running", "success", "partial", "failed"]);
const vacancyRegionEnum = pgEnum("vacancy_region", ["Wrocław onsite/hybrid", "Poland remote", "Europe remote", "Cross-border remote", "Global remote"]);
const vacancyFreshnessEnum = pgEnum("vacancy_freshness", ["Fresh", "Current", "Verify freshness", "Confirm eligibility"]);
const preferenceStatusEnum = pgEnum("preference_status", ["saved", "hidden"]);
const refreshRunStatusEnum = pgEnum("refresh_run_status", ["running", "success", "partial", "failed"]);
const researchRequestStatusEnum = pgEnum("research_request_status", ["requested", "researching", "completed", "failed"]);

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: userRoleEnum("role").default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().$onUpdate(() => new Date()).notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

/** One row owns the project-wide refresh policy and its cron identity. */
export const trackerConfigs = pgTable("tracker_configs", {
  id: varchar("id", { length: 32 }).primaryKey(),
  scheduleCronTaskUid: varchar("schedule_cron_task_uid", { length: 65 }),
  newWindowDays: integer("new_window_days").notNull().default(7),
  lastRefreshAt: timestamp("last_refresh_at"),
  lastRefreshStatus: refreshStatusEnum("last_refresh_status").notNull().default("idle"),
  lastRefreshMessage: text("last_refresh_message"),
  nextRefreshAt: timestamp("next_refresh_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().$onUpdate(() => new Date()).notNull(),
});

/** A source-linked vacancy. sourceUrl is the durable deduplication key. */
export const vacancies = pgTable("vacancies", {
  id: serial("id").primaryKey(),
  sourceUrl: varchar("source_url", { length: 1024 }).notNull().unique(),
  directApplicationUrl: varchar("direct_application_url", { length: 1024 }),
  sourceLabel: varchar("source_label", { length: 128 }).notNull(),
  company: varchar("company", { length: 255 }).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  region: vacancyRegionEnum("region").notNull(),
  workModel: varchar("work_model", { length: 255 }).notNull(),
  matchScore: integer("match_score").notNull(),
  freshness: vacancyFreshnessEnum("freshness").notNull().default("Current"),
  freshnessDetail: varchar("freshness_detail", { length: 255 }).notNull(),
  intro: text("intro").notNull(),
  proof: jsonb("proof").$type<string[]>().notNull(),
  caveat: text("caveat").notNull(),
  tags: jsonb("tags").$type<string[]>().notNull(),
  dimensions: jsonb("dimensions").$type<Array<{ label: string; value: number }>>().notNull(),
  rawRequirements: text("raw_requirements"),
  sourcePublishedAt: timestamp("source_published_at"),
  firstSeenAt: timestamp("first_seen_at").defaultNow().notNull(),
  lastSeenAt: timestamp("last_seen_at").defaultNow().notNull(),
  isBaseline: boolean("is_baseline").notNull().default(false),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().$onUpdate(() => new Date()).notNull(),
}, (table) => [index("vacancies_region_active_idx").on(table.region, table.isActive), index("vacancies_last_seen_idx").on(table.lastSeenAt)]);

/** A signed-in user's private saved or hidden state for one shared shortlist vacancy. */
export const vacancyPreferences = pgTable("vacancy_preferences", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  vacancyId: integer("vacancy_id").notNull().references(() => vacancies.id, { onDelete: "cascade" }),
  status: preferenceStatusEnum("status").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().$onUpdate(() => new Date()).notNull(),
}, (table) => [
  uniqueIndex("vacancy_preferences_user_vacancy_unique").on(table.userId, table.vacancyId),
  index("vacancy_preferences_user_status_idx").on(table.userId, table.status),
]);

/** Immutable, auditable result for each received automatic refresh. */
export const refreshRuns = pgTable("refresh_runs", {
  id: serial("id").primaryKey(),
  status: refreshRunStatusEnum("status").notNull(),
  receivedCount: integer("received_count").notNull().default(0),
  acceptedCount: integer("accepted_count").notNull().default(0),
  updatedCount: integer("updated_count").notNull().default(0),
  rejectedCount: integer("rejected_count").notNull().default(0),
  details: text("details"),
  startedAt: timestamp("started_at").defaultNow().notNull(),
  finishedAt: timestamp("finished_at"),
});

/** A user-initiated research request that is fulfilled manually in the companion chat. */
export const manualSearchRequests = pgTable("manual_search_requests", {
  id: serial("id").primaryKey(),
  requestCode: varchar("request_code", { length: 32 }).notNull().unique(),
  requestedByUserId: integer("requested_by_user_id"),
  status: researchRequestStatusEnum("status").notNull().default("requested"),
  requestedAt: timestamp("requested_at").defaultNow().notNull(),
  completedAt: timestamp("completed_at"),
  resultSummary: text("result_summary"),
}, (table) => [index("manual_search_requests_status_idx").on(table.status, table.requestedAt)]);

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type Vacancy = typeof vacancies.$inferSelect;
export type InsertVacancy = typeof vacancies.$inferInsert;
