import { type NextRequest, NextResponse } from "next/server"
import { generateText } from "ai"
import { openai } from "@ai-sdk/openai"
import type { SentimentData } from "@/lib/types"

export interface ThemeData {
  theme: string
  sentiment: "positive" | "neutral" | "negative"
  description: string
}

export interface SummaryResponse {
  executive_summary: string
  key_themes: ThemeData[]
}

export async function POST(request: NextRequest) {
  try {
    const sentimentData: SentimentData = await request.json()

    // Build prompt for GPT-5
    const prompt = buildAnalysisPrompt(sentimentData)

    const model = openai("gpt-5")

    const { text: result } = await generateText({
      model,
      prompt,
      temperature: 0.5,
    })

    console.log("[summary] GPT-5 response:", result)

    // Parse the response
    const parsed = parseAIResponse(result)

    return NextResponse.json(parsed)
  } catch (error) {
    console.error("[summary] Error:", error)
    return NextResponse.json(
      {
        error: "Failed to generate summary",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

function buildAnalysisPrompt(data: SentimentData): string {
  const mentionsText = data.mentions
    .map((m) => {
      const title = m.text
      const body = m.body ? `\n${m.body}` : ""
      return `[${m.sentiment.toUpperCase()}] ${title}${body} (score: ${m.score})`
    })
    .join("\n\n")

  return `You are analyzing Reddit sentiment data. Please provide an executive summary and identify key themes.

SENTIMENT DATA:
- Overall Score: ${data.score.toFixed(2)} (-100 to 100 scale)
- Total Mentions: ${data.total}
- Positive: ${data.positive}
- Neutral: ${data.neutral}
- Negative: ${data.negative}

REDDIT POSTS (with full text):
${mentionsText}

Please respond with ONLY valid JSON in this exact format:
{
  "executive_summary": "A concise 2-3 sentence paragraph summarizing the overall sentiment and key findings.",
  "key_themes": [
    {
      "theme": "Theme name",
      "sentiment": "positive" | "neutral" | "negative",
      "description": "Brief description of this theme"
    }
  ]
}

Identify 3-5 key themes. Be specific and actionable.`
}

function parseAIResponse(text: string): SummaryResponse {
  try {
    // Try to extract JSON from the response
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error("No JSON found in response")
    }

    const parsed = JSON.parse(jsonMatch[0])

    // Validate structure
    if (!parsed.executive_summary || !Array.isArray(parsed.key_themes)) {
      throw new Error("Invalid response structure")
    }

    return parsed as SummaryResponse
  } catch (error) {
    console.error("[summary] Parse error:", error)
    // Return fallback
    return {
      executive_summary:
        "Unable to generate summary. Please check the sentiment data and try again.",
      key_themes: [
        {
          theme: "Analysis Error",
          sentiment: "neutral",
          description: "Could not parse AI response",
        },
      ],
    }
  }
}

