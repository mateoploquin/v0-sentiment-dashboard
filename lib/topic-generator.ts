// Topic Generator
// Generates relevant search topics for a company using AI

import { createOpenAI } from "@ai-sdk/openai"
import { generateText } from "ai"

export class TopicGenerator {
  private model: any

  constructor() {
    const openai = createOpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })
    this.model = openai("gpt-4o-mini")
  }

  /**
   * Generates relevant topics to search for about a company
   * Returns an array of search queries that will help find relevant discussions
   */
  async generateTopics(company: string, count: number = 5): Promise<string[]> {
    try {
      console.log(`[v0] Generating topics for: ${company}`)

      const { text: result } = await generateText({
        model: this.model,
        prompt: this.buildPrompt(company, count),
        temperature: 0.7,
      })

      console.log("[v0] Topic generation response:", result)

      const topics = this.parseTopics(result)
      console.log(`[v0] Generated ${topics.length} topics:`, topics)

      return topics
    } catch (error) {
      console.error("[v0] Topic generation error:", error)
      // Fallback to basic company search
      return [company]
    }
  }

  /**
   * Builds the AI prompt for topic generation
   */
  private buildPrompt(company: string, count: number): string {
    return `Generate ${count} relevant search topics/queries to find SENTIMENT and OPINIONS about ${company} on Reddit.

CRITICAL: Each topic MUST include "${company}" in the search string and focus on sentiment-bearing discussions.

Requirements for each topic:
- MUST start with or include "${company}" explicitly
- Focus on areas where people express OPINIONS/EXPERIENCES (reviews, complaints, praise, comparisons)
- Avoid generic news or factual topics
- Target specific products/services/features that people have feelings about

Good examples for Tesla:
["Tesla Model 3 owner experiences", "Tesla Autopilot reviews", "Tesla service center complaints", "Tesla vs other EVs", "Tesla charging issues"]

Bad examples (too generic/factual):
["Tesla news", "Tesla updates", "Tesla stock", "Electric vehicles"]

Respond with ONLY a JSON array of ${count} strings:
["${company} [specific aspect]", "${company} [specific aspect]", ...]

Company: ${company}`
  }

  /**
   * Parses the AI response to extract topics
   */
  private parseTopics(response: string): string[] {
    try {
      // Try to extract JSON array from response
      const jsonMatch = response.match(/\[[\s\S]*\]/)
      if (!jsonMatch) {
        console.error("[v0] No JSON array found in response")
        return []
      }

      const topics = JSON.parse(jsonMatch[0])

      if (!Array.isArray(topics)) {
        console.error("[v0] Parsed result is not an array")
        return []
      }

      // Filter out empty strings and ensure all are strings
      return topics.filter((t) => typeof t === "string" && t.trim().length > 0).map((t) => t.trim())
    } catch (error) {
      console.error("[v0] Error parsing topics:", error)
      return []
    }
  }
}
