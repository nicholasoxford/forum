ALTER TABLE `fee_distributions` DROP FOREIGN KEY `fee_distributions_token_mint_address_group_chats_token_mint_address_fk`;
--> statement-breakpoint
ALTER TABLE `group_chats` DROP FOREIGN KEY `group_chats_token_mint_address_tokens_token_mint_address_fk`;
--> statement-breakpoint
ALTER TABLE `group_chats` DROP FOREIGN KEY `group_chats_creator_wallet_address_users_wallet_address_fk`;
--> statement-breakpoint
ALTER TABLE `memberships` DROP FOREIGN KEY `memberships_user_wallet_address_users_wallet_address_fk`;
--> statement-breakpoint
ALTER TABLE `memberships` DROP FOREIGN KEY `memberships_token_mint_address_group_chats_token_mint_address_fk`;
--> statement-breakpoint
ALTER TABLE `pools` DROP FOREIGN KEY `pools_token_mint_address_tokens_token_mint_address_fk`;
--> statement-breakpoint
ALTER TABLE `tokens` DROP FOREIGN KEY `tokens_creator_wallet_address_users_wallet_address_fk`;
--> statement-breakpoint
ALTER TABLE `transactions` DROP FOREIGN KEY `transactions_user_wallet_address_users_wallet_address_fk`;
--> statement-breakpoint
ALTER TABLE `transactions` DROP FOREIGN KEY `transactions_token_mint_address_tokens_token_mint_address_fk`;
--> statement-breakpoint
ALTER TABLE `transactions` DROP FOREIGN KEY `transactions_pool_address_pools_pool_address_fk`;
--> statement-breakpoint
ALTER TABLE `fee_distributions` ADD CONSTRAINT `fee_dist_token_fk` FOREIGN KEY (`token_mint_address`) REFERENCES `group_chats`(`token_mint_address`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `group_chats` ADD CONSTRAINT `groupchats_token_fk` FOREIGN KEY (`token_mint_address`) REFERENCES `tokens`(`token_mint_address`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `group_chats` ADD CONSTRAINT `groupchats_creator_fk` FOREIGN KEY (`creator_wallet_address`) REFERENCES `users`(`wallet_address`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `memberships` ADD CONSTRAINT `memberships_user_fk` FOREIGN KEY (`user_wallet_address`) REFERENCES `users`(`wallet_address`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `memberships` ADD CONSTRAINT `memberships_token_fk` FOREIGN KEY (`token_mint_address`) REFERENCES `group_chats`(`token_mint_address`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `pools` ADD CONSTRAINT `pools_token_fk` FOREIGN KEY (`token_mint_address`) REFERENCES `tokens`(`token_mint_address`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `tokens` ADD CONSTRAINT `tokens_creator_fk` FOREIGN KEY (`creator_wallet_address`) REFERENCES `users`(`wallet_address`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `transactions` ADD CONSTRAINT `tx_user_fk` FOREIGN KEY (`user_wallet_address`) REFERENCES `users`(`wallet_address`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `transactions` ADD CONSTRAINT `tx_token_fk` FOREIGN KEY (`token_mint_address`) REFERENCES `tokens`(`token_mint_address`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `transactions` ADD CONSTRAINT `tx_pool_fk` FOREIGN KEY (`pool_address`) REFERENCES `pools`(`pool_address`) ON DELETE no action ON UPDATE no action;