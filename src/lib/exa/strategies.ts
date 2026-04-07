import type { ExaSearchResponse } from "@/types/exa";
import type { ResearchStrategy, ResearchItem } from "@/types/research";
import { ExaClient } from "./client";
import { PROBABILITY_OUTPUT_SCHEMA, SUPERFORECASTER_SYSTEM_PROMPT } from "./schemas";

const CREDIBLE_NEWS_DOMAINS = [
  "reuters.com", "bloomberg.com", "ft.com", "apnews.com",
  "bbc.com", "wsj.com", "economist.com", "cnbc.com",
  "nytimes.com", "washingtonpost.com", "theguardian.com",
];

// Cricket/IPL-specific domains for targeted research
const CRICKET_DOMAINS = [
  "espncricinfo.com", "cricbuzz.com", "iplt20.com",
  "bcci.tv", "cricketworld.com", "wisden.com",
  "sportskeeda.com", "ndtv.com", "hindustantimes.com",
  "indianexpress.com", "timesofindia.indiatimes.com",
  "scroll.in", "thebridge.in", "sportstar.thehindu.com",
];

interface StrategyResult {
  strategy: ResearchStrategy;
  query: string;
  exaSearchType: string;
  exaCategory?: string;
  results: ResearchItem[];
  costDollars: number;
  latencyMs: number;
}

function toResearchItems(response: ExaSearchResponse): ResearchItem[] {
  return response.results.map((r) => ({
    title: r.title,
    url: r.url,
    publishedDate: r.publishedDate,
    author: r.author,
    score: r.score,
    highlights: r.highlights ?? [],
    summary: r.summary ?? null,
    image: r.image,
  }));
}

function hoursAgo(hours: number): string {
  return new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
}

export async function breakingNews(client: ExaClient, question: string): Promise<StrategyResult> {
  const response = await client.search({
    query: question,
    type: "auto",
    category: "news",
    numResults: 3,
    includeDomains: [...CRICKET_DOMAINS, ...CREDIBLE_NEWS_DOMAINS],
    startPublishedDate: hoursAgo(48),
    contents: {
      highlights: { maxCharacters: 2000, query: question },
    },
  });

  return {
    strategy: "breaking_news",
    query: question,
    exaSearchType: "fast",
    exaCategory: "news",
    results: toResearchItems(response),
    costDollars: response.costDollars?.total ?? 0,
    latencyMs: (response as ExaSearchResponse & { _latencyMs: number })._latencyMs,
  };
}

export async function expertAnalysis(client: ExaClient, question: string): Promise<StrategyResult> {
  const query = `${question} IPL cricket prediction odds analysis`;
  const response = await client.search({
    query,
    type: "neural",
    numResults: 3,
    includeDomains: CRICKET_DOMAINS,
    startPublishedDate: hoursAgo(7 * 24),
    contents: {
      highlights: { maxCharacters: 2000, query: "prediction odds probability winner" },
      summary: { query: "What is the predicted outcome and why?" },
    },
  });

  return {
    strategy: "expert_analysis",
    query,
    exaSearchType: "neural",
    results: toResearchItems(response),
    costDollars: response.costDollars?.total ?? 0,
    latencyMs: (response as ExaSearchResponse & { _latencyMs: number })._latencyMs,
  };
}

export async function contraryEvidence(client: ExaClient, question: string): Promise<StrategyResult> {
  const query = `why ${question} unlikely underdog upset`;
  const response = await client.search({
    query,
    type: "neural",
    numResults: 3,
    includeDomains: CRICKET_DOMAINS,
    startPublishedDate: hoursAgo(7 * 24),
    contents: {
      highlights: { maxCharacters: 2000, query: "unlikely upset underdog weakness injury" },
    },
  });

  return {
    strategy: "contrary_evidence",
    query,
    exaSearchType: "neural",
    results: toResearchItems(response),
    costDollars: response.costDollars?.total ?? 0,
    latencyMs: (response as ExaSearchResponse & { _latencyMs: number })._latencyMs,
  };
}

export async function historicalPrecedent(client: ExaClient, seedUrl: string): Promise<StrategyResult> {
  const response = await client.findSimilar({
    url: seedUrl,
    numResults: 3,
    excludeSourceDomain: true,
    startPublishedDate: "2025-01-01T00:00:00.000Z",
    contents: {
      summary: true,
    },
  });

  return {
    strategy: "historical_precedent",
    query: `findSimilar: ${seedUrl}`,
    exaSearchType: "findSimilar",
    results: toResearchItems(response),
    costDollars: response.costDollars?.total ?? 0,
    latencyMs: (response as ExaSearchResponse & { _latencyMs: number })._latencyMs,
  };
}

export async function structuredProbability(client: ExaClient, question: string): Promise<StrategyResult> {
  // Use "auto" instead of "deep" to conserve free-tier API credits
  // Deep search is 10x more expensive; auto still gives good results
  const response = await client.search({
    query: `${question} cricket odds betting prediction probability`,
    type: "auto",
    numResults: 3,
    startPublishedDate: hoursAgo(14 * 24),
    includeDomains: CRICKET_DOMAINS,
    contents: {
      highlights: { maxCharacters: 1500, query: "odds probability prediction winner" },
      summary: { query: "What are the predicted odds and probability?" },
    },
  });

  return {
    strategy: "structured_probability",
    query: question,
    exaSearchType: "deep",
    results: toResearchItems(response),
    costDollars: response.costDollars?.total ?? 0,
    latencyMs: (response as ExaSearchResponse & { _latencyMs: number })._latencyMs,
  };
}

/**
 * Run research strategies for a market question.
 *
 * On free tier (lite=true): runs 3 strategies (breaking news + expert + contrary)
 * using ~9 Exa API calls per market (3 results each).
 *
 * On paid tier (lite=false): runs all 5 strategies including findSimilar and
 * structured probability for deeper analysis.
 */
export async function runAllStrategies(
  client: ExaClient,
  question: string,
  lite = true,
): Promise<StrategyResult[]> {
  // Step 1: Breaking news (always runs first — needed as seed for findSimilar)
  const newsResult = await breakingNews(client, question);
  const results: StrategyResult[] = [newsResult];

  // Step 2: Expert analysis + contrary evidence in parallel
  const [expert, contrary] = await Promise.all([
    expertAnalysis(client, question),
    contraryEvidence(client, question),
  ]);
  results.push(expert, contrary);

  // Step 3: Optional — only on paid tier
  if (!lite) {
    const seedUrl = newsResult.results[0]?.url;
    const [historical, structured] = await Promise.all([
      seedUrl
        ? historicalPrecedent(client, seedUrl)
        : Promise.resolve<StrategyResult>({
            strategy: "historical_precedent",
            query: "no seed URL available",
            exaSearchType: "findSimilar",
            results: [],
            costDollars: 0,
            latencyMs: 0,
          }),
      structuredProbability(client, question),
    ]);
    results.push(historical, structured);
  }

  return results;
}
