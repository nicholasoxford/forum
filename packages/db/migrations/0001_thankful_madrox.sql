CREATE TABLE `fee_distributions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`token_mint_address` text NOT NULL,
	`distribution_time` integer NOT NULL,
	`total_fees_distributed` text NOT NULL,
	`number_of_recipients` integer NOT NULL,
	`transaction_signature` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`token_mint_address`) REFERENCES `group_chats`(`token_mint_address`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `group_chats` (
	`token_mint_address` text PRIMARY KEY NOT NULL,
	`telegram_chat_id` text NOT NULL,
	`token_symbol` text NOT NULL,
	`token_name` text NOT NULL,
	`required_holdings` text NOT NULL,
	`creator_wallet_address` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`creator_wallet_address`) REFERENCES `users`(`wallet_address`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `group_chats_telegram_chat_id_unique` ON `group_chats` (`telegram_chat_id`);--> statement-breakpoint
CREATE TABLE `memberships` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_wallet_address` text NOT NULL,
	`token_mint_address` text NOT NULL,
	`is_eligible` integer DEFAULT false NOT NULL,
	`last_checked_at` integer,
	`joined_telegram_at` integer,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`user_wallet_address`) REFERENCES `users`(`wallet_address`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`token_mint_address`) REFERENCES `group_chats`(`token_mint_address`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `user_chat_unique_idx` ON `memberships` (`user_wallet_address`,`token_mint_address`);--> statement-breakpoint
ALTER TABLE `users` ADD `username` text;--> statement-breakpoint
ALTER TABLE `users` ADD `telegram_user_id` text;