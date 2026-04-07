"use client";

import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function useTrades(limit = 50) {
  return useSWR(`/api/trades?limit=${limit}`, fetcher, {
    refreshInterval: 15000,
  });
}
