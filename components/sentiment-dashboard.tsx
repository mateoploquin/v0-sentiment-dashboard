"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { SentimentGauge } from "@/components/sentiment-gauge"
import { MentionsList } from "@/components/mentions-list"
import { SentimentChart } from "@/components/sentiment-chart"
import { AiInsights } from "@/components/ai-insights"
import { Search, TrendingUp, MessageSquare, Activity, RefreshCw, Clock, History } from "lucide-react"
import useSWR from "swr"
import { LocalStorage, type SearchHistoryItem } from "@/lib/storage"

interface SentimentData {
  score: number
  total: number
  positive: number
  neutral: number
  negative: number
  mentions: Array<{
    id: string
    text: string
    body?: string
    sentiment: "positive" | "neutral" | "negative"
    score: number
    author: string
    subreddit: string
    created: string
    url: string
  }>
  history: Array<{
    timestamp: string
    score: number
  }>
}

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export function SentimentDashboard() {
  const [company, setCompany] = useState("Tesla")
  const [searchInput, setSearchInput] = useState("Tesla")
  const [searchHistory, setSearchHistory] = useState<SearchHistoryItem[]>([])
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [showHistory, setShowHistory] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const { data, error, isLoading, mutate } = useSWR<SentimentData>(
    `/api/sentiment?company=${encodeURIComponent(company)}`,
    fetcher,
    {
      revalidateOnFocus: false, // Disabled for testing to avoid Reddit rate limits
      onSuccess: () => {
        setLastUpdated(new Date())
      },
    },
  )

  useEffect(() => {
    setSearchHistory(LocalStorage.getSearchHistory())
  }, [])

  useEffect(() => {
    if (data && !isLoading) {
      LocalStorage.addToHistory({
        company,
        timestamp: new Date().toISOString(),
        score: data.score,
      })
      setSearchHistory(LocalStorage.getSearchHistory())
    }
  }, [data, company, isLoading])

  const handleSearch = () => {
    if (searchInput.trim()) {
      setCompany(searchInput.trim())
      setShowHistory(false)
    }
  }

  const handleRefresh = () => {
    mutate()
  }

  const handleHistorySelect = (item: SearchHistoryItem) => {
    setSearchInput(item.company)
    setCompany(item.company)
    setShowHistory(false)
  }

  const handleClearHistory = () => {
    LocalStorage.clearHistory()
    setSearchHistory([])
  }

  const formatLastUpdated = () => {
    if (!mounted || !lastUpdated) return "Never"
    const seconds = Math.floor((Date.now() - lastUpdated.getTime()) / 1000)
    if (seconds < 60) return `${seconds}s ago`
    const minutes = Math.floor(seconds / 60)
    if (minutes < 60) return `${minutes}m ago`
    const hours = Math.floor(minutes / 60)
    return `${hours}h ago`
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch()
    }
  }

  return (
    <div className="min-h-screen gradient-mesh dark:gradient-mesh-dark">
      {/* Header */}
      <header className="glass-header dark:glass-header-dark sticky top-0 z-50 backdrop-blur-xl">
        <div className="container mx-auto px-6 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-accent shadow-lg transition-smooth glow-on-hover">
                <Activity className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-semibold tracking-tight text-foreground">Sentiment Monitor</h1>
                <p className="text-sm text-muted-foreground/80">Real-time sentiment analysis</p>
              </div>
            </div>
            {lastUpdated && (
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 rounded-full bg-muted/40 px-4 py-2 text-sm text-muted-foreground backdrop-blur-sm">
                  <Clock className="h-4 w-4" />
                  <span>{formatLastUpdated()}</span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRefresh}
                  disabled={isLoading}
                  className="rounded-full bg-white/60 backdrop-blur-sm hover:bg-white/80 dark:bg-white/10 dark:hover:bg-white/20 transition-smooth border-white/40"
                >
                  <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
                </Button>
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8">
        {/* Search Bar */}
        <div className="mb-8 glass-card dark:glass-card-dark rounded-3xl p-6 shadow-2xl transition-smooth hover:shadow-3xl">
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground/60" />
              <Input
                type="text"
                placeholder="Enter company name..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={handleKeyDown}
                onFocus={() => setShowHistory(true)}
                className="pl-12 h-12 rounded-2xl border-white/30 bg-white/50 backdrop-blur-sm dark:bg-white/5 dark:border-white/10 transition-smooth focus:bg-white/70 dark:focus:bg-white/10 focus:ring-2 focus:ring-primary/20"
              />
              {showHistory && searchHistory.length > 0 && (
                <div className="absolute left-0 right-0 top-full z-10 mt-3 rounded-2xl glass-card dark:glass-card-dark shadow-2xl overflow-hidden">
                  <div className="flex items-center justify-between border-b border-white/20 dark:border-white/10 px-5 py-3 bg-white/40 dark:bg-white/5">
                    <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                      <History className="h-4 w-4" />
                      Recent Searches
                    </div>
                    <Button variant="ghost" size="sm" onClick={handleClearHistory} className="h-8 rounded-xl hover:bg-white/40 dark:hover:bg-white/10">
                      Clear
                    </Button>
                  </div>
                  <div className="max-h-64 overflow-y-auto">
                    {searchHistory.map((item, index) => (
                      <button
                        key={index}
                        onClick={() => handleHistorySelect(item)}
                        className="flex w-full items-center justify-between px-5 py-3 text-left transition-smooth hover:bg-white/50 dark:hover:bg-white/10"
                      >
                        <div className="flex items-center gap-3">
                          <span className="font-medium text-foreground">{item.company}</span>
                          <Badge variant={item.score > 20 ? "default" : item.score < -20 ? "destructive" : "secondary"} className="rounded-full">
                            {item.score > 0 ? "+" : ""}
                            {item.score?.toFixed(1) ?? "0.0"}
                          </Badge>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {new Date(item.timestamp).toLocaleDateString()}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <Button onClick={handleSearch} disabled={isLoading} className="h-12 rounded-2xl px-8 bg-gradient-to-br from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-white font-medium shadow-lg hover:shadow-xl transition-smooth">
              {isLoading ? "Analyzing..." : "Analyze"}
            </Button>
          </div>
          {showHistory && searchHistory.length > 0 && (
            <div className="fixed inset-0 z-0" onClick={() => setShowHistory(false)} />
          )}
        </div>

        {error && (
          <div className="mb-8 glass-card dark:glass-card-dark rounded-3xl border-destructive/30 bg-destructive/5 p-6">
            <p className="text-destructive font-medium">Failed to load sentiment data. Please try again.</p>
          </div>
        )}

        {/* Stats Grid */}
        {data && data.score !== undefined && (
          <>
            <div className="mb-8 grid gap-5 md:grid-cols-4">
              <div className="glass-card dark:glass-card-dark rounded-3xl p-6 transition-smooth hover:scale-105 hover:shadow-2xl">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/20 to-primary/10 backdrop-blur-sm">
                    <TrendingUp className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground/70 uppercase tracking-wider">Score</p>
                    <p className="text-3xl font-bold text-foreground tracking-tight">{data.score.toFixed(1)}</p>
                  </div>
                </div>
              </div>

              <div className="glass-card dark:glass-card-dark rounded-3xl p-6 transition-smooth hover:scale-105 hover:shadow-2xl">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-accent/20 to-accent/10 backdrop-blur-sm">
                    <MessageSquare className="h-6 w-6 text-accent" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground/70 uppercase tracking-wider">Total</p>
                    <p className="text-3xl font-bold text-foreground tracking-tight">{data.total}</p>
                  </div>
                </div>
              </div>

              <div className="glass-card dark:glass-card-dark rounded-3xl p-6 transition-smooth hover:scale-105 hover:shadow-2xl">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-chart-3/20 to-chart-3/10 backdrop-blur-sm">
                    <div className="h-4 w-4 rounded-full bg-chart-3 shadow-lg" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground/70 uppercase tracking-wider">Positive</p>
                    <p className="text-3xl font-bold text-foreground tracking-tight">{data.positive}</p>
                  </div>
                </div>
              </div>

              <div className="glass-card dark:glass-card-dark rounded-3xl p-6 transition-smooth hover:scale-105 hover:shadow-2xl">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-destructive/20 to-destructive/10 backdrop-blur-sm">
                    <div className="h-4 w-4 rounded-full bg-destructive shadow-lg" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground/70 uppercase tracking-wider">Negative</p>
                    <p className="text-3xl font-bold text-foreground tracking-tight">{data.negative}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Main Content Grid */}
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Sentiment Gauge */}
              <div className="glass-card dark:glass-card-dark rounded-3xl p-8 shadow-xl transition-smooth">
                <h2 className="mb-6 text-lg font-semibold text-foreground tracking-tight">Live Sentiment</h2>
                <SentimentGauge score={data.score} />
              </div>

              {/* Sentiment Trend Chart */}
              <div className="glass-card dark:glass-card-dark rounded-3xl p-8 shadow-xl transition-smooth">
                <h2 className="mb-6 text-lg font-semibold text-foreground tracking-tight">Sentiment Trend</h2>
                <SentimentChart data={data.history} />
              </div>
            </div>

            {/* AI Insights */}
            <div className="mt-6">
              <AiInsights sentimentData={data} />
            </div>

            {/* Recent Mentions */}
            <div className="mt-6 glass-card dark:glass-card-dark rounded-3xl p-8 shadow-xl transition-smooth">
              <h2 className="mb-6 text-lg font-semibold text-foreground tracking-tight">Recent Mentions</h2>
              <MentionsList mentions={data.mentions} />
            </div>
          </>
        )}

        {isLoading && !data && (
          <div className="flex items-center justify-center py-20">
            <div className="text-center glass-card dark:glass-card-dark rounded-3xl p-8 max-w-md">
              <div className="mb-6 inline-block h-12 w-12 animate-spin rounded-full border-4 border-primary/30 border-t-primary" />
              <h3 className="text-lg font-semibold text-foreground mb-3">Analyzing Sentiment</h3>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p className="flex items-center gap-2 justify-center">
                  <span className="inline-block h-2 w-2 rounded-full bg-primary animate-pulse" />
                  Generating relevant topics
                </p>
                <p className="flex items-center gap-2 justify-center">
                  <span className="inline-block h-2 w-2 rounded-full bg-primary animate-pulse" style={{ animationDelay: "0.2s" }} />
                  Searching Reddit discussions
                </p>
                <p className="flex items-center gap-2 justify-center">
                  <span className="inline-block h-2 w-2 rounded-full bg-primary animate-pulse" style={{ animationDelay: "0.4s" }} />
                  Collecting comments
                </p>
                <p className="flex items-center gap-2 justify-center">
                  <span className="inline-block h-2 w-2 rounded-full bg-primary animate-pulse" style={{ animationDelay: "0.6s" }} />
                  Filtering for relevance
                </p>
                <p className="flex items-center gap-2 justify-center">
                  <span className="inline-block h-2 w-2 rounded-full bg-primary animate-pulse" style={{ animationDelay: "0.8s" }} />
                  Analyzing with AI
                </p>
              </div>
              <p className="mt-6 text-xs text-muted-foreground/60">This may take 15-30 seconds...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
