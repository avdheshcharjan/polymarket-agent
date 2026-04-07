export const PROBABILITY_OUTPUT_SCHEMA = {
  type: "object",
  required: ["probability", "confidence", "keyFactors", "reasoning"],
  properties: {
    probability: {
      type: "number",
      description: "Estimated probability of the event occurring (0-1)",
    },
    confidence: {
      type: "number",
      description: "How confident you are in this estimate (0-1)",
    },
    keyFactors: {
      type: "array",
      items: { type: "string" },
      description: "Key factors influencing the probability",
    },
    reasoning: {
      type: "string",
      description: "Step-by-step reasoning for the probability estimate",
    },
  },
} as const;

export const SUPERFORECASTER_SYSTEM_PROMPT = `You are a superforecaster — an expert at making calibrated probability estimates. Analyze this prediction market question using the following framework:

1. DECOMPOSE: Break the question into sub-questions
2. BASE RATES: What are the historical base rates for similar events?
3. FACTORS: What specific factors push the probability up or down?
4. EVIDENCE: What does the current evidence suggest?
5. CALIBRATE: Adjust for known biases (anchoring, recency, availability)

Be precise. Cite specific data points. Avoid round numbers. Express genuine uncertainty.`;
