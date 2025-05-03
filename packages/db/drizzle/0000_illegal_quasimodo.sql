CREATE TABLE `fee_distributions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`token_mint_address` varchar(255) NOT NULL,
	`distribution_time` timestamp NOT NULL,
	`total_fees_distributed` varchar(255) NOT NULL,
	`number_of_recipients` int NOT NULL,
	`transaction_signature` varchar(255),
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `fee_distributions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `group_chats` (
	`token_mint_address` varchar(255) NOT NULL,
	`telegram_chat_id` varchar(255) NOT NULL,
	`telegram_username` varchar(255),
	`token_symbol` varchar(50) NOT NULL,
	`token_name` varchar(255) NOT NULL,
	`required_holdings` varchar(255) NOT NULL,
	`creator_wallet_address` varchar(255),
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `group_chats_token_mint_address` PRIMARY KEY(`token_mint_address`),
	CONSTRAINT `group_chats_telegram_chat_id_unique` UNIQUE(`telegram_chat_id`)
);
--> statement-breakpoint
CREATE TABLE `memberships` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_wallet_address` varchar(255) NOT NULL,
	`token_mint_address` varchar(255) NOT NULL,
	`is_eligible` boolean NOT NULL DEFAULT false,
	`last_checked_at` timestamp,
	`joined_telegram_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `memberships_id` PRIMARY KEY(`id`),
	CONSTRAINT `user_chat_unique_idx` UNIQUE(`user_wallet_address`,`token_mint_address`)
);
--> statement-breakpoint
CREATE TABLE `pools` (
	`pool_address` varchar(255) NOT NULL,
	`token_mint_address` varchar(255) NOT NULL,
	`owner_address` varchar(255) NOT NULL,
	`mint_a` varchar(255) NOT NULL,
	`mint_b` varchar(255) NOT NULL,
	`shift` varchar(255) NOT NULL,
	`initial_token_reserves` varchar(255) NOT NULL,
	`royalties_bps` int,
	`transaction_signature` varchar(255),
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `pools_pool_address` PRIMARY KEY(`pool_address`)
);
--> statement-breakpoint
CREATE TABLE `tokens` (
	`token_mint_address` varchar(255) NOT NULL,
	`token_symbol` varchar(50) NOT NULL,
	`token_name` varchar(255) NOT NULL,
	`decimals` int NOT NULL,
	`transfer_fee_basis_points` int NOT NULL,
	`maximum_fee` varchar(255) NOT NULL,
	`metadata_uri` varchar(255),
	`target_market_cap` varchar(255),
	`creator_wallet_address` varchar(255) NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `tokens_token_mint_address` PRIMARY KEY(`token_mint_address`)
);
--> statement-breakpoint
CREATE TABLE `transactions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`type` varchar(50) NOT NULL,
	`status` varchar(20) NOT NULL DEFAULT 'pending',
	`transaction_signature` varchar(255),
	`user_wallet_address` varchar(255) NOT NULL,
	`token_mint_address` varchar(255),
	`pool_address` varchar(255),
	`amount_a` varchar(255),
	`amount_b` varchar(255),
	`mint_a` varchar(255),
	`mint_b` varchar(255),
	`fee_paid` varchar(255),
	`metadata` varchar(1024),
	`error_message` varchar(1024),
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`confirmed_at` timestamp,
	CONSTRAINT `transactions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `users` (
	`wallet_address` varchar(255) NOT NULL,
	`username` varchar(255),
	`telegram_user_id` varchar(255),
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `users_wallet_address` PRIMARY KEY(`wallet_address`)
);
--> statement-breakpoint
ALTER TABLE `fee_distributions` ADD CONSTRAINT `fee_distributions_token_mint_address_group_chats_token_mint_address_fk` FOREIGN KEY (`token_mint_address`) REFERENCES `group_chats`(`token_mint_address`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `group_chats` ADD CONSTRAINT `group_chats_token_mint_address_tokens_token_mint_address_fk` FOREIGN KEY (`token_mint_address`) REFERENCES `tokens`(`token_mint_address`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `group_chats` ADD CONSTRAINT `group_chats_creator_wallet_address_users_wallet_address_fk` FOREIGN KEY (`creator_wallet_address`) REFERENCES `users`(`wallet_address`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `memberships` ADD CONSTRAINT `memberships_user_wallet_address_users_wallet_address_fk` FOREIGN KEY (`user_wallet_address`) REFERENCES `users`(`wallet_address`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `memberships` ADD CONSTRAINT `memberships_token_mint_address_group_chats_token_mint_address_fk` FOREIGN KEY (`token_mint_address`) REFERENCES `group_chats`(`token_mint_address`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `pools` ADD CONSTRAINT `pools_token_mint_address_tokens_token_mint_address_fk` FOREIGN KEY (`token_mint_address`) REFERENCES `tokens`(`token_mint_address`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `tokens` ADD CONSTRAINT `tokens_creator_wallet_address_users_wallet_address_fk` FOREIGN KEY (`creator_wallet_address`) REFERENCES `users`(`wallet_address`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `transactions` ADD CONSTRAINT `transactions_user_wallet_address_users_wallet_address_fk` FOREIGN KEY (`user_wallet_address`) REFERENCES `users`(`wallet_address`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `transactions` ADD CONSTRAINT `transactions_token_mint_address_tokens_token_mint_address_fk` FOREIGN KEY (`token_mint_address`) REFERENCES `tokens`(`token_mint_address`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `transactions` ADD CONSTRAINT `transactions_pool_address_pools_pool_address_fk` FOREIGN KEY (`pool_address`) REFERENCES `pools`(`pool_address`) ON DELETE no action ON UPDATE no action;