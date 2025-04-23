-- Create the tokens table
CREATE TABLE IF NOT EXISTS `tokens` (
    `token_mint_address` text PRIMARY KEY NOT NULL,
    `token_symbol` text NOT NULL,
    `token_name` text NOT NULL,
    `decimals` integer NOT NULL,
    `transfer_fee_basis_points` integer NOT NULL,
    `maximum_fee` text NOT NULL,
    `metadata_uri` text,
    `creator_wallet_address` text NOT NULL,
    `created_at` integer DEFAULT (unixepoch()) NOT NULL,
    FOREIGN KEY (`creator_wallet_address`) REFERENCES `users`(`wallet_address`) ON UPDATE no action ON DELETE no action
);

-- Create a temporary table for group_chats with the new structure
CREATE TABLE `group_chats_new` (
    `token_mint_address` text PRIMARY KEY NOT NULL,
    `telegram_chat_id` text NOT NULL UNIQUE,
    `token_symbol` text NOT NULL,
    `token_name` text NOT NULL,
    `required_holdings` text NOT NULL,
    `creator_wallet_address` text,
    `created_at` integer DEFAULT (unixepoch()) NOT NULL,
    FOREIGN KEY (`token_mint_address`) REFERENCES `tokens`(`token_mint_address`) ON UPDATE no action ON DELETE no action,
    FOREIGN KEY (`creator_wallet_address`) REFERENCES `users`(`wallet_address`) ON UPDATE no action ON DELETE no action
);

-- Copy data from the old table to the new table
INSERT INTO
    `group_chats_new`
SELECT
    *
FROM
    `group_chats`;

-- Drop the old table
DROP TABLE `group_chats`;

-- Rename the new table to the original name
ALTER TABLE
    `group_chats_new` RENAME TO `group_chats`;