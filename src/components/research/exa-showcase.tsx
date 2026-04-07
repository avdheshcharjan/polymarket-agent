"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, Zap, Clock, Hash, DollarSign } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { AgentEvent } from "@/types/agent";
import type { ResearchStrategy } from "@/types/research";

const strategyStyles: Record<
  ResearchStrategy,
  { bg: string; text: string; border: string }
> = {
  breaking_news: {
    bg: "bg-blue-500/10",
    text: "text-blue-400",
    border: "border-blue-500/20",
  },
  expert_analysis: {
    bg: "bg-purple-500/10",
    text: "text-purple-400",
    border: "border-purple-500/20",
  },
  contrary_evidence: {
    bg: "bg-orange-500/10",
    text: "text-orange-400",
    border: "border-orange-500/20",
  },
  historical_precedent: {
    bg: "bg-green-500/10",
    text: "text-green-400",
    border: "border-green-500/20",
  },
  structured_probability: {
    bg: "bg-cyan-500/10",
    text: "text-cyan-400",
    border: "border-cyan-500/20",
  },
};

const endpointBadgeColor: Record<string, string> = {
  "/search": "bg-blue-500/15 text-blue-300 border-blue-500/20",
  "/findSimilar": "bg-purple-500/15 text-purple-300 border-purple-500/20",
  "/answer": "bg-green-500/15 text-green-300 border-green-500/20",
};

const searchTypeBadgeColor: Record<string, string> = {
  fast: "bg-amber-500/15 text-amber-300 border-amber-500/20",
  neural: "bg-indigo-500/15 text-indigo-300 border-indigo-500/20",
  deep: "bg-red-500/15 text-red-300 border-red-500/20",
  auto: "bg-zinc-500/15 text-zinc-300 border-zinc-500/20",
};

interface ExaShowcaseProps {
  events: (AgentEvent & { timestamp: string })[];
}

export function ExaShowcase({ events }: ExaShowcaseProps) {
  const [collapsed, setCollapsed] = useState(false);

  const researchEvents = events.filter(
    (e) => e.type === "research_started" || e.type === "research_result"
  );

  // Pair starts with results
  const pairedEvents = researchEvents.reduce<
    Array<{
      timestamp: string;
      strategy: ResearchStrategy;
      query?: string;
      resultCount?: number;
      latencyMs?: number;
      costDollars?: number;
      searchType?: string;
      endpoint?: string;
    }>
  >((acc, event) => {
    if (event.type === "research_started") {
      acc.push({
        timestamp: event.timestamp,
        strategy: event.strategy,
        query: event.query,
        endpoint: "/search",
        searchType: "neural",
      });
    } else if (event.type === "research_result") {
      // Try to attach to matching pending entry
      const pending = acc.find(
        (e) => e.strategy === event.strategy && !e.resultCount
      );
      if (pending) {
        pending.resultCount = event.resultCount;
        pending.latencyMs = event.latencyMs;
        pending.costDollars = event.costDollars;
      } else {
        acc.push({
          timestamp: event.timestamp,
          strategy: event.strategy,
          resultCount: event.resultCount,
          latencyMs: event.latencyMs,
          costDollars: event.costDollars,
          endpoint: "/search",
          searchType: "neural",
        });
      }
    }
    return acc;
  }, []);

  return (
    <div
      className={`fixed bottom-0 left-64 right-0 z-40 border-t border-white/[0.06] bg-surface-1/95 backdrop-blur-xl transition-all duration-300 ${
        collapsed ? "h-11" : "h-72"
      }`}
    >
      {/* Header */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="flex w-full items-center justify-between h-11 px-5 hover:bg-white/[0.02] transition-colors"
      >
        <div className="flex items-center gap-3">
          <Zap className="h-3.5 w-3.5 text-green-400" />
          <span className="text-xs font-semibold uppercase tracking-widest text-foreground/80">
            Exa Intelligence Feed
          </span>
          <Badge className="bg-green-500/15 text-green-400 border-green-500/25 text-[11px] uppercase tracking-wider font-bold px-1.5 py-0 animate-live-pulse">
            Live
          </Badge>
          {pairedEvents.length > 0 && (
            <span className="text-[11px] text-muted-foreground">
              {pairedEvents.length} calls
            </span>
          )}
        </div>
        {collapsed ? (
          <ChevronUp className="h-4 w-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        )}
      </button>

      {/* Feed content */}
      {!collapsed && (
        <ScrollArea className="h-[calc(100%-2.75rem)]">
          <div className="px-5 pb-4 space-y-2">
            {pairedEvents.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
                <Zap className="h-8 w-8 mb-3 opacity-20" />
                <p className="text-sm">No research calls yet</p>
                <p className="text-xs mt-1">
                  Run the agent to see live Exa API calls
                </p>
              </div>
            ) : (
              pairedEvents.map((entry, i) => {
                const strategy = strategyStyles[entry.strategy];
                const endpointClass =
                  endpointBadgeColor[entry.endpoint ?? "/search"] ??
                  endpointBadgeColor["/search"];
                const searchTypeClass =
                  searchTypeBadgeColor[entry.searchType ?? "neural"] ??
                  searchTypeBadgeColor["neural"];

                return (
                  <div
                    key={`${entry.timestamp}-${i}`}
                    className="animate-slide-in-right flex items-center gap-3 rounded-lg border border-white/[0.04] bg-surface-2/60 px-4 py-2.5 hover:bg-surface-2 transition-colors"
                    style={{ animationDelay: `${i * 50}ms` }}
                  >
                    {/* Timestamp */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      <Clock className="h-3 w-3 text-muted-foreground/60" />
                      <span className="text-[11px] font-mono text-muted-foreground w-[52px]">
                        {new Date(entry.timestamp).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                          second: "2-digit",
                        })}
                      </span>
                    </div>

                    {/* Endpoint badge */}
                    <Badge
                      className={`${endpointClass} text-[11px] font-mono px-1.5 py-0 shrink-0`}
                    >
                      {entry.endpoint}
                    </Badge>

                    {/* Search type badge */}
                    <Badge
                      className={`${searchTypeClass} text-[11px] px-1.5 py-0 shrink-0`}
                    >
                      {entry.searchType}
                    </Badge>

                    {/* Strategy badge */}
                    <Badge
                      className={`${strategy.bg} ${strategy.text} ${strategy.border} text-[11px] px-1.5 py-0 shrink-0`}
                    >
                      {entry.strategy.replace(/_/g, " ")}
                    </Badge>

                    {/* Query */}
                    <span className="flex-1 text-xs text-foreground/70 truncate min-w-0">
                      {entry.query ?? "..."}
                    </span>

                    {/* Metrics */}
                    <div className="flex items-center gap-3 shrink-0">
                      {entry.resultCount != null && (
                        <div className="flex items-center gap-1">
                          <Hash className="h-3 w-3 text-muted-foreground/50" />
                          <span className="text-[11px] font-mono text-foreground/60">
                            {entry.resultCount}
                          </span>
                        </div>
                      )}
                      {entry.latencyMs != null && (
                        <span className="text-[11px] font-mono text-amber-400/70">
                          {entry.latencyMs}ms
                        </span>
                      )}
                      {entry.costDollars != null && (
                        <div className="flex items-center gap-0.5">
                          <DollarSign className="h-3 w-3 text-muted-foreground/50" />
                          <span className="text-[11px] font-mono text-green-400/70">
                            {entry.costDollars.toFixed(4)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </ScrollArea>
      )}
    </div>
  );
}
