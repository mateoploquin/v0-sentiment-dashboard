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
    const topics = await topicGenerator.generateTopics(company, 8) // Increased from 5 to 8 topics

    if (topics.length === 0) {
      console.log("[v0] No topics generated, falling back to company name")
      topics.push(company)
    }

    // STAGE 2: Search Reddit for posts across all topics
    console.log(`[v0] Stage 2: Searching Reddit for ${topics.length} topics...`)
    const allPosts: RedditPost[] = []
    const postsPerTopic = Math.ceil(50 / topics.length) // Increased from 15 to 50 total posts

    for (let i = 0; i < topics.length; i++) {
      const topic = topics[i]

      // Add delay between requests to avoid rate limiting (except for first request)
      if (i > 0) {
        await new Promise(resolve => setTimeout(resolve, 1000)) // 1 second delay
      }

      const posts = await redditClient.search(topic, {
        limit: postsPerTopic,
        timeframe: "week",
        company: company // Pass company name for filtering
      })
      console.log(`[v0] Found ${posts.length} posts for topic: "${topic}"`)
      allPosts.push(...posts)
    }

    // Remove duplicates based on post ID
    const uniquePosts = Array.from(new Map(allPosts.map((post) => [post.data.id, post])).values())
    console.log(`[v0] Total unique posts found: ${uniquePosts.length}`)

    if (uniquePosts.length === 0) {
      console.log("[v0] No posts found")
      return NextResponse.json({
        score: 0,
        total: 0,
        positive: 0,
        neutral: 0,
        negative: 0,
        mentions: [],
        history: [],
      })
    }

    // STAGE 3: Fetch comments from top posts
    console.log("[v0] Stage 3: Fetching comments from posts...")
    const postsToFetch = uniquePosts.slice(0, 15) // Increased from 5 to 15 posts
    const allComments: Array<{
      id: string
      text: string
      author: string
      subreddit: string
      created: string
      url: string
      postTitle: string
    }> = []

    for (let i = 0; i < postsToFetch.length; i++) {
      const post = postsToFetch[i]

      // Add delay between comment fetches to avoid rate limiting (except for first request)
      if (i > 0) {
        await new Promise(resolve => setTimeout(resolve, 500)) // 0.5 second delay
      }

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
    const relevantCommentsRaw = await relevanceFilter.filterRelevant(allComments, company, 20) // Increased batch size from 15 to 20

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
      itemsToAnalyze = uniquePosts.slice(0, 20).map((post) => ({ // Increased from 10 to 20
        id: post.data.id,
        text: redditClient.extractText(post),
        author: post.data.author,
        subreddit: post.data.subreddit,
        created: new Date(post.data.created_utc * 1000).toISOString(),
        url: redditClient.getPostUrl(post),
      }))
    } else {
      // Cast the filtered comments to the correct type
      itemsToAnalyze = relevantCommentsRaw.slice(0, 40).map((comment) => ({ // Increased from 20 to 40
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
          body: item.text, // Store full text for AI summary
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
    return NextResponse.json(
      {
        score: 0,
        total: 0,
        positive: 0,
        neutral: 0,
        negative: 0,
        mentions: [],
        history: [],
        error: "Failed to fetch sentiment data. Please try again.",
      },
      { status: 500 }
    )
  }
}
