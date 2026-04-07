import { getExaClient } from "@/lib/exa/client";
import { runAllStrategies } from "@/lib/exa/strategies";
import { insertResearch } from "@/lib/db/queries";
import type { Market } from "@/types/market";
import type { ResearchResult } from "@/types/research";
import { agentBus } from "./events";

export async function researchMarket(market: Market): Promise<ResearchResult[]> {
  agentBus.emitEvent({
    type: "phase_change",
    phase: "researching",
    detail: `Researching: ${market.question}`,
  });

  const client = getExaClient();
  // Use lite mode (3 strategies) to conserve free-tier Exa credits
  const strategyResults = await runAllStrategies(client, market.question, true);

  const researchResults: ResearchResult[] = [];

  for (const sr of strategyResults) {
    agentBus.emitEvent({
      type: "research_started",
      marketId: market.id,
      strategy: sr.strategy,
      query: sr.query,
    });

    const id = `${market.id}-${sr.strategy}-${Date.now()}`;
    const research: ResearchResult = {
      id,
      marketId: market.id,
      strategy: sr.strategy,
      query: sr.query,
      exaSearchType: sr.exaSearchType,
      exaCategory: sr.exaCategory,
      results: sr.results,
      costDollars: sr.costDollars,
      latencyMs: sr.latencyMs,
      createdAt: new Date().toISOString(),
    };

    await insertResearch({
      ...research,
      results: research.results as unknown[],
    });

    researchResults.push(research);

    agentBus.emitEvent({
      type: "research_result",
      marketId: market.id,
      strategy: sr.strategy,
      resultCount: sr.results.length,
      latencyMs: sr.latencyMs,
      costDollars: sr.costDollars,
    });
  }

  return researchResults;
}

export async function researchMultipleMarkets(markets: Market[]): Promise<Map<string, ResearchResult[]>> {
  const results = new Map<string, ResearchResult[]>();

  // Research markets sequentially to avoid rate limits (10 QPS on Exa)
  for (const market of markets) {
    try {
      const research = await researchMarket(market);
      results.set(market.id, research);
    } catch (error) {
      agentBus.emitEvent({
        type: "error",
        message: `Research failed for "${market.question}": ${error instanceof Error ? error.message : String(error)}`,
      });
    }
  }

  return results;
}
