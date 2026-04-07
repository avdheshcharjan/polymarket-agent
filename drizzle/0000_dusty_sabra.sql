CREATE TABLE `analyses` (
	`id` text PRIMARY KEY NOT NULL,
	`market_id` text NOT NULL,
	`estimated_probability` real NOT NULL,
	`confidence` real NOT NULL,
	`edge` real NOT NULL,
	`summary` text NOT NULL,
	`bull_case` text NOT NULL,
	`bear_case` text NOT NULL,
	`key_factors` text NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`market_id`) REFERENCES `markets`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `decisions` (
	`id` text PRIMARY KEY NOT NULL,
	`market_id` text NOT NULL,
	`action` text NOT NULL,
	`confidence` real NOT NULL,
	`reasoning` text NOT NULL,
	`research_ids` text NOT NULL,
	`estimated_probability` real NOT NULL,
	`market_price` real NOT NULL,
	`edge` real NOT NULL,
	`size` real NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`market_id`) REFERENCES `markets`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `markets` (
	`id` text PRIMARY KEY NOT NULL,
	`question` text NOT NULL,
	`slug` text NOT NULL,
	`outcomes` text NOT NULL,
	`outcome_prices` text NOT NULL,
	`volume` real DEFAULT 0 NOT NULL,
	`volume_24hr` real DEFAULT 0 NOT NULL,
	`liquidity` real DEFAULT 0 NOT NULL,
	`end_date` text NOT NULL,
	`image` text DEFAULT '',
	`best_bid` real DEFAULT 0,
	`best_ask` real DEFAULT 0,
	`spread` real DEFAULT 0,
	`clob_token_ids` text NOT NULL,
	`event_title` text DEFAULT '',
	`event_slug` text DEFAULT '',
	`active` integer DEFAULT true NOT NULL,
	`closed` integer DEFAULT false NOT NULL,
	`last_updated` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `portfolio_snapshots` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`timestamp` text NOT NULL,
	`total_value` real NOT NULL,
	`cash_balance` real NOT NULL,
	`positions_value` real NOT NULL,
	`total_pnl` real NOT NULL,
	`total_pnl_pct` real NOT NULL,
	`win_rate` real DEFAULT 0 NOT NULL,
	`total_trades` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE `positions` (
	`id` text PRIMARY KEY NOT NULL,
	`market_id` text NOT NULL,
	`outcome` text NOT NULL,
	`avg_entry_price` real NOT NULL,
	`shares` real NOT NULL,
	`cost_basis` real NOT NULL,
	`current_price` real DEFAULT 0 NOT NULL,
	`current_value` real DEFAULT 0 NOT NULL,
	`unrealized_pnl` real DEFAULT 0 NOT NULL,
	`unrealized_pnl_pct` real DEFAULT 0 NOT NULL,
	FOREIGN KEY (`market_id`) REFERENCES `markets`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `research_results` (
	`id` text PRIMARY KEY NOT NULL,
	`market_id` text NOT NULL,
	`strategy` text NOT NULL,
	`query` text NOT NULL,
	`exa_search_type` text NOT NULL,
	`exa_category` text,
	`results` text NOT NULL,
	`cost_dollars` real DEFAULT 0 NOT NULL,
	`latency_ms` integer DEFAULT 0 NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`market_id`) REFERENCES `markets`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `settings` (
	`key` text PRIMARY KEY NOT NULL,
	`value` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `trades` (
	`id` text PRIMARY KEY NOT NULL,
	`market_id` text NOT NULL,
	`decision_id` text NOT NULL,
	`mode` text NOT NULL,
	`action` text NOT NULL,
	`outcome` text NOT NULL,
	`price` real NOT NULL,
	`size` real NOT NULL,
	`shares` real NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`clob_order_id` text,
	`pnl` real,
	`created_at` text NOT NULL,
	FOREIGN KEY (`market_id`) REFERENCES `markets`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`decision_id`) REFERENCES `decisions`(`id`) ON UPDATE no action ON DELETE no action
);
