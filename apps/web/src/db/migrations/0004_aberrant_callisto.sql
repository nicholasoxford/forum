CREATE TABLE `pools` (
	`pool_address` text PRIMARY KEY NOT NULL,
	`token_mint_address` text NOT NULL,
	`owner_address` text NOT NULL,
	`mint_a` text NOT NULL,
	`mint_b` text NOT NULL,
	`shift` text NOT NULL,
	`initial_token_reserves` text NOT NULL,
	`royalties_bps` integer,
	`transaction_signature` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`token_mint_address`) REFERENCES `tokens`(`token_mint_address`) ON UPDATE no action ON DELETE no action
);
