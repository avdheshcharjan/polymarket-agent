export interface ExaSearchRequest {
  query: string;
  type?: "neural" | "fast" | "auto" | "deep" | "deep-lite" | "deep-reasoning" | "deep-max" | "instant";
  category?: "news" | "research paper" | "financial report" | "company" | "tweet" | "personal site" | "pdf";
  numResults?: number;
  includeDomains?: string[];
  excludeDomains?: string[];
  startPublishedDate?: string;
  endPublishedDate?: string;
  startCrawlDate?: string;
  endCrawlDate?: string;
  includeText?: string[];
  excludeText?: string[];
  contents?: ExaContentOptions;
  outputSchema?: Record<string, unknown>;
  systemPrompt?: string;
  additionalQueries?: string[];
}

export interface ExaContentOptions {
  text?: boolean | { maxCharacters?: number; includeHtmlTags?: boolean; verbosity?: "compact" | "standard" | "full" };
  highlights?: boolean | { maxCharacters?: number; query?: string };
  summary?: boolean | { query?: string; schema?: Record<string, unknown> };
  extras?: { links?: number; imageLinks?: number };
  maxAgeHours?: number;
  subpages?: number;
}

export interface ExaFindSimilarRequest {
  url: string;
  numResults?: number;
  includeDomains?: string[];
  excludeDomains?: string[];
  excludeSourceDomain?: boolean;
  startPublishedDate?: string;
  endPublishedDate?: string;
  category?: string;
  contents?: ExaContentOptions;
}

export interface ExaContentsRequest {
  ids: string[];
  text?: boolean | { maxCharacters?: number };
  highlights?: boolean | { maxCharacters?: number; query?: string };
  summary?: boolean | { query?: string };
  livecrawl?: "never" | "fallback" | "always" | "preferred";
  livecrawlTimeout?: number;
}

export interface ExaAnswerRequest {
  query: string;
  text?: boolean;
  stream?: boolean;
  systemPrompt?: string;
  model?: "exa" | "exa-pro";
  outputSchema?: Record<string, unknown>;
}

export interface ExaSearchResult {
  title: string;
  url: string;
  publishedDate: string | null;
  author: string | null;
  score: number;
  id: string;
  image: string | null;
  favicon: string | null;
  text?: string;
  highlights?: string[];
  highlightScores?: number[];
  summary?: string;
}

export interface ExaSearchResponse {
  requestId: string;
  results: ExaSearchResult[];
  costDollars: {
    total: number;
    search?: number;
    contents?: number;
  };
}

export interface ExaAnswerResponse {
  answer: string;
  citations: ExaSearchResult[];
  costDollars: { total: number };
}
