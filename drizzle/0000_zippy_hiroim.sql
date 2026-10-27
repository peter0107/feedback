CREATE TABLE `feedback` (
	`id` text PRIMARY KEY NOT NULL,
	`team` text NOT NULL,
	`body` text NOT NULL,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')) NOT NULL
);
--> statement-breakpoint
CREATE INDEX `feedback_team_created_idx` ON `feedback` (`team`,`created_at`);