"use client";

import { useState } from "react";
import { useTrades } from "@/hooks/use-trades";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { AnimatedNumber } from "@/components/ui/animated-number";
import { ChevronDown, ChevronRight, History, Loader2 } from "lucide-react";
import type { Trade } from "@/types/trade";

const statusStyles: Record<string, string> = {
  filled: "bg-green-500/10 text-green-400 border-green-500/20",
  pending: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  cancelled: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20",
  failed: "bg-red-500/10 text-red-400 border-red-500/20",
};

const actionStyles: Record<string, string> = {
  buy_yes: "bg-green-500/10 text-green-400 border-green-500/20",
  buy_no: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  sell_yes: "bg-red-500/10 text-red-400 border-red-500/20",
  sell_no: "bg-orange-500/10 text-orange-400 border-orange-500/20",
};

export default function TradesPage() {
  const { data, isLoading } = useTrades(50);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  const trades: Trade[] = data?.trades ?? [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-5">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Trades</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          {trades.length} trades executed
        </p>
      </div>

      {trades.length === 0 ? (
        <div className="text-center py-20 rounded-xl border border-white/[0.06] bg-surface-1">
          <History className="h-10 w-10 mx-auto mb-3 text-muted-foreground/30" />
          <p className="text-sm text-muted-foreground">No trade history yet</p>
          <p className="text-xs text-muted-foreground/60 mt-1">
            Trades will appear here after the agent executes
          </p>
        </div>
      ) : (
        <div className="rounded-xl border border-white/[0.06] bg-surface-1 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="border-white/[0.06] hover:bg-transparent">
                <TableHead className="text-xs text-muted-foreground font-medium w-8" />
                <TableHead className="text-xs text-muted-foreground font-medium">
                  Date
                </TableHead>
                <TableHead className="text-xs text-muted-foreground font-medium">
                  Market
                </TableHead>
                <TableHead className="text-xs text-muted-foreground font-medium">
                  Action
                </TableHead>
                <TableHead className="text-xs text-muted-foreground font-medium text-right">
                  Price
                </TableHead>
                <TableHead className="text-xs text-muted-foreground font-medium text-right">
                  Size
                </TableHead>
                <TableHead className="text-xs text-muted-foreground font-medium text-right">
                  P&L
                </TableHead>
                <TableHead className="text-xs text-muted-foreground font-medium text-center">
                  Status
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {trades.map((trade) => {
                const isExpanded = expandedRow === trade.id;
                const pnl = trade.pnl ?? 0;
                const isProfitable = pnl >= 0;

                return (
                  <>
                    <TableRow
                      key={trade.id}
                      onClick={() =>
                        setExpandedRow(isExpanded ? null : trade.id)
                      }
                      className="border-white/[0.04] cursor-pointer hover:bg-white/[0.02] transition-colors"
                    >
                      <TableCell className="w-8 pl-4">
                        {isExpanded ? (
                          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                        ) : (
                          <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                        )}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground font-mono">
                        {new Date(trade.createdAt).toLocaleDateString([], {
                          month: "short",
                          day: "numeric",
                        })}
                      </TableCell>
                      <TableCell className="text-sm text-foreground max-w-[200px] truncate">
                        {trade.marketId.slice(0, 8)}...
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={`${
                            actionStyles[trade.action] ?? ""
                          } text-[11px] uppercase tracking-wider font-mono`}
                        >
                          {trade.action.replace(/_/g, " ")}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        <AnimatedNumber
                          value={trade.price}
                          format="currency"
                          size="sm"
                          className="text-foreground"
                        />
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        <AnimatedNumber
                          value={trade.size}
                          format="currency"
                          size="sm"
                          className="text-foreground"
                        />
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {trade.pnl != null ? (
                          <AnimatedNumber
                            value={pnl}
                            format="currency"
                            showSign
                            colorize
                            size="sm"
                          />
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge
                          className={`${
                            statusStyles[trade.status] ?? ""
                          } text-[11px] uppercase tracking-wider`}
                        >
                          {trade.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                    {isExpanded && (
                      <TableRow
                        key={`${trade.id}-detail`}
                        className="border-white/[0.04]"
                      >
                        <TableCell colSpan={8} className="bg-surface-2/50 px-8 py-4">
                          <div className="space-y-2 text-xs text-muted-foreground">
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <span className="text-[11px] uppercase tracking-wider text-muted-foreground/60">
                                  Trade ID
                                </span>
                                <p className="font-mono mt-0.5">{trade.id}</p>
                              </div>
                              <div>
                                <span className="text-[11px] uppercase tracking-wider text-muted-foreground/60">
                                  Market ID
                                </span>
                                <p className="font-mono mt-0.5">
                                  {trade.marketId}
                                </p>
                              </div>
                              <div>
                                <span className="text-[11px] uppercase tracking-wider text-muted-foreground/60">
                                  Shares
                                </span>
                                <p className="font-mono mt-0.5">
                                  {trade.shares.toFixed(4)}
                                </p>
                              </div>
                              <div>
                                <span className="text-[11px] uppercase tracking-wider text-muted-foreground/60">
                                  Mode
                                </span>
                                <p className="mt-0.5 capitalize">{trade.mode}</p>
                              </div>
                            </div>
                            {trade.clobOrderId && (
                              <div>
                                <span className="text-[11px] uppercase tracking-wider text-muted-foreground/60">
                                  CLOB Order ID
                                </span>
                                <p className="font-mono mt-0.5">
                                  {trade.clobOrderId}
                                </p>
                              </div>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
