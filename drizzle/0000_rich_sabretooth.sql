CREATE TABLE `refresh_runs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`status` enum('running','success','partial','failed') NOT NULL,
	`received_count` int NOT NULL DEFAULT 0,
	`accepted_count` int NOT NULL DEFAULT 0,
	`updated_count` int NOT NULL DEFAULT 0,
	`rejected_count` int NOT NULL DEFAULT 0,
	`details` text,
	`started_at` timestamp NOT NULL DEFAULT (now()),
	`finished_at` timestamp,
	CONSTRAINT `refresh_runs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `tracker_configs` (
	`id` varchar(32) NOT NULL,
	`schedule_cron_task_uid` varchar(65),
	`new_window_days` int NOT NULL DEFAULT 7,
	`last_refresh_at` timestamp,
	`last_refresh_status` enum('idle','running','success','partial','failed') NOT NULL DEFAULT 'idle',
	`last_refresh_message` text,
	`next_refresh_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `tracker_configs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` int AUTO_INCREMENT NOT NULL,
	`openId` varchar(64) NOT NULL,
	`name` text,
	`email` varchar(320),
	`loginMethod` varchar(64),
	`role` enum('user','admin') NOT NULL DEFAULT 'user',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`lastSignedIn` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `users_id` PRIMARY KEY(`id`),
	CONSTRAINT `users_openId_unique` UNIQUE(`openId`)
);
--> statement-breakpoint
CREATE TABLE `vacancies` (
	`id` int AUTO_INCREMENT NOT NULL,
	`source_url` varchar(1024) NOT NULL,
	`direct_application_url` varchar(1024),
	`source_label` varchar(128) NOT NULL,
	`company` varchar(255) NOT NULL,
	`title` varchar(255) NOT NULL,
	`region` enum('Poland remote','Cross-border remote','Global remote') NOT NULL,
	`work_model` varchar(255) NOT NULL,
	`match_score` int NOT NULL,
	`freshness` enum('Fresh','Current','Verify freshness','Confirm eligibility') NOT NULL DEFAULT 'Current',
	`freshness_detail` varchar(255) NOT NULL,
	`intro` text NOT NULL,
	`proof` json NOT NULL,
	`caveat` text NOT NULL,
	`tags` json NOT NULL,
	`dimensions` json NOT NULL,
	`raw_requirements` text,
	`source_published_at` timestamp,
	`first_seen_at` timestamp NOT NULL DEFAULT (now()),
	`last_seen_at` timestamp NOT NULL DEFAULT (now()),
	`is_baseline` boolean NOT NULL DEFAULT false,
	`is_active` boolean NOT NULL DEFAULT true,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `vacancies_id` PRIMARY KEY(`id`),
	CONSTRAINT `vacancies_source_url_unique` UNIQUE(`source_url`)
);
--> statement-breakpoint
CREATE INDEX `vacancies_region_active_idx` ON `vacancies` (`region`,`is_active`);--> statement-breakpoint
CREATE INDEX `vacancies_last_seen_idx` ON `vacancies` (`last_seen_at`);