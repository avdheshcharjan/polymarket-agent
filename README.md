# PolyAgent — Autonomous Prediction Market Trader

**An AI agent that autonomously discovers, researches, and trades on Polymarket using [Exa.ai](https://exa.ai) as its intelligence layer.**

PolyAgent showcases **8 distinct Exa API capabilities** through a real-time Next.js dashboard where you can watch the agent think, research, and trade — all powered by Exa's neural search.

## How It Works

```
Discover Markets → Research with Exa → Analyze → Trade → Monitor
     ↑                                                    |
     └────────────────── every 15 min ←────────────────────┘
```

### The Agent Loop

Every 15 minutes (or on-demand), PolyAgent:

1. **Discovers** trending and closing-soon markets from Polymarket's Gamma API
2. **Filters** to high-volume, expiring markets with tradeable spreads
3. **Researches** each market using 5 parallel Exa strategies:

   | Strategy | Exa Feature | What It Does |
   |----------|-------------|--------------|
   | Breaking News | `fast` search + `news` category | Scans credible news sources from the last 24h |
   | Expert Analysis | `neural` search + `summary` | Finds expert forecasts and probability estimates |
   | Contrary Evidence | `neural` search | Discovers "why unlikely" arguments to avoid bias |
   | Historical Precedent | `findSimilar` | Finds related events and outcomes from a seed URL |
   | Structured Probability | `deep` search + `outputSchema` | Extracts structured probability estimates |

4. **Analyzes** using Exa's `/answer` endpoint (or Claude) with superforecaster-style prompting
5. **Executes** paper or real trades based on edge and confidence thresholds
6. **Monitors** positions and updates P&L in real-time

### 8 Exa Capabilities Showcased

| # | Capability | Where Used |
|---|-----------|-----------|
| 1 | `fast` search | Breaking news scanning (<450ms) |
| 2 | `neural` search | Expert analysis + contrary evidence |
| 3 | `news` category filter | Credible news sources only |
| 4 | Domain filtering (1,200 max) | Reuters, Bloomberg, FT, AP, etc. |
| 5 | `findSimilar` from URL | Historical precedent discovery |
| 6 | `deep` search + `outputSchema` | Structured probability extraction |
| 7 | `/answer` with streaming | Grounded synthesis with citations |
| 8 | `highlights` extraction | Token-efficient content retrieval |

## Quick Start

```bash
git clone https://github.com/yourusername/polymarket-agent.git
cd polymarket-agent
npm install

# Set your Exa API key
cp .env.example .env.local
# Edit .env.local and add: EXA_API_KEY=your-key-here

npm run dev
# Open http://localhost:3000
```

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `EXA_API_KEY` | Yes | Exa.ai API key ([get one free](https://dashboard.exa.ai)) |
| `ANTHROPIC_API_KEY` | No | Claude API key (optional power mode) |
| `TURSO_DATABASE_URL` | No | Turso DB URL (defaults to local SQLite) |
| `POLYMARKET_API_KEY` | No | For real trading mode only |

## Architecture

```
Next.js 14 App Router
├── API Routes (backend)
│   ├── /api/agent/run      — Trigger agent cycle
│   ├── /api/agent/stream    — SSE real-time events
│   ├── /api/markets/*       — Market data + discovery
│   ├── /api/research/*      — Exa research results
│   ├── /api/exa/*           — Exa API proxy
│   └── /api/settings        — Agent configuration
├── Agent Core (src/lib/agent/)
│   ├── loop.ts              — Pipeline orchestrator
│   ├── discover.ts          — Polymarket market scanner
│   ├── research.ts          — 5-strategy Exa research
│   └── analyze.ts           — Superforecaster synthesis
├── Exa Client (src/lib/exa/)
│   ├── client.ts            — REST wrapper with cost tracking
│   ├── strategies.ts        — 5 research strategies
│   └── schemas.ts           — outputSchema definitions
└── Dashboard (React)
    ├── Overview              — P&L, positions, agent pulse
    ├── Markets               — Auto-discovered markets
    ├── Research              — Live Exa results feed
    ├── Trades                — History with reasoning
    └── Exa Showcase          — Real-time API call visualization
```

## Tech Stack

- **Next.js 14** — App Router, API Routes, SSE streaming
- **Tailwind CSS + shadcn/ui** — Dark theme, responsive dashboard
- **Drizzle ORM + SQLite** — Typed database with Turso support
- **SWR** — Real-time data fetching
- **Recharts** — Portfolio charts
- **Exa.ai** — 8 search capabilities for market intelligence
- **Vercel Cron** — Autonomous 15-minute agent cycles

## Trading Modes

- **Paper Trading** (default): Simulated trades with $10,000 starting balance
- **Real Trading**: Live Polymarket CLOB orders (requires API credentials + wallet)

Toggle between modes in Settings. Real mode requires accepting Polymarket's Terms of Service.

## Deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/yourusername/polymarket-agent&env=EXA_API_KEY)

## Cost

- **Exa API**: ~$105/month at 500 searches/day. Free tier (1,000 req/month) for development.
- **Vercel**: Free tier sufficient (1 cron job, serverless functions)
- **Turso**: Free tier (500 databases, 9GB total)

---

Built with [Exa.ai](https://exa.ai) — the search API built for AI agents.
