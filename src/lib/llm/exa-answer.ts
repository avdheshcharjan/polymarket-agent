import { getExaClient } from "@/lib/exa/client";
import type { ResearchResult } from "@/types/research";
import type { Market } from "@/types/market";
import type { Position } from "@/types/trade";

export interface TradeInstruction {
  action: "buy_yes" | "buy_no" | "sell" | "hold";
  size: number;          // Dollar amount to invest (0 if hold/sell)
  probability: number;   // Agent's estimated probability for outcome 1
  confidence: number;    // 0-1 how sure the agent is
  reasoning: string;     // Full explanation
  summary: string;       // 2-3 sentence summary
  exitStrategy: string;  // When/why to exit
}

const MAX_QUERY_LENGTH = 8000;

/**
 * The agent's brain. Given research about a market and portfolio context,
 * it autonomously decides: what to trade, how much to invest, and when to exit.
 *
 * The LLM makes ALL decisions — no hardcoded thresholds.
 */
export async function makeTradeDecision(input: {
  market: Market;
  research: ResearchResult[];
  cashBalance: number;
  existingPosition: Position | null;
  openPositionCount: number;
}): Promise<TradeInstruction> {
  const client = getExaClient();
  const { market, research, cashBalance, existingPosition, openPositionCount } = input;

  // Build compact research context
  const researchLines: string[] = [];
  for (const r of research) {
    const topHighlights = r.results
      .flatMap((item) => item.highlights)
      .filter(Boolean)
      .slice(0, 3)
      .map((h) => h.slice(0, 200));
    if (topHighlights.length > 0) {
      researchLines.push(`[${r.strategy}]: ${topHighlights.join(" | ")}`);
    }
  }
  const researchContext = researchLines.join("\n").slice(0, 4000);

  // Market context
  const team1 = market.outcomes[0] ?? "Outcome 1";
  const team2 = market.outcomes[1] ?? "Outcome 2";
  const price1 = market.outcomePrices[0] ?? 0.5;
  const price2 = market.outcomePrices[1] ?? 0.5;
  const hoursLeft = Math.max(0, (new Date(market.endDate).getTime() - Date.now()) / 3600000);

  // Position context
  const positionInfo = existingPosition
    ? `You already hold ${existingPosition.shares.toFixed(1)} shares of ${existingPosition.outcome} at avg price $${existingPosition.avgEntryPrice.toFixed(3)}, current P&L: $${existingPosition.unrealizedPnl.toFixed(2)}.`
    : "No existing position in this market.";

  const query = `You are an autonomous sports betting agent managing a $${cashBalance.toFixed(0)} bankroll with ${openPositionCount} open positions.

MARKET: "${market.question}"
${team1}: ${(price1 * 100).toFixed(1)}% ($${price1.toFixed(3)}) | ${team2}: ${(price2 * 100).toFixed(1)}% ($${price2.toFixed(3)})
Closes in: ${hoursLeft.toFixed(0)} hours | 24h Volume: $${market.volume24hr.toLocaleString()}
${positionInfo}

RESEARCH:
${researchContext}

Based on the research, make a trading decision. You must reply in EXACTLY this format:

action: <buy_yes or buy_no or sell or hold>
size: <dollar amount to invest, 0 if hold/sell, between 5 and ${Math.min(100, cashBalance * 0.15).toFixed(0)}>
probability: <your estimated probability for ${team1} winning, 0 to 1>
confidence: <how confident you are in your analysis, 0 to 1>
summary: <2-3 sentence analysis>
exit: <when to exit - e.g. "sell if odds shift 10%+ against us" or "hold until resolution">

RULES:
- buy_yes means you think ${team1} will win and current price ${(price1 * 100).toFixed(0)}% is too low
- buy_no means you think ${team2} will win and current price ${(price2 * 100).toFixed(0)}% is too low
- Only invest if you see real edge from the research, not gut feeling
- Size your bet proportionally to confidence: low confidence = small bet
- Never bet more than 15% of bankroll ($${(cashBalance * 0.15).toFixed(0)}) on one market
- If match is in <2 hours, odds are already sharp — need very strong evidence to trade`;

  const finalQuery = query.length > MAX_QUERY_LENGTH ? query.slice(0, MAX_QUERY_LENGTH) : query;

  const response = await client.answer({
    query: finalQuery,
    text: true,
    model: "exa",
  });

  return parseTradeInstruction(response.answer, market, cashBalance);
}

function parseTradeInstruction(answer: string, market: Market, cashBalance: number): TradeInstruction {
  console.log(`[Agent Brain] Raw response:\n${answer}\n`);

  // Parse structured fields
  const actionMatch = answer.match(/action[:\s]+(buy_yes|buy_no|sell|hold)/i);
  const sizeMatch = answer.match(/size[:\s]+\$?(\d+(?:\.\d+)?)/i);
  const probMatch = answer.match(/probability[:\s]+(\d*\.?\d+)/i);
  const confMatch = answer.match(/confidence[:\s]+(\d*\.?\d+)/i);
  const summaryMatch = answer.match(/summary[:\s]+(.+?)(?:\n|exit[:\s])/i);
  const exitMatch = answer.match(/exit[:\s]+(.+)/i);

  // Fallback probability extraction from natural language
  const fallbackProb = answer.match(/(\d+(?:\.\d+)?)\s*%/)
    ?? answer.match(/(\d*\.?\d+)\s*(?:probability|chance|likelihood)/i);

  let action = (actionMatch?.[1]?.toLowerCase() ?? "hold") as TradeInstruction["action"];
  let size = sizeMatch ? parseFloat(sizeMatch[1]) : 0;
  let probability = probMatch ? parseFloat(probMatch[1]) : (fallbackProb ? parseFloat(fallbackProb[1]) : 0.5);
  let confidence = confMatch ? parseFloat(confMatch[1]) : 0.5;
  const summary = summaryMatch?.[1]?.trim() ?? answer.slice(0, 300);
  const exitStrategy = exitMatch?.[1]?.trim() ?? "Hold until market resolution";

  // Normalize
  if (probability > 1) probability /= 100;
  if (confidence > 1) confidence /= 100;
  probability = Math.max(0.01, Math.min(0.99, probability));
  confidence = Math.max(0.1, Math.min(1, confidence));

  // Sanity: cap size at 15% of bankroll
  const maxBet = Math.min(100, cashBalance * 0.15);
  size = Math.min(size, maxBet);

  // If action is buy but size is 0, the LLM forgot to set size — derive from confidence
  if ((action === "buy_yes" || action === "buy_no") && size <= 0) {
    const marketPrice = market.outcomePrices[0] ?? 0.5;
    const edge = Math.abs(probability - marketPrice);
    size = Math.round(Math.min(maxBet, maxBet * confidence * Math.min(edge * 10, 1)));
    size = Math.max(5, size);
  }

  // If action is hold, zero out size
  if (action === "hold" || action === "sell") {
    size = 0;
  }

  console.log(`[Agent Brain] Decision: action=${action} size=$${size} prob=${probability.toFixed(3)} conf=${confidence.toFixed(2)}`);

  return {
    action,
    size,
    probability,
    confidence,
    reasoning: answer,
    summary,
    exitStrategy,
  };
}
