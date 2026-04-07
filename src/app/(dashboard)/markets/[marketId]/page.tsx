"use client";

import { useParams } from "next/navigation";
import { useMarketDetail } from "@/hooks/use-markets";
import { useTrades } from "@/hooks/use-trades";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { AnimatedNumber } from "@/components/ui/animated-number";
import {
  ArrowLeft,
  TrendingUp,
  Clock,
  BarChart3,
  Target,
  Sparkles,
  CheckCircle2,
  XCircle,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import type { MarketWithAnalysis } from "@/types/market";
import type { Trade } from "@/types/trade";

function formatTimeRemaining(endDate: string) {
  const diff = new Date(endDate).getTime() - Date.now();
  if (diff <= 0) return "Expired";
  const hours = Math.floor(diff / (1000 * 60 * 60));
  if (hours < 24) return `${hours} hours`;
  const days = Math.floor(hours / 24);
  return `${days} days`;
}

function formatVolume(vol: number) {
  if (vol >= 1_000_000) return `$${(vol / 1_000_000).toFixed(2)}M`;
  if (vol >= 1_000) return `$${(vol / 1_000).toFixed(1)}K`;
  return `$${vol.toFixed(0)}`;
}

export default function MarketDetailPage() {
  const params = useParams();
  const marketId = params.marketId as string;
  const { data, isLoading } = useMarketDetail(marketId);
  const { data: tradesData } = useTrades(50);

  const market: MarketWithAnalysis | null = data?.market ?? null;
  const allTrades: Trade[] = tradesData?.trades ?? [];
  const marketTrades = allTrades.filter((t) => t.marketId === marketId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!market) {
    return (
      <div className="p-6">
        <Link
          href="/markets"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Markets
        </Link>
        <div className="text-center py-20">
          <p className="text-sm text-muted-foreground">Market not found</p>
        </div>
      </div>
    );
  }

  const yesPrice = market.outcomePrices?.[0] ?? 0;
  const noPrice = market.outcomePrices?.[1] ?? 0;
  const analysis = market.analysis;

  return (
    <div className="p-6 space-y-6">
      {/* Back link */}
      <Link
        href="/markets"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Markets
      </Link>

      {/* Market header */}
      <div className="space-y-3">
        <h1 className="text-xl font-semibold text-foreground leading-snug">
          {market.question}
        </h1>
        <div className="flex items-center gap-3 flex-wrap">
          <Badge className="bg-green-500/12 text-green-400 border-green-500/20 font-mono">
            Yes {(yesPrice * 100).toFixed(1)}c
          </Badge>
          <Badge className="bg-red-500/12 text-red-400 border-red-500/20 font-mono">
            No {(noPrice * 100).toFixed(1)}c
          </Badge>
          <Badge
            className={`text-[11px] uppercase ${
              market.active
                ? "bg-green-500/10 text-green-400 border-green-500/20"
                : "bg-zinc-500/10 text-zinc-400 border-zinc-500/20"
            }`}
          >
            {market.active ? "Active" : "Closed"}
          </Badge>
        </div>
      </div>

      {/* Info cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-white/[0.06] bg-surface-1">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
              <TrendingUp className="h-3 w-3" />
              24h Volume
            </div>
            <AnimatedNumber
              value={market.volume24hr >= 1_000_000 ? market.volume24hr / 1_000_000 : market.volume24hr >= 1_000 ? market.volume24hr / 1_000 : market.volume24hr}
              format="currency"
              decimals={market.volume24hr >= 1_000_000 ? 1 : market.volume24hr >= 1_000 ? 1 : 0}
              suffix={market.volume24hr >= 1_000_000 ? "M" : market.volume24hr >= 1_000 ? "K" : ""}
              size="md"
            />
          </CardContent>
        </Card>
        <Card className="border-white/[0.06] bg-surface-1">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
              <BarChart3 className="h-3 w-3" />
              Total Volume
            </div>
            <AnimatedNumber
              value={market.volume >= 1_000_000 ? market.volume / 1_000_000 : market.volume >= 1_000 ? market.volume / 1_000 : market.volume}
              format="currency"
              decimals={market.volume >= 1_000_000 ? 2 : market.volume >= 1_000 ? 1 : 0}
              suffix={market.volume >= 1_000_000 ? "M" : market.volume >= 1_000 ? "K" : ""}
              size="md"
            />
          </CardContent>
        </Card>
        <Card className="border-white/[0.06] bg-surface-1">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
              <Clock className="h-3 w-3" />
              Time Left
            </div>
            <p className="text-lg font-semibold text-foreground">
              {formatTimeRemaining(market.endDate)}
            </p>
          </CardContent>
        </Card>
        <Card className="border-white/[0.06] bg-surface-1">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
              <Target className="h-3 w-3" />
              Spread
            </div>
            <AnimatedNumber
              value={market.spread * 100}
              format="percent"
              size="md"
            />
          </CardContent>
        </Card>
      </div>

      {/* Analysis panel */}
      {analysis && (
        <Card className="border-white/[0.06] bg-surface-1">
          <CardContent className="p-5 space-y-4">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-amber-400" />
              <h2 className="text-sm font-semibold text-foreground">
                AI Analysis
              </h2>
              <Badge className="bg-amber-500/10 text-amber-400 border-amber-500/20 text-[11px] uppercase ml-auto">
                {(analysis.confidence * 100).toFixed(0)}% confidence
              </Badge>
            </div>

            <p className="text-sm text-foreground/80 leading-relaxed">
              {analysis.summary}
            </p>

            <div className="grid grid-cols-3 gap-4 py-2">
              <div className="text-center">
                <p className="text-xs text-muted-foreground mb-1">
                  Est. Probability
                </p>
                <AnimatedNumber
                  value={analysis.estimatedProbability * 100}
                  format="percent"
                  size="lg"
                />
              </div>
              <div className="text-center">
                <p className="text-xs text-muted-foreground mb-1">Edge</p>
                <AnimatedNumber
                  value={analysis.edge * 100}
                  format="percent"
                  showSign
                  colorize
                  size="lg"
                />
              </div>
              <div className="text-center">
                <p className="text-xs text-muted-foreground mb-1">
                  Confidence
                </p>
                <AnimatedNumber
                  value={analysis.confidence * 100}
                  format="percent"
                  decimals={0}
                  size="lg"
                />
              </div>
            </div>

            <Separator className="bg-white/[0.06]" />

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-medium text-green-400">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Bull Case
                </div>
                <p className="text-xs text-foreground/70 leading-relaxed">
                  {analysis.bullCase}
                </p>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-medium text-red-400">
                  <XCircle className="h-3.5 w-3.5" />
                  Bear Case
                </div>
                <p className="text-xs text-foreground/70 leading-relaxed">
                  {analysis.bearCase}
                </p>
              </div>
            </div>

            {analysis.keyFactors.length > 0 && (
              <>
                <Separator className="bg-white/[0.06]" />
                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Key Factors
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {analysis.keyFactors.map((factor, i) => (
                      <Badge
                        key={i}
                        className="bg-surface-2 text-foreground/60 border-white/[0.06] text-[11px]"
                      >
                        {factor}
                      </Badge>
                    ))}
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Agent Decision */}
      {market.agentDecision && (
        <Card className="border-white/[0.06] bg-surface-1">
          <CardContent className="p-5 space-y-3">
            <h2 className="text-sm font-semibold text-foreground">
              Agent Decision
            </h2>
            <div className="flex items-center gap-3">
              <Badge
                className={`uppercase text-xs font-mono ${
                  market.agentDecision.action === "hold"
                    ? "bg-zinc-500/10 text-zinc-400 border-zinc-500/20"
                    : market.agentDecision.action.startsWith("buy")
                    ? "bg-green-500/10 text-green-400 border-green-500/20"
                    : "bg-red-500/10 text-red-400 border-red-500/20"
                }`}
              >
                {market.agentDecision.action.replace(/_/g, " ")}
              </Badge>
              <span className="text-sm text-foreground/70">
                Size: ${market.agentDecision.size.toFixed(2)}
              </span>
            </div>
            <p className="text-xs text-foreground/60 leading-relaxed">
              {market.agentDecision.reasoning}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Trade history for this market */}
      {marketTrades.length > 0 && (
        <Card className="border-white/[0.06] bg-surface-1">
          <CardContent className="p-5 space-y-3">
            <h2 className="text-sm font-semibold text-foreground">
              Trade History
            </h2>
            <div className="space-y-2">
              {marketTrades.map((trade) => {
                const pnl = trade.pnl ?? 0;
                const isProfitable = pnl >= 0;
                return (
                  <div
                    key={trade.id}
                    className="flex items-center justify-between rounded-lg border border-white/[0.04] bg-surface-2/50 px-4 py-2.5"
                  >
                    <div className="flex items-center gap-3">
                      <Badge
                        className={`text-[11px] uppercase font-mono ${
                          trade.action.startsWith("buy")
                            ? "bg-green-500/10 text-green-400 border-green-500/20"
                            : "bg-red-500/10 text-red-400 border-red-500/20"
                        }`}
                      >
                        {trade.action.replace(/_/g, " ")}
                      </Badge>
                      <span className="text-xs text-muted-foreground font-mono">
                        {new Date(trade.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-sm font-mono">
                      <AnimatedNumber
                        value={trade.size}
                        format="currency"
                        size="sm"
                        className="text-foreground"
                      />
                      {trade.pnl != null && (
                        <AnimatedNumber
                          value={pnl}
                          format="currency"
                          showSign
                          colorize
                          size="sm"
                        />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
