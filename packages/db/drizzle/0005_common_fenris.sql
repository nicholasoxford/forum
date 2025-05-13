CREATE TABLE `fun_keypairs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`public_key` varchar(255) NOT NULL,
	`private_key` varchar(1024) NOT NULL,
	`suffix` varchar(255) NOT NULL,
	`is_used` boolean NOT NULL DEFAULT false,
	`used_by_token_mint` varchar(255),
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`used_at` timestamp,
	CONSTRAINT `fun_keypairs_id` PRIMARY KEY(`id`),
	CONSTRAINT `fun_keypairs_public_key_unique` UNIQUE(`public_key`)
);
--> statement-breakpoint
CREATE INDEX `fun_keypairs_suffix_idx` ON `fun_keypairs` (`suffix`);--> statement-breakpoint
CREATE INDEX `fun_keypairs_used_idx` ON `fun_keypairs` (`is_used`);