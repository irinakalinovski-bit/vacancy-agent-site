CREATE TABLE `vacancy_preferences` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`vacancy_id` int NOT NULL,
	`status` enum('saved','hidden') NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `vacancy_preferences_id` PRIMARY KEY(`id`),
	CONSTRAINT `vacancy_preferences_user_vacancy_unique` UNIQUE(`user_id`,`vacancy_id`)
);
--> statement-breakpoint
ALTER TABLE `vacancy_preferences` ADD CONSTRAINT `vacancy_preferences_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `vacancy_preferences` ADD CONSTRAINT `vacancy_preferences_vacancy_id_vacancies_id_fk` FOREIGN KEY (`vacancy_id`) REFERENCES `vacancies`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `vacancy_preferences_user_status_idx` ON `vacancy_preferences` (`user_id`,`status`);