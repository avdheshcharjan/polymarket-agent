# Exa-Powered Polymarket Trading Agent — Design Doc

## Context

This is a portfolio project for an Exa.ai DevRel Software Engineer role application. The goal is to build a "viral applet" that showcases Exa's search API capabilities through an autonomous prediction market trading agent. The app must be visually impressive, technically deep, and deployable as a single shareable URL.

The agent autonomously discovers trending/closing-soon markets on Polymarket, runs multi-strategy research using Exa's API (8 distinct capabilities), synthesizes analysis, and executes trades — all visible in real-time through a web dashboard.

## Decisions

- **Stack**: Next.js 14+ App Router, full-stack monolith
- **UI**: Tailwind CSS + shadcn/ui, dark theme, Recharts for charts
- **Database**: Drizzle ORM + Turso (SQLite-compatible, persists across deploys)
- **Real-time**: Server-Sent Events (SSE) from agent loop to dashboard
- **Client data**: SWR with auto-revalidation
- **LLM**: Exa `/answer` endpoint (default) + Claude API (optional toggle)
- **Trading**: Paper trading (default) + real CLOB trading (opt-in toggle)
- **Market discovery**: Fully autonomous via Polymarket Gamma API
- **Deployment**: Vercel with Cron for autonomous 15-min agent cycles
- **Exa client**: Custom REST wrapper (no SDK) to keep integration visible

## Architecture

```
Vercel Cron (15 min) --> /api/agent/run --> Agent Loop
                                              |
                    +-----------+-----------+--+-----------+-----------+
                    |           |           |              |           |
                 Discover    Filter     Research        Analyze     Execute
                 (Gamma)   (ranking)  (5x Exa)    (Exa /answer)  (Paper/CLOB)
                                         |              |
                                    EventEmitter -------+
                                         |
                                    SSE Stream
                                         |
                                    Dashboard (React)
                                    SWR + useAgentStream
```

## File Structure

```
src/
  app/
    (dashboard)/
      layout.tsx              # Sidebar + topbar shell
      page.tsx                # Overview: P&L, positions, agent pulse
      markets/page.tsx        # Market discovery grid
      markets/[marketId]/page.tsx  # Single market deep-dive
      research/page.tsx       # Research feed
      trades/page.tsx         # Trade history
      settings/page.tsx       # Config
    api/
      agent/run/route.ts      # POST: trigger agent cycle
      agent/status/route.ts   # GET: agent state
      agent/stream/route.ts   # GET: SSE stream (Edge Runtime)
      markets/route.ts        # GET: list markets
      markets/discover/route.ts   # POST: scan Gamma
      markets/[marketId]/route.ts # GET: market detail
      research/[marketId]/route.ts # POST: run Exa research
      trades/route.ts         # GET: trade history
      exa/search/route.ts     # POST: proxy Exa search
      exa/similar/route.ts    # POST: proxy findSimilar
      exa/answer/route.ts     # POST: proxy /answer (streaming)
      settings/route.ts       # GET/PUT: config
  lib/
    exa/
      client.ts               # Exa REST client (auth, cost tracking)
      strategies.ts           # 5 research strategies
      schemas.ts              # outputSchema definitions
    polymarket/
      gamma.ts                # Gamma API client
      clob.ts                 # CLOB API client
      types.ts                # Polymarket types
    agent/
      loop.ts                 # Core orchestrator
      discover.ts             # Market discovery + filtering
      research.ts             # Multi-strategy Exa research
      analyze.ts              # Synthesis + decision
      execute.ts              # Paper/real trade execution
      monitor.ts              # Position monitoring
      events.ts               # EventEmitter for SSE
    llm/
      exa-answer.ts           # Exa /answer wrapper
      claude.ts               # Claude API wrapper
    trading/
      paper.ts                # Paper trading engine
      real.ts                 # Real CLOB trading
      portfolio.ts            # P&L tracking
    db/
      index.ts                # Drizzle + Turso init
      schema.ts               # Table definitions
      queries.ts              # Typed query helpers
  components/
    ui/                       # shadcn/ui primitives
    layout/sidebar.tsx, topbar.tsx
    dashboard/pnl-chart.tsx, positions-table.tsx, agent-pulse.tsx, recent-trades.tsx, stats-row.tsx
    markets/market-card.tsx, market-grid.tsx, market-detail.tsx, price-chart.tsx
    research/research-card.tsx, research-timeline.tsx, strategy-badge.tsx, exa-showcase.tsx
    trades/trade-table.tsx, trade-reasoning.tsx
  hooks/
    use-agent-stream.ts       # SSE EventSource hook
    use-markets.ts, use-trades.ts, use-portfolio.ts  # SWR hooks
  types/
    exa.ts, market.ts, trade.ts, agent.ts, research.ts
```

## Core Types

### Market
```typescript
interface Market {
  id: string;              // Polymarket condition ID
  question: string;
  outcomes: string[];      // ["Yes", "No"]
  outcomePrices: number[]; // [0.65, 0.35]
  volume24hr: number;
  liquidity: number;
  endDate: string;         // ISO 8601
  clobTokenIds: string[];
}

interface MarketAnalysis {
  marketId: string;
  estimatedProbability: number;
  confidence: number;
  edge: number;            // estimatedProb - marketPrice
  summary: string;
  bullCase: string;
  bearCase: string;
  keyFactors: string[];
}
```

