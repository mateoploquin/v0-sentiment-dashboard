// Recommendation Engine
// Generates actionable recommendations for addressing negative sentiment topics

import { createOpenAI } from "@ai-sdk/openai"
import { generateText } from "ai"
import type { TopicCluster, ActionableRecommendation } from "./types"

export class RecommendationEngine {
  private model: any
  private temperature: number

  constructor(modelName = "gpt-4o-mini", temperature = 0.6) {
    const openai = createOpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })
    this.model = openai(modelName)
    this.temperature = temperature
  }

  /**
   * Generates actionable recommendations for topic clusters that need attention
   * Focuses on topics with negative sentiment
   */
  async generateRecommendations(
    clusters: TopicCluster[],
    company: string,
  ): Promise<ActionableRecommendation[]> {
    // Filter clusters that should be addressed
    const clustersToAddress = clusters.filter((c) => c.shouldAddress)

    if (clustersToAddress.length === 0) {
      return []
    }

    console.log(
      "[v0] Generating recommendations for",
      clustersToAddress.length,
      "topic clusters",
    )

    try {
      // Generate recommendations for each cluster in parallel
      const recommendations = await Promise.all(
        clustersToAddress.map((cluster) => this.generateRecommendation(cluster, company)),
      )

      // Filter out any null results and sort by priority
      return recommendations
        .filter((r): r is ActionableRecommendation => r !== null)
        .sort((a, b) => {
          const priorityOrder = { high: 0, medium: 1, low: 2 }
          return priorityOrder[a.priority] - priorityOrder[b.priority]
        })
    } catch (error) {
      console.error("[v0] Recommendation generation error:", error)
      return []
    }
  }

  /**
   * Generates a recommendation for a single topic cluster
   */
  private async generateRecommendation(
    cluster: TopicCluster,
    company: string,
  ): Promise<ActionableRecommendation | null> {
    // Get sample negative mentions
    const negativeMentions = cluster.mentions
      .filter((m) => m.sentiment === "negative" || m.score < -10)
      .slice(0, 8)
      .map((m) => `- "${m.text}" (score: ${m.score})`)
      .join("\n")

    const prompt = `You are a social media strategist helping ${company} address customer concerns about "${cluster.topic}".

Topic Description: ${cluster.description}

Customer Sentiment Stats:
- Total mentions: ${cluster.mentionCount}
- Negative: ${cluster.negative} (${Math.round((cluster.negative / cluster.mentionCount) * 100)}%)
- Average sentiment: ${cluster.averageSentiment.toFixed(1)}

Sample negative customer feedback:
${negativeMentions}

Generate 3-4 social media post ideas that ${company} could use to address these concerns publicly. Each post idea should be authentic, transparent, and show the company is listening.

Respond with ONLY a JSON object in this exact format:
{
  "issue": "Brief description of the core issue (1 sentence)",
  "impact": "Why this matters to the business (1 sentence)",
  "postSuggestions": [
    {
      "id": "unique-id-1",
      "title": "Short catchy title for this post idea",
      "description": "What this post will communicate (1 sentence)",
      "angle": "The approach (e.g., 'acknowledge and explain', 'announce improvement', 'share roadmap', 'educate users', 'address misconception')"
    },
    {
      "id": "unique-id-2",
      "title": "Short catchy title for this post idea",
      "description": "What this post will communicate (1 sentence)",
      "angle": "The approach"
    }
  ]
}

Post ideas should:
- Directly address the customer concerns mentioned
- Be authentic and transparent (not defensive)
- Show empathy and understanding
- Provide value (updates, explanations, solutions, education)
- Be appropriate for public social media
- Vary in approach (some acknowledge issues, some educate, some share progress)`

    try {
      const { text: result } = await generateText({
        model: this.model,
        prompt,
        temperature: this.temperature,
      })

      console.log("[v0] Recommendation for", cluster.topic, ":", result)

      const parsed = this.parseRecommendationResponse(result)

      return {
        topic: cluster.topic,
        priority: cluster.priority,
        issue: parsed.issue,
        impact: parsed.impact,
        postSuggestions: parsed.postSuggestions.slice(0, 4), // Limit to 4 suggestions
        affectedMentions: cluster.negative,
      }
    } catch (error) {
      console.error("[v0] Recommendation generation error for", cluster.topic, ":", error)
      return null
    }
  }

  /**
   * Parses the AI response into structured recommendation data
   */
  private parseRecommendationResponse(response: string): {
    issue: string
    impact: string
    postSuggestions: Array<{
      id: string
      title: string
      description: string
      angle: string
    }>
  } {
    // Try to extract JSON from response
    const jsonMatch = response.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error("No JSON found in response")
    }

    const parsed = JSON.parse(jsonMatch[0])

    return {
      issue: parsed.issue || "Issue not identified",
      impact: parsed.impact || "Impact unclear",
      postSuggestions: Array.isArray(parsed.postSuggestions)
        ? parsed.postSuggestions
        : [],
    }
  }

  /**
   * Generates a summary of all recommendations
   */
  async generateExecutiveSummary(
    recommendations: ActionableRecommendation[],
    company: string,
  ): Promise<string> {
    if (recommendations.length === 0) {
      return `No major concerns identified. Customer sentiment about ${company} is generally positive.`
    }

    const highPriority = recommendations.filter((r) => r.priority === "high")
    const mediumPriority = recommendations.filter((r) => r.priority === "medium")

    const prompt = `Summarize the key customer concerns for ${company} based on these priority issues:

High Priority Issues (${highPriority.length}):
${highPriority.map((r) => `- ${r.topic}: ${r.issue}`).join("\n")}

Medium Priority Issues (${mediumPriority.length}):
${mediumPriority.map((r) => `- ${r.topic}: ${r.issue}`).join("\n")}

Write a 2-3 sentence executive summary highlighting the most critical areas to address.`

    try {
      const { text: result } = await generateText({
        model: this.model,
        prompt,
        temperature: 0.5,
      })

      return result.trim()
    } catch (error) {
      console.error("[v0] Executive summary generation error:", error)
      return `${company} has ${recommendations.length} areas requiring attention based on customer feedback.`
    }
  }
}
