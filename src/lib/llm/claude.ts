import type { ResearchResult } from "@/types/research";
import type { Market } from "@/types/market";

interface AnalysisOutput {
  estimatedProbability: number;
  confidence: number;
  summary: string;
  bullCase: string;
  bearCase: string;
  keyFactors: string[];
  recommendedAction: "buy_yes" | "buy_no" | "hold";
  reasoning: string;
}

export async function analyzeWithClaude(input: {
  market: Market;
  research: ResearchResult[];
}): Promise<AnalysisOutput> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY required for Claude analysis");

  const { market, research } = input;

  const researchContext = research.map((r) => {
    const highlights = r.results
      .flatMap((item) => item.highlights)
      .filter(Boolean)
      .slice(0, 3)
      .map((h) => h.slice(0, 200))
      .join(" | ");
    return `[${r.strategy}]: ${highlights}`;
  }).join("\n").slice(0, 5000);

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-6",
      max_tokens: 2000,
      system: `You are a superforecaster analyzing prediction markets. You must respond with ONLY valid JSON matching this schema:
{
  "estimatedProbability": number (0-1),
  "confidence": number (0-1),
  "summary": string (2-3 sentences),
  "bullCase": string,
  "bearCase": string,
  "keyFactors": string[],
  "recommendedAction": "buy_yes" | "buy_no" | "hold",
  "reasoning": string
}`,
      messages: [
        {
          role: "user",
          content: `Analyze this prediction market:

Question: "${market.question}"
Current YES price: ${market.outcomePrices[0]}
Market closes: ${market.endDate}
24h volume: $${market.volume24hr.toLocaleString()}

Research gathered:
${researchContext}

Respond with JSON only.`,
        },
      ],
    }),
  });

  if (!res.ok) {
    throw new Error(`Claude API failed (${res.status}): ${await res.text()}`);
  }

  const data = await res.json();
  const text = data.content?.[0]?.text ?? "{}";

  try {
    return JSON.parse(text);
  } catch {
    // If Claude doesn't return valid JSON, return defaults
    return {
      estimatedProbability: 0.5,
      confidence: 0.3,
      summary: text.slice(0, 300),
      bullCase: "",
      bearCase: "",
      keyFactors: [],
      recommendedAction: "hold",
      reasoning: text,
    };
  }
}
