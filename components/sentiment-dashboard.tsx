"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { SentimentGauge } from "@/components/sentiment-gauge"
import { MentionsList } from "@/components/mentions-list"
import { SentimentChart } from "@/components/sentiment-chart"
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

  const { data, error, isLoading, mutate } = useSWR<SentimentData>(
    `/api/sentiment?company=${encodeURIComponent(company)}`,
    fetcher,
    {
      refreshInterval: 60000, // Refresh every minute
      revalidateOnFocus: true,
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
    if (!lastUpdated) return "Never"
    const seconds = Math.floor((Date.now() - lastUpdated.getTime()) / 1000)
    if (seconds < 60) return `${seconds}s ago`
    const minutes = Math.floor(seconds / 60)
    if (minutes < 60) return `${minutes}m ago`
    const hours = Math.floor(minutes / 60)
    return `${hours}h ago`
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch()
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
                <Activity className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-foreground">Sentiment Monitor</h1>
                <p className="text-sm text-muted-foreground">Real-time Reddit sentiment analysis</p>
              </div>
            </div>
            {lastUpdated && (
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>Updated {formatLastUpdated()}</span>
                </div>
                <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isLoading}>
                  <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
                </Button>
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Search Bar */}
        <Card className="mb-8 p-6">
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Enter company name..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyPress={handleKeyPress}
                onFocus={() => setShowHistory(true)}
                className="pl-10"
              />
              {showHistory && searchHistory.length > 0 && (
                <div className="absolute left-0 right-0 top-full z-10 mt-2 rounded-lg border border-border bg-card shadow-lg">
                  <div className="flex items-center justify-between border-b border-border px-4 py-2">
                    <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                      <History className="h-4 w-4" />
                      Recent Searches
                    </div>
                    <Button variant="ghost" size="sm" onClick={handleClearHistory}>
                      Clear
                    </Button>
                  </div>
                  <div className="max-h-64 overflow-y-auto">
                    {searchHistory.map((item, index) => (
                      <button
                        key={index}
                        onClick={() => handleHistorySelect(item)}
                        className="flex w-full items-center justify-between px-4 py-3 text-left transition-colors hover:bg-accent"
                      >
                        <div className="flex items-center gap-3">
                          <span className="font-medium text-foreground">{item.company}</span>
                          <Badge variant={item.score > 20 ? "default" : item.score < -20 ? "destructive" : "secondary"}>
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
            <Button onClick={handleSearch} disabled={isLoading}>
              {isLoading ? "Analyzing..." : "Analyze"}
            </Button>
          </div>
          {showHistory && searchHistory.length > 0 && (
            <div className="fixed inset-0 z-0" onClick={() => setShowHistory(false)} />
          )}
        </Card>

        {error && (
          <Card className="mb-8 border-destructive bg-destructive/10 p-6">
            <p className="text-destructive">Failed to load sentiment data. Please try again.</p>
          </Card>
        )}

        {/* Stats Grid */}
        {data && data.score !== undefined && (
          <>
            <div className="mb-8 grid gap-4 md:grid-cols-4">
              <Card className="p-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <TrendingUp className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Sentiment Score</p>
                    <p className="text-2xl font-semibold text-foreground">{data.score.toFixed(1)}</p>
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10">
                    <MessageSquare className="h-5 w-5 text-accent" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Mentions</p>
                    <p className="text-2xl font-semibold text-foreground">{data.total}</p>
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-chart-3/10">
                    <div className="h-3 w-3 rounded-full bg-chart-3" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Positive</p>
                    <p className="text-2xl font-semibold text-foreground">{data.positive}</p>
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-destructive/10">
                    <div className="h-3 w-3 rounded-full bg-destructive" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Negative</p>
                    <p className="text-2xl font-semibold text-foreground">{data.negative}</p>
                  </div>
                </div>
              </Card>
            </div>

            {/* Main Content Grid */}
            <div className="grid gap-8 lg:grid-cols-2">
              {/* Sentiment Gauge */}
              <Card className="p-6">
                <h2 className="mb-6 text-lg font-semibold text-foreground">Live Sentiment</h2>
                <SentimentGauge score={data.score} />
              </Card>

              {/* Sentiment Trend Chart */}
              <Card className="p-6">
                <h2 className="mb-6 text-lg font-semibold text-foreground">Sentiment Trend</h2>
                <SentimentChart data={data.history} />
              </Card>
            </div>

            {/* Recent Mentions */}
            <Card className="mt-8 p-6">
              <h2 className="mb-6 text-lg font-semibold text-foreground">Recent Mentions</h2>
              <MentionsList mentions={data.mentions} />
            </Card>
          </>
        )}

        {isLoading && !data && (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
              <p className="text-muted-foreground">Analyzing sentiment...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
