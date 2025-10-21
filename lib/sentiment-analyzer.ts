// Sentiment Analysis Engine
// Analyzes text sentiment using AI with fallback mechanisms

import { createOpenAI } from "@ai-sdk/openai"
import { generateText } from "ai"
import type { SentimentResult } from "./types"

export class SentimentAnalyzer {
  private model: any
  private temperature: number

  constructor(modelName = "gpt-4o-mini", temperature = 0.3) {
    const openai = createOpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })
    this.model = openai(modelName)
    this.temperature = temperature
  }

  /**
   * Analyzes the sentiment of text about a specific company
   * Returns sentiment label and score (-100 to 100)
   */
  async analyze(text: string, company: string): Promise<SentimentResult> {
    try {
      const { text: result } = await generateText({
        model: this.model,
        prompt: this.buildPrompt(text, company),
        temperature: this.temperature,
      })

      console.log("[v0] AI sentiment response:", result)

      const parsed = this.parseResponse(result)
      return this.validateResult(parsed)
    } catch (error) {
      console.error("[v0] Sentiment analysis error:", error)
      return this.getFallbackSentiment()
    }
  }

  /**
   * Analyzes multiple texts in batch
   * More efficient for processing many items
   */
  async analyzeBatch(
    texts: Array<{ text: string; id: string }>,
    company: string,
  ): Promise<Map<string, SentimentResult>> {
    const results = new Map<string, SentimentResult>()

    // Process in parallel with concurrency limit
    const batchSize = 5
    for (let i = 0; i < texts.length; i += batchSize) {
      const batch = texts.slice(i, i + batchSize)
      const batchResults = await Promise.all(
        batch.map(async (item) => ({
          id: item.id,
          result: await this.analyze(item.text, company),
        })),
      )

      batchResults.forEach(({ id, result }) => {
        results.set(id, result)
      })
    }

    return results
  }

  /**
   * Builds the AI prompt for sentiment analysis
   */
  private buildPrompt(text: string, company: string): string {
    return `Analyze the sentiment of this text about ${company}. 

Consider:
- Overall tone (positive, negative, neutral)
- Specific mentions of the company
- Context and nuance
- Sarcasm or irony

Respond with ONLY a JSON object in this exact format:
{"sentiment": "positive" | "neutral" | "negative", "score": number between -100 and 100}

Where score represents:
- 100 to 50: Very positive
- 49 to 10: Somewhat positive
- 9 to -9: Neutral
- -10 to -49: Somewhat negative
- -50 to -100: Very negative

Text: ${text.slice(0, 500)}`
  }

  /**
   * Parses the AI response into structured data
   */
  private parseResponse(response: string): { sentiment: string; score: number } {
    // Try to extract JSON from response
    const jsonMatch = response.match(/\{[^}]+\}/)
    if (!jsonMatch) {
      throw new Error("No JSON found in response")
    }

    return JSON.parse(jsonMatch[0])
  }

  /**
   * Validates and normalizes the sentiment result
   */
  private validateResult(parsed: { sentiment: string; score: number }): SentimentResult {
    const validSentiments = ["positive", "neutral", "negative"]
    const sentiment = validSentiments.includes(parsed.sentiment)
      ? (parsed.sentiment as "positive" | "neutral" | "negative")
      : "neutral"

    const score = Math.max(-100, Math.min(100, parsed.score || 0))

    return { label: sentiment, score }
  }

  /**
   * Returns a neutral sentiment as fallback
   */
  private getFallbackSentiment(): SentimentResult {
    return { label: "neutral", score: 0 }
  }

  /**
   * Calculates aggregate sentiment from multiple results
   */
  static calculateAggregate(results: SentimentResult[]): {
    averageScore: number
    positive: number
    neutral: number
    negative: number
  } {
    if (results.length === 0) {
      return { averageScore: 0, positive: 0, neutral: 0, negative: 0 }
    }

    const averageScore = results.reduce((sum, r) => sum + r.score, 0) / results.length

    const positive = results.filter((r) => r.label === "positive").length
    const neutral = results.filter((r) => r.label === "neutral").length
    const negative = results.filter((r) => r.label === "negative").length

    return { averageScore, positive, neutral, negative }
  }
}
