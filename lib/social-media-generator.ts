// Social Media Content Generator
// Creates platform-specific content ready to post

import { createOpenAI } from "@ai-sdk/openai"
import { generateText } from "ai"
import type { SocialMediaPost } from "./types"

interface ContentRequest {
  company: string
  topic: string
  postIdea: {
    title: string
    description: string
    angle: string
  }
  platform: "twitter" | "linkedin" | "facebook" | "instagram"
}

export class SocialMediaGenerator {
  private model: any
  private temperature: number

  // Platform-specific constraints
  private readonly platformLimits = {
    twitter: { maxChars: 280, style: "concise and punchy", hashtags: 2 },
    linkedin: { maxChars: 3000, style: "professional and detailed", hashtags: 5 },
    facebook: { maxChars: 63206, style: "conversational and engaging", hashtags: 3 },
    instagram: { maxChars: 2200, style: "visual and story-driven", hashtags: 10 },
  }

  constructor(modelName = "gpt-4o-mini", temperature = 0.7) {
    const openai = createOpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })
    this.model = openai(modelName)
    this.temperature = temperature
  }

  /**
   * Generates platform-specific social media content
   */
  async generateContent(request: ContentRequest): Promise<SocialMediaPost> {
    const platformConfig = this.platformLimits[request.platform]

    try {
      const content = await this.generatePlatformContent(
        request.company,
        request.topic,
        request.postIdea,
        request.platform,
        platformConfig,
      )

      console.log("[v0] Generated", request.platform, "post:", content.substring(0, 100))

      return {
        platform: request.platform,
        content: content,
        hashtags: this.extractHashtags(content),
        characterCount: content.length,
        mediaRecommendation: await this.suggestMedia(request.platform, request.postIdea),
      }
    } catch (error) {
      console.error("[v0] Social media generation error:", error)
      throw error
    }
  }

  /**
   * Generates content tailored to the platform
   */
  private async generatePlatformContent(
    company: string,
    topic: string,
    postIdea: { title: string; description: string; angle: string },
    platform: string,
    config: { maxChars: number; style: string; hashtags: number },
  ): Promise<string> {
    const prompt = this.buildPlatformPrompt(
      company,
      topic,
      postIdea,
      platform,
      config,
    )

    const { text: result } = await generateText({
      model: this.model,
      prompt,
      temperature: this.temperature,
    })

    // Extract the actual content (remove any JSON wrapping or quotes)
    let content = result.trim()

    // Try to extract from JSON if wrapped
    const jsonMatch = content.match(/\{[\s\S]*"content"\s*:\s*"([\s\S]*?)"\s*[,}]/)
    if (jsonMatch) {
      content = jsonMatch[1]
    }

    // Remove surrounding quotes if present
    content = content.replace(/^["']|["']$/g, "")

    // Unescape newlines and quotes
    content = content.replace(/\\n/g, "\n").replace(/\\"/g, '"')

    return content
  }

  /**
   * Builds a platform-specific prompt
   */
  private buildPlatformPrompt(
    company: string,
    topic: string,
    postIdea: { title: string; description: string; angle: string },
    platform: string,
    config: { maxChars: number; style: string; hashtags: number },
  ): string {
    const platformGuidelines: Record<string, string> = {
      twitter: `
- Use short, punchy sentences
- Start strong with a hook
- Use line breaks for readability
- Include 1-2 relevant hashtags naturally
- Use emojis sparingly (1-2 max)
- Keep it under 280 characters
- Make it tweetable and shareable`,

      linkedin: `
- Start with a compelling hook or question
- Use professional but conversational tone
- Structure with short paragraphs (2-3 sentences each)
- Include personal insights or company perspective
- End with a question or call-to-action
- Use 3-5 relevant hashtags at the end
- Aim for 150-300 words for optimal engagement`,

      facebook: `
- Start with an engaging opening line
- Use friendly, conversational tone
- Include context and storytelling
- Use emojis to add personality (3-5)
- Break into short paragraphs
- End with engagement prompt (question, CTA)
- Include 2-3 hashtags if relevant`,

      instagram: `
- Lead with an attention-grabbing first line (shows in preview)
- Tell a story or share a behind-the-scenes perspective
- Use emojis throughout for visual appeal
- Break into short, readable chunks with line breaks
- End with strong call-to-action
- Include 5-10 relevant hashtags at the bottom
- Consider this accompanies an image/video`,
    }

    return `You are writing a ${platform} post for ${company} about "${topic}".

Post Concept: ${postIdea.title}
Goal: ${postIdea.description}
Approach: ${postIdea.angle}

Platform: ${platform}
Style: ${config.style}
Character limit: ${config.maxChars}

${platformGuidelines[platform]}

IMPORTANT RULES:
1. Write as if you ARE ${company} (use "we", not "they")
2. Be authentic and transparent - acknowledge issues honestly
3. Show empathy and understanding for customer concerns
4. Provide value (information, updates, solutions, or insights)
5. Match the tone of how ${company} typically communicates
6. Do NOT be defensive or make excuses
7. Keep within character limits for ${platform}
8. Make it ready to post immediately (no editing needed)

Write ONLY the post content (no explanations, no quotes around it, no "Here's the post:" preamble).`
  }

  /**
   * Extracts hashtags from content
   */
  private extractHashtags(content: string): string[] {
    const hashtagRegex = /#[\w]+/g
    const matches = content.match(hashtagRegex)
    return matches ? matches : []
  }

  /**
   * Suggests media type for the post
   */
  private async suggestMedia(
    platform: string,
    postIdea: { title: string; angle: string },
  ): Promise<string> {
    const suggestions: Record<string, string> = {
      twitter: "Consider adding: An infographic, chart, or branded image",
      linkedin: "Consider adding: A professional photo, chart, or document preview",
      facebook: "Consider adding: A photo, video, or link preview",
      instagram: "REQUIRED: High-quality photo or video (this is a visual platform)",
    }

    // Customize based on the post angle
    if (postIdea.angle.includes("data") || postIdea.angle.includes("stats")) {
      return "📊 Consider adding: A chart or infographic visualizing the data"
    } else if (postIdea.angle.includes("behind") || postIdea.angle.includes("team")) {
      return "📸 Consider adding: A behind-the-scenes photo or team photo"
    } else if (postIdea.angle.includes("product") || postIdea.angle.includes("feature")) {
      return "🎥 Consider adding: A product demo video or feature screenshot"
    }

    return suggestions[platform] || "Consider adding relevant visual content"
  }

  /**
   * Generates multiple platform variations at once
   */
  async generateAllPlatforms(
    company: string,
    topic: string,
    postIdea: {
      title: string
      description: string
      angle: string
    },
  ): Promise<SocialMediaPost[]> {
    const platforms: Array<"twitter" | "linkedin" | "facebook" | "instagram"> = [
      "twitter",
      "linkedin",
      "facebook",
      "instagram",
    ]

    const posts = await Promise.all(
      platforms.map((platform) =>
        this.generateContent({
          company,
          topic,
          postIdea,
          platform,
        }),
      ),
    )

    return posts
  }
}
