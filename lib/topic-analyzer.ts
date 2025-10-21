// Topic Clustering and Analysis Engine
// Groups mentions into topics and identifies patterns

import { createOpenAI } from "@ai-sdk/openai"
import { generateText } from "ai"
import type { MentionData, TopicCluster } from "./types"

export class TopicAnalyzer {
  private model: any
  private temperature: number

  constructor(modelName = "gpt-4o-mini", temperature = 0.5) {
    const openai = createOpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })
    this.model = openai(modelName)
    this.temperature = temperature
  }

  /**
   * Analyzes mentions and groups them into topic clusters
   * Returns clusters with sentiment analysis per topic
   */
  async clusterByTopics(
    mentions: MentionData[],
    company: string,
  ): Promise<TopicCluster[]> {
    if (mentions.length === 0) {
      return []
    }

    try {
      // Step 1: Use AI to identify topics from mentions
      const topics = await this.identifyTopics(mentions, company)

      // Step 2: Assign mentions to topics
      const clusters = await this.assignMentionsToTopics(mentions, topics, company)

      // Step 3: Analyze each cluster
      const analyzedClusters = this.analyzeClusters(clusters)

      console.log("[v0] Topic clustering complete:", analyzedClusters.length, "clusters")
      return analyzedClusters
    } catch (error) {
      console.error("[v0] Topic clustering error:", error)
      return []
    }
  }

  /**
   * Identifies main topics from the mentions using AI
   */
  private async identifyTopics(
    mentions: MentionData[],
    company: string,
  ): Promise<string[]> {
    const sampleTexts = mentions
      .slice(0, 30)
      .map((m) => m.text)
      .join("\n---\n")

    const prompt = `Analyze these customer mentions about ${company} and identify 5-8 main topics or themes that people are discussing.

Focus on:
- Product features or specific products
- Service quality issues
- Pricing or value concerns
- Customer experience aspects
- Technical problems
- Comparison to competitors
- Company policies or decisions

Customer mentions:
${sampleTexts}

Respond with ONLY a JSON array of topic names (strings), like:
["Battery Life", "Customer Service", "Pricing", "Autopilot Features", "Build Quality"]`

    try {
      const { text: result } = await generateText({
        model: this.model,
        prompt,
        temperature: this.temperature,
      })

      console.log("[v0] Topic identification response:", result)

      const jsonMatch = result.match(/\[[\s\S]*\]/)
      if (!jsonMatch) {
        throw new Error("No JSON array found in response")
      }

      const topics = JSON.parse(jsonMatch[0]) as string[]
      return topics.slice(0, 8) // Limit to 8 topics max
    } catch (error) {
      console.error("[v0] Topic identification error:", error)
      return ["General Feedback"] // Fallback to single topic
    }
  }

  /**
   * Assigns each mention to the most relevant topic using AI
   */
  private async assignMentionsToTopics(
    mentions: MentionData[],
    topics: string[],
    company: string,
  ): Promise<Map<string, { description: string; mentions: MentionData[] }>> {
    const clusters = new Map<string, { description: string; mentions: MentionData[] }>()

    // Initialize clusters
    topics.forEach((topic) => {
      clusters.set(topic, { description: "", mentions: [] })
    })

    // Process mentions in batches
    const batchSize = 10
    for (let i = 0; i < mentions.length; i += batchSize) {
      const batch = mentions.slice(i, i + batchSize)

      await Promise.all(
        batch.map(async (mention) => {
          const assignedTopic = await this.assignMentionToTopic(mention, topics, company)
          const cluster = clusters.get(assignedTopic)
          if (cluster) {
            cluster.mentions.push(mention)
          }
        }),
      )
    }

    // Generate descriptions for each cluster
    for (const [topic, cluster] of clusters.entries()) {
      if (cluster.mentions.length > 0) {
        cluster.description = await this.generateTopicDescription(
          topic,
          cluster.mentions,
          company,
        )
      }
    }

    // Remove empty clusters
    const nonEmptyClusters = new Map<string, { description: string; mentions: MentionData[] }>()
    clusters.forEach((cluster, topic) => {
      if (cluster.mentions.length > 0) {
        nonEmptyClusters.set(topic, cluster)
      }
    })

    return nonEmptyClusters
  }

  /**
   * Assigns a single mention to the most relevant topic
   */
  private async assignMentionToTopic(
    mention: MentionData,
    topics: string[],
    company: string,
  ): Promise<string> {
    const prompt = `Given this customer mention about ${company}, which topic does it most closely relate to?

Topics:
${topics.map((t, i) => `${i + 1}. ${t}`).join("\n")}

Mention: "${mention.text}"

Respond with ONLY the topic name exactly as listed above (no number, no explanation).`

    try {
      const { text: result } = await generateText({
        model: this.model,
        prompt,
        temperature: 0.3,
      })

      const assignedTopic = result.trim().replace(/^["']|["']$/g, "")

      // Find closest match
      const match = topics.find((t) => assignedTopic.toLowerCase().includes(t.toLowerCase()))
      return match || topics[0]
    } catch (error) {
      console.error("[v0] Mention assignment error:", error)
      return topics[0] // Fallback to first topic
    }
  }

  /**
   * Generates a description for a topic cluster
   */
  private async generateTopicDescription(
    topic: string,
    mentions: MentionData[],
    company: string,
  ): Promise<string> {
    const sampleMentions = mentions
      .slice(0, 5)
      .map((m) => m.text)
      .join("\n- ")

    const prompt = `Summarize in ONE brief sentence what customers are saying about ${company}'s ${topic}.

Sample mentions:
- ${sampleMentions}

Respond with ONLY the summary sentence (no quotes, no preamble).`

    try {
      const { text: result } = await generateText({
        model: this.model,
        prompt,
        temperature: 0.4,
      })

      return result.trim().replace(/^["']|["']$/g, "")
    } catch (error) {
      console.error("[v0] Description generation error:", error)
      return `Customer feedback about ${topic}`
    }
  }

  /**
   * Analyzes each cluster and determines if it should be addressed
   */
  private analyzeClusters(
    clusters: Map<string, { description: string; mentions: MentionData[] }>,
  ): TopicCluster[] {
    const analyzed: TopicCluster[] = []

    clusters.forEach((cluster, topic) => {
      const { mentions, description } = cluster

      // Calculate sentiment stats
      const positive = mentions.filter((m) => m.sentiment === "positive").length
      const neutral = mentions.filter((m) => m.sentiment === "neutral").length
      const negative = mentions.filter((m) => m.sentiment === "negative").length

      const averageSentiment =
        mentions.reduce((sum, m) => sum + m.score, 0) / mentions.length

      // Determine if this topic should be addressed
      const negativePercentage = (negative / mentions.length) * 100
      const shouldAddress = negativePercentage >= 40 || (negative >= 3 && averageSentiment < -10)

      // Determine priority
      let priority: "high" | "medium" | "low" = "low"
      if (shouldAddress) {
        if (negativePercentage >= 60 || averageSentiment <= -30) {
          priority = "high"
        } else if (negativePercentage >= 50 || averageSentiment <= -20) {
          priority = "medium"
        } else {
          priority = "medium"
        }
      }

      analyzed.push({
        topic,
        description,
        mentionCount: mentions.length,
        averageSentiment,
        positive,
        neutral,
        negative,
        mentions,
        shouldAddress,
        priority,
      })
    })

    // Sort by priority (high first) and then by mention count
    return analyzed.sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 }
      const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority]
      if (priorityDiff !== 0) return priorityDiff
      return b.mentionCount - a.mentionCount
    })
  }
}
