"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Sparkles, TrendingUp, TrendingDown, Minus } from "lucide-react"
import type { SentimentData } from "@/lib/types"

interface ThemeData {
  theme: string
  sentiment: "positive" | "neutral" | "negative"
  description: string
}

interface SummaryResponse {
  executive_summary: string
  key_themes: ThemeData[]
}

interface AiInsightsProps {
  sentimentData: SentimentData
}

export function AiInsights({ sentimentData }: AiInsightsProps) {
  const [summary, setSummary] = useState<SummaryResponse | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const generateSummary = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/summary", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(sentimentData),
      })

      if (!response.ok) {
        throw new Error("Failed to generate summary")
      }

      const data: SummaryResponse = await response.json()
      setSummary(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate summary")
    } finally {
      setIsLoading(false)
    }
  }

  const getSentimentIcon = (sentiment: string) => {
    switch (sentiment) {
      case "positive":
        return <TrendingUp className="h-4 w-4" />
      case "negative":
        return <TrendingDown className="h-4 w-4" />
      default:
        return <Minus className="h-4 w-4" />
    }
  }

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case "positive":
        return "text-chart-3 bg-chart-3/10 border-chart-3/20"
      case "negative":
        return "text-destructive bg-destructive/10 border-destructive/20"
      default:
        return "text-muted-foreground bg-muted/50 border-muted/20"
    }
  }

  return (
    <div className="glass-card dark:glass-card-dark rounded-3xl p-8 shadow-xl transition-smooth">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground tracking-tight flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          AI Insights
        </h2>
        {!summary && (
          <Button
            onClick={generateSummary}
            disabled={isLoading}
            className="rounded-2xl bg-gradient-to-br from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-white font-medium shadow-lg hover:shadow-xl transition-smooth"
          >
            {isLoading ? (
              <>
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Generate Summary
              </>
            )}
          </Button>
        )}
      </div>

      {error && (
        <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-4">
          <p className="text-sm text-destructive font-medium">{error}</p>
        </div>
      )}

      {summary && (
        <div className="space-y-6">
          {/* Executive Summary */}
          <div className="rounded-2xl bg-gradient-to-br from-primary/5 to-accent/5 border border-white/20 dark:border-white/10 p-6">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              Executive Summary
            </h3>
            <p className="text-foreground leading-relaxed">{summary.executive_summary}</p>
          </div>

          {/* Key Themes */}
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
              Key Themes
            </h3>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {summary.key_themes.map((theme, index) => (
                <Card
                  key={index}
                  className={`rounded-2xl border p-5 transition-smooth hover:scale-105 hover:shadow-lg ${getSentimentColor(theme.sentiment)}`}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/50 dark:bg-white/10">
                      {getSentimentIcon(theme.sentiment)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-foreground mb-1 truncate">{theme.theme}</h4>
                      <p className="text-sm text-muted-foreground leading-relaxed">{theme.description}</p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          {/* Regenerate Button */}
          <div className="flex justify-end">
            <Button
              onClick={generateSummary}
              disabled={isLoading}
              variant="outline"
              size="sm"
              className="rounded-2xl"
            >
              <Sparkles className="mr-2 h-4 w-4" />
              Regenerate
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

