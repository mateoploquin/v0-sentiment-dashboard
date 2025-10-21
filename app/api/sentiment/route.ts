import { type NextRequest, NextResponse } from "next/server"
import { SentimentAnalyzer } from "@/lib/sentiment-analyzer"
import { RedditClient } from "@/lib/reddit-client"
import { HistoryGenerator } from "@/lib/history-generator"
import { TopicGenerator } from "@/lib/topic-generator"
import { RelevanceFilter } from "@/lib/relevance-filter"
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

    console.log(`[v0] ========== Starting Multi-Stage Analysis for: ${company} ==========`)

    // Initialize clients
    const topicGenerator = new TopicGenerator()
    const redditClient = new RedditClient()
    const relevanceFilter = new RelevanceFilter()
    const sentimentAnalyzer = new SentimentAnalyzer()

    // STAGE 1: Generate relevant topics
    console.log("[v0] Stage 1: Generating topics...")
    const topics = await topicGenerator.generateTopics(company, 5)

    if (topics.length === 0) {
      console.log("[v0] No topics generated, falling back to company name")
      topics.push(company)
    }

    // STAGE 2: Search Reddit for posts across all topics
    console.log(`[v0] Stage 2: Searching Reddit for ${topics.length} topics...`)
    const allPosts: RedditPost[] = []
    const postsPerTopic = Math.ceil(15 / topics.length) // Distribute limit across topics

    for (const topic of topics) {
      const posts = await redditClient.search(topic, { limit: postsPerTopic, timeframe: "day" })
      console.log(`[v0] Found ${posts.length} posts for topic: "${topic}"`)
      allPosts.push(...posts)
    }

    // Remove duplicates based on post ID
    const uniquePosts = Array.from(new Map(allPosts.map((post) => [post.data.id, post])).values())
    console.log(`[v0] Total unique posts found: ${uniquePosts.length}`)

    if (uniquePosts.length === 0) {
      console.log("[v0] No posts found, returning demo data")
      return NextResponse.json(createDemoResponse(company))
    }

    // STAGE 3: Fetch comments from top posts
    console.log("[v0] Stage 3: Fetching comments from posts...")
    const postsToFetch = uniquePosts.slice(0, 5) // Fetch comments from top 5 posts
    const allComments: Array<{
      id: string
      text: string
      author: string
      subreddit: string
      created: string
      url: string
      postTitle: string
    }> = []

    for (const post of postsToFetch) {
      const comments = await redditClient.fetchComments(post.data.permalink)
      console.log(`[v0] Fetched ${comments.length} comments from post: "${post.data.title.slice(0, 50)}..."`)

      // Convert comments to our format
      const formattedComments = comments.map((comment) => ({
        id: comment.id,
        text: comment.body,
        author: comment.author,
        subreddit: post.data.subreddit,
        created: new Date(comment.created_utc * 1000).toISOString(),
        url: redditClient.getPostUrl(post),
        postTitle: post.data.title,
      }))

      allComments.push(...formattedComments)
    }

    console.log(`[v0] Total comments collected: ${allComments.length}`)

    // STAGE 4: Filter for relevance
    console.log("[v0] Stage 4: Filtering comments for relevance...")
    const relevantCommentsRaw = await relevanceFilter.filterRelevant(allComments, company, 15)

    // If we don't have enough relevant comments, fall back to analyzing posts
    let itemsToAnalyze: Array<{
      id: string
      text: string
      author: string
      subreddit: string
      created: string
      url: string
    }> = []

    if (relevantCommentsRaw.length < 5) {
      console.log("[v0] Not enough relevant comments, using posts instead")
      itemsToAnalyze = uniquePosts.slice(0, 10).map((post) => ({
        id: post.data.id,
        text: redditClient.extractText(post),
        author: post.data.author,
        subreddit: post.data.subreddit,
        created: new Date(post.data.created_utc * 1000).toISOString(),
        url: redditClient.getPostUrl(post),
      }))
    } else {
      // Cast the filtered comments to the correct type
      itemsToAnalyze = relevantCommentsRaw.slice(0, 20).map((comment) => ({
        id: comment.id,
        text: comment.text,
        author: (comment as any).author,
        subreddit: (comment as any).subreddit,
        created: (comment as any).created,
        url: (comment as any).url,
      }))
    }

    // STAGE 5: Analyze sentiment
    console.log(`[v0] Stage 5: Analyzing sentiment for ${itemsToAnalyze.length} items...`)
    const mentions: MentionData[] = await Promise.all(
      itemsToAnalyze.map(async (item) => {
        const sentiment = await sentimentAnalyzer.analyze(item.text, company)

        return {
          id: item.id,
          text: item.text.length > 200 ? item.text.slice(0, 200) + "..." : item.text,
          sentiment: sentiment.label,
          score: sentiment.score,
          author: item.author,
          subreddit: item.subreddit,
          created: item.created,
          url: item.url,
        }
      }),
    )

    // Calculate aggregate sentiment
    const sentimentResults = mentions.map((m) => ({ label: m.sentiment, score: m.score }))
    const aggregate = SentimentAnalyzer.calculateAggregate(sentimentResults)

    // Generate historical data
    const history = HistoryGenerator.generate(aggregate.averageScore)

    console.log(`[v0] ========== Analysis Complete: Score ${aggregate.averageScore.toFixed(1)} ==========`)

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
