"use client";

import {
  TrendingUp,
  TrendingDown,
  Target,
  Briefcase,
  RotateCcw,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { AnimatedNumber } from "@/components/ui/animated-number";

interface StatsRowProps {
  totalPnl: number;
  totalPnlPct: number;
  winRate: number;
  activePositions: number;
  cycleCount: number;
}

export function StatsRow({
  totalPnl,
  totalPnlPct,
  winRate,
  activePositions,
  cycleCount,
}: StatsRowProps) {
  const isProfitable = totalPnl >= 0;

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {/* Total P&L */}
      <Card className="border-white/[0.06] bg-surface-1 hover:bg-surface-2 transition-colors duration-200">
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <p className="text-[11px] text-muted-foreground uppercase tracking-wider">
                Total P&L
              </p>
              <AnimatedNumber
                value={totalPnl}
                format="currency"
                showSign
                colorize
                size="xl"
              />
              <div>
                <AnimatedNumber
                  value={totalPnlPct}
                  format="percent"
                  showSign
                  colorize
                  size="sm"
                />
              </div>
            </div>
            <div
              className={`flex h-9 w-9 items-center justify-center rounded-lg ${
                isProfitable ? "bg-green-500/10" : "bg-red-500/10"
              }`}
            >
              {isProfitable ? (
                <TrendingUp className="h-4.5 w-4.5 text-green-500" />
              ) : (
                <TrendingDown className="h-4.5 w-4.5 text-red-500" />
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Win Rate */}
      <Card className="border-white/[0.06] bg-surface-1 hover:bg-surface-2 transition-colors duration-200">
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <p className="text-[11px] text-muted-foreground uppercase tracking-wider">
                Win Rate
              </p>
              <AnimatedNumber
                value={winRate}
                format="percent"
                size="xl"
                className={winRate >= 50 ? "text-green-400" : "text-amber-400"}
              />
              <p className="text-[11px] text-muted-foreground">all time</p>
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-500/10">
              <Target className="h-4.5 w-4.5 text-blue-500" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Active Positions */}
      <Card className="border-white/[0.06] bg-surface-1 hover:bg-surface-2 transition-colors duration-200">
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <p className="text-[11px] text-muted-foreground uppercase tracking-wider">
                Active Positions
              </p>
              <AnimatedNumber
                value={activePositions}
                format="integer"
                size="xl"
              />
              <p className="text-[11px] text-muted-foreground">open</p>
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-purple-500/10">
              <Briefcase className="h-4.5 w-4.5 text-purple-500" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Agent Cycles */}
      <Card className="border-white/[0.06] bg-surface-1 hover:bg-surface-2 transition-colors duration-200">
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <p className="text-[11px] text-muted-foreground uppercase tracking-wider">
                Agent Cycles
              </p>
              <AnimatedNumber
                value={cycleCount}
                format="integer"
                size="xl"
              />
              <p className="text-[11px] text-muted-foreground">completed</p>
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500/10">
              <RotateCcw className="h-4.5 w-4.5 text-amber-500" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
