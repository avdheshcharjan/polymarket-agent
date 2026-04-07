"use client";

import { useAgentStream } from "@/hooks/use-agent-stream";
import { useTrades } from "@/hooks/use-trades";
import { StatsRow } from "@/components/dashboard/stats-row";
import { ExaShowcase } from "@/components/research/exa-showcase";
import { Badge } from "@/components/ui/badge";
import { AnimatedNumber } from "@/components/ui/animated-number";
import {
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";
import type { Trade } from "@/types/trade";
import type { AgentEvent } from "@/types/agent";

function getPortfolioFromEvents(events: (AgentEvent & { timestamp: string })[]) {
  const portfolioEvent = events.find((e) => e.type === "portfolio_update");
  if (portfolioEvent && portfolioEvent.type === "portfolio_update") {
    return portfolioEvent.snapshot;
  }
  return null;
}

export default function OverviewPage() {
  const { agentState, events } = useAgentStream();
  const { data: trades } = useTrades(10);

  const portfolio = getPortfolioFromEvents(events);

  const totalPnl = portfolio?.totalPnl ?? 0;
  const totalPnlPct = portfolio?.totalPnlPct ?? 0;
  const winRate = portfolio?.winRate ?? 0;
  const activePositions = portfolio?.positions?.length ?? 0;

  const recentTrades: Trade[] = trades?.trades ?? [];

  return (
    <div className="p-6 pb-80 space-y-6">
      {/* Stats Row */}
      <StatsRow
        totalPnl={totalPnl}
        totalPnlPct={totalPnlPct}
        winRate={winRate}
        activePositions={activePositions}
        cycleCount={agentState.cycleCount}
      />

      {/* Recent Activity */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-foreground">
            Recent Activity
          </h2>
          <Link
            href="/trades"
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            View all
            <ChevronRight className="h-3 w-3" />
          </Link>
        </div>

        {recentTrades.length === 0 ? (
          <div className="rounded-xl border border-white/[0.06] bg-surface-1 p-12 text-center">
            <Clock className="h-10 w-10 mx-auto mb-3 text-muted-foreground/30" />
            <p className="text-sm text-muted-foreground">
              No trades yet
            </p>
            <p className="text-xs text-muted-foreground/60 mt-1">
              Run the agent to start discovering and trading on markets
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {recentTrades.map((trade) => {
              const isBuy = trade.action.startsWith("buy");
              const isProfitable = (trade.pnl ?? 0) >= 0;

              return (
                <div
                  key={trade.id}
                  className="flex items-center gap-4 rounded-lg border border-white/[0.04] bg-surface-1 px-4 py-3 hover:bg-surface-2 transition-colors"
                >
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                      isBuy ? "bg-green-500/10" : "bg-red-500/10"
                    }`}
                  >
                    {isBuy ? (
                      <ArrowUpRight className="h-4 w-4 text-green-400" />
                    ) : (
                      <ArrowDownRight className="h-4 w-4 text-red-400" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground truncate">
                      {trade.action.replace(/_/g, " ").toUpperCase()}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {trade.outcome} @ ${trade.price.toFixed(2)}
                    </p>
                  </div>

                  <div className="text-right shrink-0">
                    <AnimatedNumber
                      value={trade.size}
                      format="currency"
                      size="sm"
                      className="text-foreground"
                    />
                    {trade.pnl != null && (
                      <div className="mt-0.5">
                        <AnimatedNumber
                          value={trade.pnl}
                          format="currency"
                          showSign
                          colorize
                          size="sm"
                          className="text-xs"
                        />
                      </div>
                    )}
                  </div>

                  <Badge
                    className={`text-[11px] uppercase tracking-wider ${
                      trade.status === "filled"
                        ? "bg-green-500/10 text-green-400 border-green-500/20"
                        : trade.status === "failed"
                        ? "bg-red-500/10 text-red-400 border-red-500/20"
                        : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                    }`}
                  >
                    {trade.status}
                  </Badge>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Exa Showcase - fixed bottom panel */}
      <ExaShowcase events={events} />
    </div>
  );
}
