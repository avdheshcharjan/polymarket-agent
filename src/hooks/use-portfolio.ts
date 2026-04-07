"use client";

import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function useSettings() {
  return useSWR("/api/settings", fetcher);
}
