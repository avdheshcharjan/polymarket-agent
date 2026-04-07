export type TradeMode = "paper" | "real";
export type TradeStatus = "pending" | "filled" | "cancelled" | "failed";

export interface Trade {
  id: string;
  marketId: string;
  decisionId: string;
  mode: TradeMode;
  action: "buy_yes" | "buy_no" | "sell_yes" | "sell_no";
  outcome: string;
  price: number;
  size: number;
  shares: number;
  status: TradeStatus;
  clobOrderId?: string;
  pnl?: number;
  createdAt: string;
}

export interface Position {
  id: string;
  marketId: string;
  outcome: string;
  avgEntryPrice: number;
  shares: number;
  costBasis: number;
  currentPrice: number;
  currentValue: number;
  unrealizedPnl: number;
  unrealizedPnlPct: number;
}

export interface PortfolioSnapshot {
  timestamp: string;
  totalValue: number;
  cashBalance: number;
  positionsValue: number;
  totalPnl: number;
  totalPnlPct: number;
  winRate: number;
  totalTrades: number;
  positions: Position[];
}
