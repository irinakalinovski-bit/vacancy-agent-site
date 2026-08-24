CREATE TYPE "user_role" AS ENUM ('user','admin');
CREATE TYPE "refresh_status" AS ENUM ('idle','running','success','partial','failed');
CREATE TYPE "vacancy_region" AS ENUM ('Wrocław onsite/hybrid','Poland remote','Europe remote','Cross-border remote','Global remote');
CREATE TYPE "vacancy_freshness" AS ENUM ('Fresh','Current','Verify freshness','Confirm eligibility');
CREATE TYPE "preference_status" AS ENUM ('saved','hidden');
CREATE TYPE "refresh_run_status" AS ENUM ('running','success','partial','failed');
CREATE TYPE "research_request_status" AS ENUM ('requested','researching','completed','failed');

CREATE TABLE "users" (
  "id" serial PRIMARY KEY,
  "openId" varchar(64) NOT NULL UNIQUE,
  "name" text,
  "email" varchar(320),
  "loginMethod" varchar(64),
  "role" "user_role" NOT NULL DEFAULT 'user',
  "createdAt" timestamp NOT NULL DEFAULT now(),
  "updatedAt" timestamp NOT NULL DEFAULT now(),
  "lastSignedIn" timestamp NOT NULL DEFAULT now()
);
CREATE TABLE "tracker_configs" (
  "id" varchar(32) PRIMARY KEY,
  "schedule_cron_task_uid" varchar(65),
  "new_window_days" integer NOT NULL DEFAULT 7,
  "last_refresh_at" timestamp,
  "last_refresh_status" "refresh_status" NOT NULL DEFAULT 'idle',
  "last_refresh_message" text,
  "next_refresh_at" timestamp,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now()
);
CREATE TABLE "vacancies" (
  "id" serial PRIMARY KEY,
  "source_url" varchar(1024) NOT NULL UNIQUE,
  "direct_application_url" varchar(1024),
  "source_label" varchar(128) NOT NULL,
  "company" varchar(255) NOT NULL,
  "title" varchar(255) NOT NULL,
  "region" "vacancy_region" NOT NULL,
  "work_model" varchar(255) NOT NULL,
  "match_score" integer NOT NULL,
  "freshness" "vacancy_freshness" NOT NULL DEFAULT 'Current',
  "freshness_detail" varchar(255) NOT NULL,
  "intro" text NOT NULL,
  "proof" jsonb NOT NULL,
  "caveat" text NOT NULL,
  "tags" jsonb NOT NULL,
  "dimensions" jsonb NOT NULL,
  "raw_requirements" text,
  "source_published_at" timestamp,
  "first_seen_at" timestamp NOT NULL DEFAULT now(),
  "last_seen_at" timestamp NOT NULL DEFAULT now(),
  "is_baseline" boolean NOT NULL DEFAULT false,
  "is_active" boolean NOT NULL DEFAULT true,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now()
);
CREATE INDEX "vacancies_region_active_idx" ON "vacancies" ("region","is_active");
CREATE INDEX "vacancies_last_seen_idx" ON "vacancies" ("last_seen_at");
CREATE TABLE "vacancy_preferences" (
  "id" serial PRIMARY KEY,
  "user_id" integer NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "vacancy_id" integer NOT NULL REFERENCES "vacancies"("id") ON DELETE CASCADE,
  "status" "preference_status" NOT NULL,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now(),
  CONSTRAINT "vacancy_preferences_user_vacancy_unique" UNIQUE ("user_id","vacancy_id")
);
CREATE INDEX "vacancy_preferences_user_status_idx" ON "vacancy_preferences" ("user_id","status");
CREATE TABLE "refresh_runs" (
  "id" serial PRIMARY KEY,
  "status" "refresh_run_status" NOT NULL,
  "received_count" integer NOT NULL DEFAULT 0,
  "accepted_count" integer NOT NULL DEFAULT 0,
  "updated_count" integer NOT NULL DEFAULT 0,
  "rejected_count" integer NOT NULL DEFAULT 0,
  "details" text,
  "started_at" timestamp NOT NULL DEFAULT now(),
  "finished_at" timestamp
);
CREATE TABLE "manual_search_requests" (
  "id" serial PRIMARY KEY,
  "request_code" varchar(32) NOT NULL UNIQUE,
  "requested_by_user_id" integer,
  "status" "research_request_status" NOT NULL DEFAULT 'requested',
  "requested_at" timestamp NOT NULL DEFAULT now(),
  "completed_at" timestamp,
  "result_summary" text
);
CREATE INDEX "manual_search_requests_status_idx" ON "manual_search_requests" ("status","requested_at");
