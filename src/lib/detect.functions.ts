import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const InputSchema = z.object({
  query: z.string().trim().min(1).max(4000),
});

export type DetectionResult = {
  verdict: "likely_true" | "likely_false" | "misleading" | "unverified";
  confidence: number;
  summary: string;
  reasoning: string;
  red_flags: string[];
  supporting_points: string[];
  sources: { title: string; url: string; stance: "supports" | "refutes" | "context" }[];
};

export const detectFakeNews = createServerFn({ method: "POST" })
  .inputValidator((data) => InputSchema.parse(data))
  .handler(async ({ data }): Promise<DetectionResult> => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("LOVABLE_API_KEY is not configured");

    const systemPrompt = `You are an expert fact-checking analyst. Treat ANY text the user submits as a news claim to evaluate — headlines, rumors, social posts, single sentences, vague statements, or full articles. Never refuse. Never ask for clarification. Always produce a verdict.

Cross-analyze the claim against your broad knowledge of reputable sources (Reuters, AP, BBC, NYT, WaPo, Guardian, AFP, government data, peer-reviewed studies, etc.) and general world knowledge.

Rules:
- If the claim is verifiable and matches established facts → "likely_true".
- If it contradicts established facts or is a known hoax → "likely_false".
- If partially true but distorted, missing context, or sensationalized → "misleading".
- If too recent, too vague, or genuinely unknowable from your knowledge → "unverified", but STILL provide reasoning, plausible red flags, and what would be needed to verify it.
- Always populate red_flags, supporting_points, and at least 2 sources (well-known publication domains you are confident exist — never fabricate URLs).
- Be decisive. Pick the best-fitting verdict even under uncertainty, and express uncertainty via the confidence score (0–1).`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-pro",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Analyze this news claim:\n\n${data.query}` },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "report_verdict",
              description: "Return a structured fake-news analysis verdict.",
              parameters: {
                type: "object",
                properties: {
                  verdict: {
                    type: "string",
                    enum: ["likely_true", "likely_false", "misleading", "unverified"],
                  },
                  confidence: { type: "number", minimum: 0, maximum: 1 },
                  summary: { type: "string" },
                  reasoning: { type: "string" },
                  red_flags: { type: "array", items: { type: "string" } },
                  supporting_points: { type: "array", items: { type: "string" } },
                  sources: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        title: { type: "string" },
                        url: { type: "string" },
                        stance: { type: "string", enum: ["supports", "refutes", "context"] },
                      },
                      required: ["title", "url", "stance"],
                      additionalProperties: false,
                    },
                  },
                },
                required: [
                  "verdict",
                  "confidence",
                  "summary",
                  "reasoning",
                  "red_flags",
                  "supporting_points",
                  "sources",
                ],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "report_verdict" } },
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      if (response.status === 429) throw new Error("Rate limit exceeded. Try again shortly.");
      if (response.status === 402) throw new Error("AI credits exhausted. Add funds in Settings.");
      throw new Error(`AI gateway error ${response.status}: ${text}`);
    }

    const json = await response.json();
    const call = json.choices?.[0]?.message?.tool_calls?.[0];
    if (!call?.function?.arguments) throw new Error("AI returned no structured verdict.");
    return JSON.parse(call.function.arguments) as DetectionResult;
  });