### Research
```typescript
type ResearchStrategy = "breaking_news" | "expert_analysis" | "contrary_evidence" | "historical_precedent" | "structured_probability";

interface ResearchResult {
  marketId: string;
  strategy: ResearchStrategy;
  query: string;
  exaSearchType: string;
  results: { title: string; url: string; score: number; highlights: string[]; summary: string | null }[];
  costDollars: number;
}
```

### Trading
```typescript
type TradeAction = "buy_yes" | "buy_no" | "sell_yes" | "sell_no" | "hold";

interface AgentDecision {
  marketId: string;
  action: TradeAction;
  confidence: number;
  reasoning: string;
  estimatedProbability: number;
  marketPrice: number;
  edge: number;
  size: number;
}

interface Trade {
  marketId: string;
  mode: "paper" | "real";
  action: TradeAction;
  price: number;
  size: number;
  shares: number;
  status: "pending" | "filled" | "cancelled" | "failed";
}
```

### Agent
```typescript
type AgentPhase = "idle" | "discovering" | "filtering" | "researching" | "analyzing" | "executing" | "monitoring" | "error";

type AgentEvent =
  | { type: "phase_change"; phase: AgentPhase }
  | { type: "market_discovered"; market: Market }
  | { type: "research_started"; marketId: string; strategy: ResearchStrategy; query: string }
  | { type: "research_result"; marketId: string; strategy: ResearchStrategy; resultCount: number }
  | { type: "analysis_complete"; marketId: string; analysis: MarketAnalysis }
  | { type: "trade_executed"; trade: Trade }
  | { type: "portfolio_update"; snapshot: PortfolioSnapshot };

interface AgentConfig {
  mode: "paper" | "real";
  maxPositionSize: number;       // Default: 100
  maxOpenPositions: number;      // Default: 5
  minEdge: number;               // Default: 0.10
  minConfidence: number;         // Default: 0.6
  minVolume24hr: number;         // Default: 10000
  maxTimeToExpiry: number;       // Default: 72 hours
  cycleIntervalMinutes: number;  // Default: 15
  llmProvider: "exa" | "claude";
  startingBalance: number;       // Default: 10000
}
```

## Exa Research Strategies (5 per market)

| Strategy | Endpoint | Type | Category | Date Filter | Special |
|----------|----------|------|----------|-------------|---------|
| breaking_news | /search | fast | news | Last 24h | highlights, domain-filtered to credible news |
| expert_analysis | /search | neural | - | Last 7d | summary, broader domains |
| contrary_evidence | /search | neural | - | Last 7d | Query: "why {outcome} unlikely" |
| historical_precedent | /findSimilar | - | - | - | Seed URL from top news result |
| structured_probability | /search | deep | - | Last 30d | outputSchema for {probability, confidence, keyFactors, reasoning} |

This showcases 8 distinct Exa capabilities: fast search, neural search, news category, domain filtering, findSimilar, deep search with outputSchema, highlights, and summary.

## Agent Loop Pipeline

1. **Discover** — GET `gamma-api.polymarket.com/markets` sorted by volume and endDate
2. **Filter** — Select markets: volume24hr >= 10K, expiry within 72h, spread < 0.15. Rank by `volume24hr * (1/hoursToExpiry)`, take top 5
3. **Research** — Run 5 Exa strategies in parallel per market, emit SSE events per result
4. **Analyze** — Synthesize all research via Exa /answer or Claude. Output: probability estimate, confidence, bull/bear case, action, size
5. **Execute** — Trade if edge >= 0.10 and confidence >= 0.6. Paper: simulate fill. Real: CLOB limit order
6. **Monitor** — Fetch latest prices, recalculate P&L, snapshot portfolio, check exit conditions

## Dashboard Design

### Overview Page
- Stats row: Total P&L, Win Rate, Active Positions, Agent Cycles
- P&L area chart (Recharts, portfolio value over time)
- Active positions table with live unrealized P&L
- Recent trades with expandable reasoning
- **Exa Showcase panel** (bottom, collapsible)

### Exa Showcase Panel (the "wow factor")
A persistent bottom panel showing every Exa API call in real-time:
- Search type badge, query text, latency, result count, cost
- Animated entry for each new call
- Color-coded by strategy
- This makes the intelligence pipeline visible and directly demonstrates Exa's capabilities

### Market Detail Page
- Market header (question, prices, volume, countdown timer)
- Agent verdict (probability, confidence, bull/bear case)
- Research timeline (all 5 strategies with strategy badges)
- Price chart + trade history for this market

## Deployment

- **Vercel** single deploy, Vercel Cron for 15-min agent cycles
- **Turso** for persistent SQLite (free tier sufficient)
- **Edge Runtime** for SSE stream route
- **`waitUntil`** from `@vercel/functions` for agent loop execution
- **Environment**: EXA_API_KEY (required), ANTHROPIC_API_KEY (optional), CRON_SECRET

## Dependencies

```
next react react-dom
tailwindcss @tailwindcss/typography
shadcn/ui (npx shadcn-ui init)
drizzle-orm @libsql/client
swr recharts lucide-react date-fns zod
```

## Verification

1. `npm run dev` — dashboard loads with dark theme
2. Navigate to Settings, enter EXA_API_KEY
3. Click "Run Agent" — SSE events stream to dashboard
4. Markets page populates with Polymarket data
5. Research page shows Exa results streaming in per strategy
6. Trades page shows paper trades with reasoning
7. Overview shows P&L updating
8. Exa Showcase panel shows live API calls with timing and cost
