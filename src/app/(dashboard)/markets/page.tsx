"use client";

import { useState } from "react";
import Link from "next/link";
import { useMarkets } from "@/hooks/use-markets";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AnimatedNumber } from "@/components/ui/animated-number";
import {
  Compass,
  TrendingUp,
  Clock,
  BarChart3,
  Search,
  Loader2,
  Sparkles,
} from "lucide-react";
import type { MarketWithAnalysis } from "@/types/market";

function formatTimeRemaining(endDate: string) {
  const diff = new Date(endDate).getTime() - Date.now();
  if (diff <= 0) return "Expired";
  const hours = Math.floor(diff / (1000 * 60 * 60));
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d`;
  const months = Math.floor(days / 30);
  return `${months}mo`;
}

function formatVolume(vol: number) {
  if (vol >= 1_000_000) return `$${(vol / 1_000_000).toFixed(1)}M`;
  if (vol >= 1_000) return `$${(vol / 1_000).toFixed(1)}K`;
  return `$${vol.toFixed(0)}`;
}

export default function MarketsPage() {
  const { data, isLoading } = useMarkets(50);
  const [search, setSearch] = useState("");
  const [discovering, setDiscovering] = useState(false);

  const markets: MarketWithAnalysis[] = data?.markets ?? [];

  const filtered = search
    ? markets.filter((m) =>
        m.question.toLowerCase().includes(search.toLowerCase())
      )
    : markets;

  async function handleDiscover() {
    setDiscovering(true);
    try {
      await fetch("/api/markets/discover", { method: "POST" });
    } finally {
      setDiscovering(false);
    }
  }

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Markets</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {markets.length} markets tracked
          </p>
        </div>
        <Button
          onClick={handleDiscover}
          disabled={discovering}
          className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white border-0 shadow-lg shadow-purple-500/15"
        >
          {discovering ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Compass className="h-4 w-4 mr-2" />
          )}
          Discover Markets
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search markets..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10 bg-surface-1 border-white/[0.06] h-10"
        />
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20">
          <BarChart3 className="h-10 w-10 mx-auto mb-3 text-muted-foreground/30" />
          <p className="text-sm text-muted-foreground">No markets found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((market) => {
            const yesPrice = market.outcomePrices?.[0] ?? 0;
            const noPrice = market.outcomePrices?.[1] ?? 0;
            const hasEdge = market.analysis && Math.abs(market.analysis.edge) >= 0.05;

            return (
              <Link key={market.id} href={`/markets/${market.id}`}>
                <Card className="border-white/[0.06] bg-surface-1 hover:bg-surface-2 hover:border-white/[0.1] transition-all duration-200 cursor-pointer group h-full">
                  <CardContent className="p-5 flex flex-col h-full">
                    {/* Question */}
                    <p className="text-sm font-medium text-foreground leading-snug line-clamp-2 group-hover:text-blue-300 transition-colors">
                      {market.question}
                    </p>

                    {/* Prices */}
                    <div className="flex items-center gap-2 mt-3">
                      <Badge className="bg-green-500/12 text-green-400 border-green-500/20 text-xs font-mono px-2">
                        Yes <AnimatedNumber value={Math.round(yesPrice * 100)} format="integer" size="sm" className="text-green-400 text-xs" />c
                      </Badge>
                      <Badge className="bg-red-500/12 text-red-400 border-red-500/20 text-xs font-mono px-2">
                        No <AnimatedNumber value={Math.round(noPrice * 100)} format="integer" size="sm" className="text-red-400 text-xs" />c
                      </Badge>
                    </div>

                    {/* Meta row */}
                    <div className="flex items-center gap-3 mt-auto pt-4 text-[11px] text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <TrendingUp className="h-3 w-3" />
                        {formatVolume(market.volume24hr)}
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatTimeRemaining(market.endDate)}
                      </div>
                      {hasEdge && (
                        <div className="flex items-center gap-1 text-amber-400 ml-auto">
                          <Sparkles className="h-3 w-3" />
                          <span className="font-medium">
                            <AnimatedNumber value={market.analysis!.edge * 100} format="decimal" decimals={1} size="sm" className="text-amber-400 text-[11px]" suffix="% edge" />
                          </span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
