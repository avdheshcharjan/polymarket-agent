import type {
  ExaSearchRequest,
  ExaSearchResponse,
  ExaFindSimilarRequest,
  ExaContentsRequest,
  ExaAnswerRequest,
  ExaAnswerResponse,
} from "@/types/exa";

const EXA_BASE_URL = "https://api.exa.ai";

interface ExaClientOptions {
  apiKey: string;
  onCost?: (endpoint: string, cost: number) => void;
}

export class ExaClient {
  private apiKey: string;
  private onCost?: (endpoint: string, cost: number) => void;

  constructor(options: ExaClientOptions) {
    this.apiKey = options.apiKey;
    this.onCost = options.onCost;
  }

  private async request<T>(endpoint: string, body: Record<string, unknown>): Promise<T & { _latencyMs: number }> {
    const start = performance.now();
    const res = await fetch(`${EXA_BASE_URL}${endpoint}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": this.apiKey,
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const error = await res.text();
      throw new Error(`Exa ${endpoint} failed (${res.status}): ${error}`);
    }

    const data = await res.json() as T & { costDollars?: { total: number } };
    const latencyMs = Math.round(performance.now() - start);

    if (data.costDollars?.total && this.onCost) {
      this.onCost(endpoint, data.costDollars.total);
    }

    return { ...data, _latencyMs: latencyMs } as T & { _latencyMs: number };
  }

  async search(params: ExaSearchRequest): Promise<ExaSearchResponse & { _latencyMs: number }> {
    return this.request<ExaSearchResponse>("/search", {
      query: params.query,
      type: params.type ?? "auto",
      category: params.category,
      numResults: params.numResults ?? 10,
      includeDomains: params.includeDomains,
      excludeDomains: params.excludeDomains,
      startPublishedDate: params.startPublishedDate,
      endPublishedDate: params.endPublishedDate,
      startCrawlDate: params.startCrawlDate,
      endCrawlDate: params.endCrawlDate,
      includeText: params.includeText,
      excludeText: params.excludeText,
      contents: params.contents,
      output_schema: params.outputSchema,
      system_prompt: params.systemPrompt,
      additionalQueries: params.additionalQueries,
    });
  }

  async findSimilar(params: ExaFindSimilarRequest): Promise<ExaSearchResponse & { _latencyMs: number }> {
    return this.request<ExaSearchResponse>("/findSimilar", {
      url: params.url,
      numResults: params.numResults ?? 5,
      includeDomains: params.includeDomains,
      excludeDomains: params.excludeDomains,
      excludeSourceDomain: params.excludeSourceDomain,
      startPublishedDate: params.startPublishedDate,
      endPublishedDate: params.endPublishedDate,
      category: params.category,
      contents: params.contents,
    });
  }

  async getContents(params: ExaContentsRequest): Promise<ExaSearchResponse & { _latencyMs: number }> {
    return this.request<ExaSearchResponse>("/contents", {
      ids: params.ids,
      text: params.text,
      highlights: params.highlights,
      summary: params.summary,
      livecrawl: params.livecrawl,
      livecrawlTimeout: params.livecrawlTimeout,
    });
  }

  async answer(params: ExaAnswerRequest): Promise<ExaAnswerResponse & { _latencyMs: number }> {
    return this.request<ExaAnswerResponse>("/answer", {
      query: params.query,
      text: params.text ?? true,
      model: params.model ?? "exa",
      output_schema: params.outputSchema,
    });
  }

  async *streamAnswer(params: ExaAnswerRequest): AsyncGenerator<string, void, unknown> {
    const res = await fetch(`${EXA_BASE_URL}/answer`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": this.apiKey,
      },
      body: JSON.stringify({
        query: params.query,
        text: params.text ?? true,
        stream: true,
        model: params.model ?? "exa",
        system_prompt: params.systemPrompt,
      }),
    });

    if (!res.ok) {
      throw new Error(`Exa /answer stream failed (${res.status})`);
    }

    const reader = res.body?.getReader();
    if (!reader) throw new Error("No response body");

    const decoder = new TextDecoder();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      yield decoder.decode(value, { stream: true });
    }
  }
}

let _client: ExaClient | null = null;

export function getExaClient(): ExaClient {
  if (!_client) {
    const apiKey = process.env.EXA_API_KEY;
    if (!apiKey) throw new Error("EXA_API_KEY environment variable is required");
    _client = new ExaClient({ apiKey });
  }
  return _client;
}
