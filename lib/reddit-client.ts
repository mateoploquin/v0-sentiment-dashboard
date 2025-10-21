// Reddit API Client
// Handles fetching and processing Reddit data

import type { RedditPost, RedditResponse } from "./types"

export class RedditClient {
  private userAgent: string

  constructor(
    userAgent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  ) {
    this.userAgent = userAgent
  }

  /**
   * Searches Reddit for posts about a specific query
   */
  async search(query: string, options: { limit?: number; timeframe?: string } = {}): Promise<RedditPost[]> {
    const { limit = 20, timeframe = "day" } = options

    try {
      console.log("[v0] Fetching Reddit posts for:", query)

      const url = `https://www.reddit.com/search.json?q=${encodeURIComponent(query)}&sort=new&limit=${limit}&t=${timeframe}`

      const response = await fetch(url, {
        headers: {
          "User-Agent": this.userAgent,
          Accept: "application/json, text/plain, */*",
          "Accept-Language": "en-US,en;q=0.9",
          "Accept-Encoding": "gzip, deflate, br",
          Referer: "https://www.reddit.com/",
        },
      })

      if (!response.ok) {
        console.log("[v0] Reddit API returned status:", response.status)
        return []
      }

      // Check if response is actually JSON
      const contentType = response.headers.get("content-type")
      if (!contentType || !contentType.includes("application/json")) {
        console.log("[v0] Reddit API returned non-JSON response (likely blocked)")
        return []
      }

      const data: RedditResponse = await response.json()

      // Validate the response structure
      if (!data || !data.data || !Array.isArray(data.data.children)) {
        console.log("[v0] Invalid Reddit API response structure")
        return []
      }

      const posts = data.data.children

      console.log("[v0] Found posts:", posts.length)

      return posts
    } catch (error) {
      console.error("[v0] Reddit fetch error:", error)
      return []
    }
  }

  /**
   * Extracts text content from a Reddit post
   */
  extractText(post: RedditPost): string {
    return `${post.data.title} ${post.data.selftext}`.trim()
  }

  /**
   * Converts a Reddit post to a URL
   */
  getPostUrl(post: RedditPost): string {
    return `https://reddit.com${post.data.permalink}`
  }

  /**
   * Filters posts by minimum score
   */
  filterByScore(posts: RedditPost[], minScore = 0): RedditPost[] {
    return posts.filter((post) => post.data.score >= minScore)
  }

  /**
   * Filters posts by subreddit
   */
  filterBySubreddit(posts: RedditPost[], subreddits: string[]): RedditPost[] {
    const subredditSet = new Set(subreddits.map((s) => s.toLowerCase()))
    return posts.filter((post) => subredditSet.has(post.data.subreddit.toLowerCase()))
  }

  /**
   * Fetches comments from a Reddit post
   */
  async fetchComments(permalink: string): Promise<any[]> {
    try {
      const url = `https://www.reddit.com${permalink}.json`

      const response = await fetch(url, {
        headers: {
          "User-Agent": this.userAgent,
          Accept: "application/json, text/plain, */*",
          "Accept-Language": "en-US,en;q=0.9",
          "Accept-Encoding": "gzip, deflate, br",
          Referer: "https://www.reddit.com/",
        },
      })

      if (!response.ok) {
        return []
      }

      const contentType = response.headers.get("content-type")
      if (!contentType || !contentType.includes("application/json")) {
        return []
      }

      const data = await response.json()

      // Reddit returns an array: [post_data, comments_data]
      if (!Array.isArray(data) || data.length < 2) {
        return []
      }

      const commentsData = data[1]
      if (!commentsData?.data?.children) {
        return []
      }

      // Extract all comments (flatten nested replies)
      const comments = this.flattenComments(commentsData.data.children)

      return comments
    } catch (error) {
      console.error("[v0] Error fetching comments:", error)
      return []
    }
  }

  /**
   * Flattens nested comment structure into a single array
   */
  private flattenComments(children: any[]): any[] {
    const comments: any[] = []

    for (const child of children) {
      if (child.kind === "t1" && child.data?.body) {
        // This is a comment
        comments.push({
          id: child.data.id,
          body: child.data.body,
          author: child.data.author,
          score: child.data.score,
          created_utc: child.data.created_utc,
        })

        // Recursively get replies
        if (child.data.replies?.data?.children) {
          comments.push(...this.flattenComments(child.data.replies.data.children))
        }
      }
    }

    return comments
  }

  /**
   * Searches for posts across multiple topics
   */
  async searchMultipleTopics(
    topics: string[],
    options: { limit?: number; timeframe?: string } = {},
  ): Promise<Map<string, RedditPost[]>> {
    const results = new Map<string, RedditPost[]>()

    for (const topic of topics) {
      const posts = await this.search(topic, options)
      if (posts.length > 0) {
        results.set(topic, posts)
      }
    }

    return results
  }
}
