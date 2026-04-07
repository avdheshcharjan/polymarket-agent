"use client";

import { useState } from "react";
import { useAgentStream } from "@/hooks/use-agent-stream";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Search,
  Clock,
  ExternalLink,
  Hash,
  DollarSign,
  Zap,
} from "lucide-react";
import type { AgentEvent } from "@/types/agent";
import type { ResearchStrategy } from "@/types/research";

const strategies: { value: string; label: string }[] = [
  { value: "all", label: "All" },
  { value: "breaking_news", label: "Breaking News" },
  { value: "expert_analysis", label: "Expert Analysis" },
  { value: "contrary_evidence", label: "Contrary Evidence" },
  { value: "historical_precedent", label: "Historical" },
  { value: "structured_probability", label: "Probability" },
];

const strategyColor: Record<ResearchStrategy, string> = {
  breaking_news: "text-blue-400 bg-blue-500/10 border-blue-500/20",
  expert_analysis: "text-purple-400 bg-purple-500/10 border-purple-500/20",
  contrary_evidence: "text-orange-400 bg-orange-500/10 border-orange-500/20",
  historical_precedent: "text-green-400 bg-green-500/10 border-green-500/20",
  structured_probability: "text-cyan-400 bg-cyan-500/10 border-cyan-500/20",
};

type ResearchEntry = {
  timestamp: string;
  strategy: ResearchStrategy;
  query?: string;
  resultCount?: number;
  latencyMs?: number;
  costDollars?: number;
  marketId?: string;
};

function buildResearchFeed(
  events: (AgentEvent & { timestamp: string })[]
): ResearchEntry[] {
  const entries: ResearchEntry[] = [];

  for (const event of events) {
    if (event.type === "research_started") {
      entries.push({
        timestamp: event.timestamp,
        strategy: event.strategy,
        query: event.query,
        marketId: event.marketId,
      });
    } else if (event.type === "research_result") {
      // Try to match to existing
      const pending = entries.find(
        (e) => e.strategy === event.strategy && e.marketId === event.marketId && !e.resultCount
      );
      if (pending) {
        pending.resultCount = event.resultCount;
        pending.latencyMs = event.latencyMs;
        pending.costDollars = event.costDollars;
      } else {
        entries.push({
          timestamp: event.timestamp,
          strategy: event.strategy,
          resultCount: event.resultCount,
          latencyMs: event.latencyMs,
          costDollars: event.costDollars,
          marketId: event.marketId,
        });
      }
    }
  }

  return entries;
}

export default function ResearchPage() {
  const { events } = useAgentStream();
  const [activeTab, setActiveTab] = useState("all");

  const feed = buildResearchFeed(events);

  const filtered =
    activeTab === "all"
      ? feed
      : feed.filter((e) => e.strategy === activeTab);

  return (
    <div className="p-6 space-y-5">
      <div>
        <h1 className="text-lg font-semibold text-foreground">
          Research Feed
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Live Exa API research results across all strategies
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-surface-1 border border-white/[0.06] p-1">
          {strategies.map((s) => (
            <TabsTrigger
              key={s.value}
              value={s.value}
              className="text-xs data-[state=active]:bg-white/[0.08] data-[state=active]:text-foreground"
            >
              {s.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value={activeTab} className="mt-4">
          {filtered.length === 0 ? (
            <div className="text-center py-20 rounded-xl border border-white/[0.06] bg-surface-1">
              <Search className="h-10 w-10 mx-auto mb-3 text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground">
                No research results yet
              </p>
              <p className="text-xs text-muted-foreground/60 mt-1">
                Run the agent to start generating research
              </p>
            </div>
          ) : (
            <ScrollArea className="h-[calc(100vh-220px)]">
              <div className="space-y-3">
                {filtered.map((entry, i) => (
                  <Card
                    key={`${entry.timestamp}-${i}`}
                    className="border-white/[0.06] bg-surface-1 hover:bg-surface-2 transition-colors animate-slide-in-right"
                    style={{ animationDelay: `${i * 30}ms` }}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0 space-y-2">
                          {/* Strategy + timestamp */}
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge
                              className={`${
                                strategyColor[entry.strategy]
                              } text-[11px] uppercase tracking-wider`}
                            >
                              {entry.strategy.replace(/_/g, " ")}
                            </Badge>
                            <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                              <Clock className="h-3 w-3" />
                              {new Date(entry.timestamp).toLocaleTimeString()}
                            </div>
                          </div>

                          {/* Query */}
                          {entry.query && (
                            <p className="text-sm text-foreground/80 leading-relaxed">
                              {entry.query}
                            </p>
                          )}

                          {/* Metrics */}
                          <div className="flex items-center gap-4 text-[11px] text-muted-foreground">
                            {entry.resultCount != null && (
                              <div className="flex items-center gap-1">
                                <Hash className="h-3 w-3" />
                                {entry.resultCount} results
                              </div>
                            )}
                            {entry.latencyMs != null && (
                              <div className="flex items-center gap-1">
                                <Zap className="h-3 w-3 text-amber-400" />
                                <span className="text-amber-400 font-mono">
                                  {entry.latencyMs}ms
                                </span>
                              </div>
                            )}
                            {entry.costDollars != null && (
                              <div className="flex items-center gap-1">
                                <DollarSign className="h-3 w-3 text-green-400" />
                                <span className="text-green-400 font-mono">
                                  ${entry.costDollars.toFixed(4)}
                                </span>
                              </div>
                            )}
                            {entry.marketId && (
                              <div className="flex items-center gap-1">
                                <ExternalLink className="h-3 w-3" />
                                <span className="font-mono">
                                  {entry.marketId.slice(0, 8)}...
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
