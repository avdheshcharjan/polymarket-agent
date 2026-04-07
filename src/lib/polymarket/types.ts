export interface GammaMarket {
  id: string;
  question: string;
  conditionId: string;
  slug: string;
  endDate: string;
  image: string;
  icon: string;
  description: string;
  outcomes: string;
  outcomePrices: string;
  volume: string;
  volume24hr: number;
  liquidity: string;
  active: boolean;
  closed: boolean;
  clobTokenIds: string;
  bestBid: number;
  bestAsk: number;
  spread: number;
  groupItemTitle: string;
  eventSlug: string;
}

export interface GammaEvent {
  id: string;
  slug: string;
  title: string;
  description: string;
  markets: GammaMarket[];
  startDate: string;
  endDate: string;
  volume: number;
  liquidity: number;
  active: boolean;
  closed: boolean;
  image: string;
}

export interface ClobOrderbook {
  market: string;
  asset_id: string;
  bids: ClobOrder[];
  asks: ClobOrder[];
  hash: string;
  timestamp: string;
}

export interface ClobOrder {
  price: string;
  size: string;
}

export interface ClobMidpoint {
  mid: string;
}

export interface ClobPriceHistoryPoint {
  t: number;
  p: number;
}
