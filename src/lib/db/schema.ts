import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";

export const markets = sqliteTable("markets", {
  id: text("id").primaryKey(),
  question: text("question").notNull(),
  slug: text("slug").notNull(),
  outcomes: text("outcomes", { mode: "json" }).notNull().$type<string[]>(),
  outcomePrices: text("outcome_prices", { mode: "json" }).notNull().$type<number[]>(),
  volume: real("volume").notNull().default(0),
  volume24hr: real("volume_24hr").notNull().default(0),
  liquidity: real("liquidity").notNull().default(0),
  endDate: text("end_date").notNull(),
  image: text("image").default(""),
  bestBid: real("best_bid").default(0),
  bestAsk: real("best_ask").default(0),
  spread: real("spread").default(0),
  clobTokenIds: text("clob_token_ids", { mode: "json" }).notNull().$type<string[]>(),
  eventTitle: text("event_title").default(""),
  eventSlug: text("event_slug").default(""),
  active: integer("active", { mode: "boolean" }).notNull().default(true),
  closed: integer("closed", { mode: "boolean" }).notNull().default(false),
  lastUpdated: text("last_updated").notNull(),
});

export const researchResults = sqliteTable("research_results", {
  id: text("id").primaryKey(),
  marketId: text("market_id").notNull().references(() => markets.id),
  strategy: text("strategy").notNull(),
  query: text("query").notNull(),
  exaSearchType: text("exa_search_type").notNull(),
  exaCategory: text("exa_category"),
  results: text("results", { mode: "json" }).notNull().$type<unknown[]>(),
  costDollars: real("cost_dollars").notNull().default(0),
  latencyMs: integer("latency_ms").notNull().default(0),
  createdAt: text("created_at").notNull(),
});

export const analyses = sqliteTable("analyses", {
  id: text("id").primaryKey(),
  marketId: text("market_id").notNull().references(() => markets.id),
  estimatedProbability: real("estimated_probability").notNull(),
  confidence: real("confidence").notNull(),
  edge: real("edge").notNull(),
  summary: text("summary").notNull(),
  bullCase: text("bull_case").notNull(),
  bearCase: text("bear_case").notNull(),
  keyFactors: text("key_factors", { mode: "json" }).notNull().$type<string[]>(),
  createdAt: text("created_at").notNull(),
});

export const decisions = sqliteTable("decisions", {
  id: text("id").primaryKey(),
  marketId: text("market_id").notNull().references(() => markets.id),
  action: text("action").notNull(),
  confidence: real("confidence").notNull(),
  reasoning: text("reasoning").notNull(),
  researchIds: text("research_ids", { mode: "json" }).notNull().$type<string[]>(),
  estimatedProbability: real("estimated_probability").notNull(),
  marketPrice: real("market_price").notNull(),
  edge: real("edge").notNull(),
  size: real("size").notNull(),
  createdAt: text("created_at").notNull(),
});

export const trades = sqliteTable("trades", {
  id: text("id").primaryKey(),
  marketId: text("market_id").notNull().references(() => markets.id),
  decisionId: text("decision_id").notNull().references(() => decisions.id),
  mode: text("mode").notNull(),
  action: text("action").notNull(),
  outcome: text("outcome").notNull(),
  price: real("price").notNull(),
  size: real("size").notNull(),
  shares: real("shares").notNull(),
  status: text("status").notNull().default("pending"),
  clobOrderId: text("clob_order_id"),
  pnl: real("pnl"),
  createdAt: text("created_at").notNull(),
});

export const positions = sqliteTable("positions", {
  id: text("id").primaryKey(),
  marketId: text("market_id").notNull().references(() => markets.id),
  outcome: text("outcome").notNull(),
  avgEntryPrice: real("avg_entry_price").notNull(),
  shares: real("shares").notNull(),
  costBasis: real("cost_basis").notNull(),
  currentPrice: real("current_price").notNull().default(0),
  currentValue: real("current_value").notNull().default(0),
  unrealizedPnl: real("unrealized_pnl").notNull().default(0),
  unrealizedPnlPct: real("unrealized_pnl_pct").notNull().default(0),
});

export const portfolioSnapshots = sqliteTable("portfolio_snapshots", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  timestamp: text("timestamp").notNull(),
  totalValue: real("total_value").notNull(),
  cashBalance: real("cash_balance").notNull(),
  positionsValue: real("positions_value").notNull(),
  totalPnl: real("total_pnl").notNull(),
  totalPnlPct: real("total_pnl_pct").notNull(),
  winRate: real("win_rate").notNull().default(0),
  totalTrades: integer("total_trades").notNull().default(0),
});

export const settings = sqliteTable("settings", {
  key: text("key").primaryKey(),
  value: text("value", { mode: "json" }).notNull(),
});
