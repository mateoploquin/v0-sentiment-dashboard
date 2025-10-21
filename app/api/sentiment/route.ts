import { type NextRequest, NextResponse } from "next/server"
import { SentimentAnalyzer } from "@/lib/sentiment-analyzer"
import { RedditClient } from "@/lib/reddit-client"
import { HistoryGenerator } from "@/lib/history-generator"
import type { SentimentData, MentionData } from "@/lib/types"

interface RedditPost {
  data: {
    id: string
    title: string
    selftext: string
    author: string
    subreddit: string
    created_utc: number
    permalink: string
    score: number
  }
}

interface RedditResponse {
  data: {
    children: RedditPost[]
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const company = searchParams.get("company") || "Tesla"

    // Initialize clients
    const redditClient = new RedditClient()
    const sentimentAnalyzer = new SentimentAnalyzer()

    // Fetch Reddit posts
    const posts = await redditClient.search(company, { limit: 20, timeframe: "day" })

    if (posts.length === 0) {
      console.log("[v0] No posts found, returning demo data")
      return NextResponse.json(createDemoResponse(company))
    }

    // Analyze sentiment for each post (limit to 10 for performance)
    const postsToAnalyze = posts.slice(0, 10)

    const mentions: MentionData[] = await Promise.all(
      postsToAnalyze.map(async (post) => {
        const text = redditClient.extractText(post)
        const sentiment = await sentimentAnalyzer.analyze(text, company)

        return {
          id: post.data.id,
          text: post.data.title,
          sentiment: sentiment.label,
          score: sentiment.score,
          author: post.data.author,
          subreddit: post.data.subreddit,
          created: new Date(post.data.created_utc * 1000).toISOString(),
          url: redditClient.getPostUrl(post),
        }
      }),
    )

    // Calculate aggregate sentiment
    const sentimentResults = mentions.map((m) => ({ label: m.sentiment, score: m.score }))
    const aggregate = SentimentAnalyzer.calculateAggregate(sentimentResults)

    // Generate historical data
    const history = HistoryGenerator.generate(aggregate.averageScore)

    const response: SentimentData = {
      score: aggregate.averageScore,
      total: mentions.length,
      positive: aggregate.positive,
      neutral: aggregate.neutral,
      negative: aggregate.negative,
      mentions,
      history,
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error("[v0] Error:", error)
    return NextResponse.json(createDemoResponse("Demo Company"), { status: 200 })
  }
}

function createDemoResponse(company: string): SentimentData {
  const demoMentions: MentionData[] = [
    {
      id: "demo1",
      text: `Just bought ${company} products and I'm really impressed with the quality!`,
      sentiment: "positive",
      score: 0.85,
      author: "demo_user_1",
      subreddit: "technology",
      created: new Date(Date.now() - 3600000).toISOString(),
      url: "https://reddit.com/r/technology/demo1",
    },
    {
      id: "demo2",
      text: `${company} announced new features today. Looks interesting but waiting to see reviews.`,
      sentiment: "neutral",
      score: 0.1,
      author: "demo_user_2",
      subreddit: "business",
      created: new Date(Date.now() - 7200000).toISOString(),
      url: "https://reddit.com/r/business/demo2",
    },
    {
      id: "demo3",
      text: `Had some issues with ${company} customer service. Hope they improve.`,
      sentiment: "negative",
      score: -0.6,
      author: "demo_user_3",
      subreddit: "reviews",
      created: new Date(Date.now() - 10800000).toISOString(),
      url: "https://reddit.com/r/reviews/demo3",
    },
    {
      id: "demo4",
      text: `${company} is leading innovation in their industry. Excited for the future!`,
      sentiment: "positive",
      score: 0.9,
      author: "demo_user_4",
      subreddit: "investing",
      created: new Date(Date.now() - 14400000).toISOString(),
      url: "https://reddit.com/r/investing/demo4",
    },
    {
      id: "demo5",
      text: `${company} stock performance has been solid this quarter.`,
      sentiment: "positive",
      score: 0.7,
      author: "demo_user_5",
      subreddit: "stocks",
      created: new Date(Date.now() - 18000000).toISOString(),
      url: "https://reddit.com/r/stocks/demo5",
    },
  ]

  const avgScore = demoMentions.reduce((sum, m) => sum + m.score, 0) / demoMentions.length
  const normalizedScore = avgScore * 100

  return {
    score: normalizedScore,
    total: demoMentions.length,
    positive: demoMentions.filter((m) => m.sentiment === "positive").length,
    neutral: demoMentions.filter((m) => m.sentiment === "neutral").length,
    negative: demoMentions.filter((m) => m.sentiment === "negative").length,
    mentions: demoMentions,
    history: HistoryGenerator.generate(normalizedScore),
  }
}
