"use client";

import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function useMarkets(limit = 50) {
  return useSWR(`/api/markets?limit=${limit}`, fetcher, {
    refreshInterval: 30000,
  });
}

export function useMarketDetail(marketId: string) {
  return useSWR(marketId ? `/api/markets/${marketId}` : null, fetcher, {
    refreshInterval: 15000,
  });
}
