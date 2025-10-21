// Shared TypeScript interfaces for the sentiment analysis system

export interface RedditPost {
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

export interface RedditResponse {
  data: {
    children: RedditPost[]
  }
}

export interface SentimentResult {
  label: "positive" | "neutral" | "negative"
  score: number
}

export interface MentionData {
  id: string
  text: string
  body?: string
  sentiment: "positive" | "neutral" | "negative"
  score: number
  author: string
  subreddit: string
  created: string
  url: string
}

export interface SentimentData {
  score: number
  total: number
  positive: number
  neutral: number
  negative: number
  mentions: MentionData[]
  history: Array<{
    timestamp: string
    score: number
  }>
}
