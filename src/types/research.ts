export type ResearchStrategy =
  | "breaking_news"
  | "expert_analysis"
  | "contrary_evidence"
  | "historical_precedent"
  | "structured_probability";

export interface ResearchResult {
  id: string;
  marketId: string;
  strategy: ResearchStrategy;
  query: string;
  exaSearchType: string;
  exaCategory?: string;
  results: ResearchItem[];
  costDollars: number;
  latencyMs: number;
  createdAt: string;
}

export interface ResearchItem {
  title: string;
  url: string;
  publishedDate: string | null;
  author: string | null;
  score: number;
  highlights: string[];
  summary: string | null;
  image: string | null;
}

export interface StructuredProbabilityOutput {
  probability: number;
  confidence: number;
  keyFactors: string[];
  reasoning: string;
}
