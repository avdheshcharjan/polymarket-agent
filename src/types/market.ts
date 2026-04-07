export interface Market {
  id: string;
  question: string;
  slug: string;
  outcomes: string[];
  outcomePrices: number[];
  volume: number;
  volume24hr: number;
  liquidity: number;
  endDate: string;
  image: string;
  bestBid: number;
  bestAsk: number;
  spread: number;
  clobTokenIds: string[];
  eventTitle: string;
  eventSlug: string;
  active: boolean;
  closed: boolean;
  lastUpdated: string;
}

export interface MarketWithAnalysis extends Market {
  analysis: MarketAnalysis | null;
  researchCount: number;
  agentDecision: AgentDecision | null;
}

export interface MarketAnalysis {
  id: string;
  marketId: string;
  estimatedProbability: number;
  confidence: number;
  edge: number;
  summary: string;
  bullCase: string;
  bearCase: string;
  keyFactors: string[];
  createdAt: string;
}

export interface AgentDecision {
  id: string;
  marketId: string;
  action: TradeAction;
  confidence: number;
  reasoning: string;
  researchIds: string[];
  estimatedProbability: number;
  marketPrice: number;
  edge: number;
  size: number;
  createdAt: string;
}

export type TradeAction = "buy_yes" | "buy_no" | "sell_yes" | "sell_no" | "hold";
