// Relevance Filter
// Filters comments/posts to only include those relevant to the company

import { createOpenAI } from "@ai-sdk/openai"
import { generateText } from "ai"

export interface ContentItem {
  id: string
  text: string
  [key: string]: any
}

export class RelevanceFilter {
  private model: any

  constructor() {
    const openai = createOpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })
    this.model = openai("gpt-4o-mini")
  }

  /**
   * Filters content items to only include those relevant to the company
   * Uses AI to determine relevance based on context
   */
  async filterRelevant(items: ContentItem[], company: string, batchSize: number = 10): Promise<ContentItem[]> {
    if (items.length === 0) return []

    console.log(`[v0] Filtering ${items.length} items for relevance to: ${company}`)

    // STEP 1: Quick pre-filter to remove obvious non-sentiment content
    const preFiltered = items.filter((item) => !this.isObviouslyIrrelevant(item.text, company))
    console.log(`[v0] Pre-filter: ${preFiltered.length} items remaining after removing obvious non-sentiment content`)

    if (preFiltered.length === 0) {
      console.log(`[v0] No items passed pre-filter`)
      return []
    }

    // STEP 2: AI-based filtering for nuanced relevance
    const relevant: ContentItem[] = []

    // Process in batches to avoid token limits
    for (let i = 0; i < preFiltered.length; i += batchSize) {
      const batch = preFiltered.slice(i, i + batchSize)
      const batchResults = await this.filterBatch(batch, company)
      relevant.push(...batchResults)
    }

    console.log(`[v0] AI filter: Found ${relevant.length} sentiment-bearing items out of ${items.length} total`)

    return relevant
  }

  /**
   * Quick keyword-based filter to eliminate obvious non-sentiment content
   * Returns true if the item is obviously irrelevant (should be filtered out)
   */
  private isObviouslyIrrelevant(text: string, company: string): boolean {
    const lowerText = text.toLowerCase()
    const lowerCompany = company.toLowerCase()

    // MUST have sentiment words to proceed - this is critical
    const hasSentimentWords = this.hasSentimentIndicators(lowerText)
    if (!hasSentimentWords) {
      return true // No sentiment = irrelevant
    }

    // Must mention the company (strict check)
    if (!lowerText.includes(lowerCompany)) {
      // Allow some flexibility for common abbreviations
      const companyWords = lowerCompany.split(/\s+/)
      const hasAnyCompanyWord = companyWords.some((word) => word.length > 3 && lowerText.includes(word))
      if (!hasAnyCompanyWord) {
        return true // Doesn't mention company at all
      }
    }

    // Job posting indicators (STRICT)
    const jobKeywords = [
      "hiring",
      "we're hiring",
      "we are hiring",
      "now hiring",
      "job opening",
      "position available",
      "apply now",
      "send resume",
      "send cv",
      "looking for candidates",
      "join our team",
      "careers at",
      "job posting",
      "employment opportunity",
      "work with us",
      "[hiring]",
      "remote position",
      "full-time position",
      "part-time position",
      "salary range",
      "years of experience",
      "apply here",
      "application deadline",
      "job description",
      "responsibilities include",
      "qualifications:",
      "requirements:",
      "benefits:",
      "competitive salary",
      "equal opportunity",
    ]

    if (jobKeywords.some((keyword) => lowerText.includes(keyword))) {
      return true
    }

    // News/factual without opinion indicators
    const newsPatterns = [
      /^(breaking|update|news):/i,
      /^just announced/i,
      /has announced that/i,
      /according to reports/i,
      /sources say/i,
    ]

    if (newsPatterns.some((pattern) => pattern.test(text.trim()))) {
      // Only allow if it has strong sentiment
      const strongSentiment = this.hasStrongSentimentIndicators(lowerText)
      if (!strongSentiment) {
        return true
      }
    }

    // Technical support without sentiment
    const techSupportPatterns = [
      /^how (do i|to|can i)/,
      /^can someone help/,
      /^need help with/,
      /^anyone know how/,
      /^does anyone know/,
      /^is there a way to/,
      /^what('s| is) the best way to/,
      /^looking for (a|an|the)/,
      /^where (can i|do i)/,
    ]

    if (techSupportPatterns.some((pattern) => pattern.test(lowerText))) {
      return true // Always filter tech support
    }

    // Pure spam/promotional indicators
    const spamKeywords = [
      "click here",
      "buy now",
      "limited time offer",
      "act now",
      "visit our website",
      "check out our",
      "dm for details",
      "link in bio",
      "subscribe to",
      "follow us",
      "follow me",
      "check my profile",
    ]

    if (spamKeywords.some((keyword) => lowerText.includes(keyword))) {
      return true
    }

    // Generic discussion starters without sentiment
    const genericPatterns = [
      /^(what|which) (do you|would you)/,
      /^thoughts on/,
      /^opinions on/,
      /^what (are|is) (your|everyone's)/,
    ]

    if (genericPatterns.some((pattern) => pattern.test(lowerText))) {
      const strongSentiment = this.hasStrongSentimentIndicators(lowerText)
      if (!strongSentiment) {
        return true
      }
    }

    // Very short posts (even with sentiment words, too short to be meaningful)
    if (text.trim().length < 30) {
      return true
    }

    return false
  }

  /**
   * Checks if text contains sentiment indicators
   */
  private hasSentimentIndicators(lowerText: string): boolean {
    const sentimentWords = [
      // Positive
      "love",
      "great",
      "awesome",
      "amazing",
      "excellent",
      "fantastic",
      "wonderful",
      "good",
      "best",
      "happy",
      "satisfied",
      "recommend",
      "impressed",
      "perfect",
      "outstanding",
      "brilliant",
      "superb",
      // Negative
      "hate",
      "terrible",
      "awful",
      "horrible",
      "worst",
      "bad",
      "disappointed",
      "frustrat",
      "annoying",
      "poor",
      "sucks",
      "waste",
      "regret",
      "avoid",
      "pathetic",
      "useless",
      "garbage",
      // Neutral/descriptive sentiment
      "experience",
      "opinion",
      "think",
      "feel",
      "seems",
      "compared to",
      "better than",
      "worse than",
      "not as good",
      "review",
      "rating",
      "prefer",
      "disappoint",
      "concern",
    ]

    return sentimentWords.some((word) => lowerText.includes(word))
  }

  /**
   * Checks if text contains STRONG sentiment indicators (for stricter filtering)
   */
  private hasStrongSentimentIndicators(lowerText: string): boolean {
    const strongSentimentWords = [
      // Strong positive
      "love",
      "amazing",
      "excellent",
      "fantastic",
      "wonderful",
      "best",
      "impressed",
      "perfect",
      "outstanding",
      "brilliant",
      "superb",
      "highly recommend",
      // Strong negative
      "hate",
      "terrible",
      "awful",
      "horrible",
      "worst",
      "disappointed",
      "frustrat",
      "sucks",
      "waste",
      "regret",
      "avoid",
      "pathetic",
      "useless",
      "garbage",
    ]

    return strongSentimentWords.some((word) => lowerText.includes(word))
  }

  /**
   * Filters a batch of items
   */
  private async filterBatch(items: ContentItem[], company: string): Promise<ContentItem[]> {
    try {
      const { text: result } = await generateText({
        model: this.model,
        prompt: this.buildPrompt(items, company),
        temperature: 0.3,
      })

      const relevantIds = this.parseRelevantIds(result)

      // Return only the items that were marked as relevant
      return items.filter((item) => relevantIds.includes(item.id))
    } catch (error) {
      console.error("[v0] Relevance filtering error:", error)
      // On error, return all items to avoid losing data
      return items
    }
  }

  /**
   * Builds the AI prompt for relevance filtering
   */
  private buildPrompt(items: ContentItem[], company: string): string {
    const itemsList = items
      .map((item, index) => {
        const text = item.text.slice(0, 300) // Limit text length
        return `ID: ${item.id}\nText: ${text}\n`
      })
      .join("\n")

    return `You are a STRICT filter for sentiment analysis about "${company}". Your job is to REJECT 80%+ of content.

ONLY mark as RELEVANT if the comment/post contains ACTUAL PERSONAL SENTIMENT/OPINION/EXPERIENCE about ${company}:
✓ "I love my ${company} product, it works great"
✓ "Terrible experience with ${company} customer service"
✓ "${company} is way better than competitors, highly recommend"
✓ "Been using ${company} for years, pretty happy with it"
✓ "Disappointed by ${company}'s new update, buggy"

REJECT everything else (90% of content should be rejected):
✗ Job postings: "We're hiring at ${company}" "Join our ${company} team"
✗ Questions without opinion: "What do you think about ${company}?" "Anyone tried ${company}?"
✗ Tech support: "How do I use ${company}?" "Need help with ${company}"
✗ News/facts without opinion: "${company} announced..." "${company} stock is up"
✗ Generic mentions: "I work at ${company}" "Saw a ${company} ad"
✗ Passing references: "Unlike ${company}, this product..." (if not comparing sentiment)
✗ Promotional: "Check out ${company}" "Visit ${company}.com"
✗ Factual discussions: "${company} has this feature" (unless comparing/opining)

CRITICAL RULES:
1. Must express PERSONAL sentiment/experience about ${company}
2. Must use sentiment words (love, hate, good, bad, disappointed, happy, recommend, avoid, etc.)
3. If it's a question, news, or factual statement = REJECT
4. If unsure = REJECT (we want ONLY obvious sentiment)

Review these items and return ONLY the IDs that express CLEAR PERSONAL SENTIMENT:

Items:
${itemsList}

Respond with ONLY a JSON array of relevant IDs (expect this to be EMPTY or very small):
["id1", "id2"]

If none express clear sentiment, return: []`
  }

  /**
   * Parses the AI response to extract relevant IDs
   */
  private parseRelevantIds(response: string): string[] {
    try {
      const jsonMatch = response.match(/\[[\s\S]*?\]/)
      if (!jsonMatch) {
        console.error("[v0] No JSON array found in relevance filter response")
        return []
      }

      const ids = JSON.parse(jsonMatch[0])

      if (!Array.isArray(ids)) {
        console.error("[v0] Parsed result is not an array")
        return []
      }

      return ids.filter((id) => typeof id === "string")
    } catch (error) {
      console.error("[v0] Error parsing relevant IDs:", error)
      return []
    }
  }

  /**
   * Quick relevance check using simple keyword matching (fallback)
   * Returns true if the text contains the company name
   */
  static quickCheck(text: string, company: string): boolean {
    const normalizedText = text.toLowerCase()
    const normalizedCompany = company.toLowerCase()

    // Check for exact match or word boundary match
    const regex = new RegExp(`\\b${normalizedCompany}\\b`, "i")
    return regex.test(text)
  }
}
