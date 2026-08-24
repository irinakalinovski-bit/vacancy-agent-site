CREATE TABLE `manual_search_requests` (
	`id` int AUTO_INCREMENT NOT NULL,
	`request_code` varchar(32) NOT NULL,
	`requested_by_user_id` int,
	`status` enum('requested','researching','completed','failed') NOT NULL DEFAULT 'requested',
	`requested_at` timestamp NOT NULL DEFAULT (now()),
	`completed_at` timestamp,
	`result_summary` text,
	CONSTRAINT `manual_search_requests_id` PRIMARY KEY(`id`),
	CONSTRAINT `manual_search_requests_request_code_unique` UNIQUE(`request_code`)
);
--> statement-breakpoint
CREATE INDEX `manual_search_requests_status_idx` ON `manual_search_requests` (`status`,`requested_at`);