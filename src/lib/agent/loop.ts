import { discoverMarkets, filterMarkets } from "./discover";
import { researchMultipleMarkets } from "./research";
import { analyzeMarket } from "./analyze";
import { executeDecisions } from "./execute";
import { monitorPositions } from "./monitor";
import { agentBus } from "./events";
import { getSetting } from "@/lib/db/queries";
import { DEFAULT_AGENT_CONFIG, type AgentConfig } from "@/types/agent";

export async function runAgentCycle(): Promise<{
  marketsDiscovered: number;
  marketsResearched: number;
  tradesExecuted: number;
  portfolioValue: number;
}> {
  if (!agentBus.acquireLock()) {
    throw new Error("Agent cycle already in progress");
  }

  try {
    // Load config
    const savedConfig = await getSetting<AgentConfig>("agent_config");
    const config: AgentConfig = { ...DEFAULT_AGENT_CONFIG, ...savedConfig };

    // Step 1: Discover markets
    const allMarkets = await discoverMarkets(config);

    // Step 2: Filter to candidates
    const candidates = await filterMarkets(allMarkets, config);

    if (candidates.length === 0) {
      agentBus.emitEvent({
        type: "phase_change",
        phase: "idle",
        detail: "No qualifying markets found",
      });
      agentBus.incrementCycle();
      agentBus.releaseLock();
      return { marketsDiscovered: allMarkets.length, marketsResearched: 0, tradesExecuted: 0, portfolioValue: 0 };
    }

    // Step 3: Research each candidate
    const researchMap = await researchMultipleMarkets(candidates);

    // Step 4: Analyze and decide
    const decisions = [];
    for (const market of candidates) {
      const research = researchMap.get(market.id);
      if (!research || research.length === 0) continue;

      try {
        const decision = await analyzeMarket(market, research, config);
        decisions.push(decision);
      } catch (error) {
        agentBus.emitEvent({
          type: "error",
          message: `Analysis failed for "${market.question}": ${error instanceof Error ? error.message : String(error)}`,
        });
      }
    }

    // Step 5: Execute trades
    const trades = await executeDecisions(decisions, config);

    // Step 6: Monitor portfolio
    const snapshot = await monitorPositions();

    // Done
    agentBus.emitEvent({
      type: "phase_change",
      phase: "idle",
      detail: `Cycle complete: ${trades.length} trades executed`,
    });
    agentBus.incrementCycle();

    return {
      marketsDiscovered: allMarkets.length,
      marketsResearched: candidates.length,
      tradesExecuted: trades.length,
      portfolioValue: snapshot.totalValue,
    };
  } catch (error) {
    agentBus.emitEvent({
      type: "error",
      message: `Agent cycle failed: ${error instanceof Error ? error.message : String(error)}`,
    });
    throw error;
  } finally {
    agentBus.releaseLock();
  }
}
