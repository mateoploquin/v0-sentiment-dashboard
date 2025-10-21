"use client"

import { Badge } from "@/components/ui/badge"
import { ExternalLink } from "lucide-react"

interface Mention {
  id: string
  text: string
  sentiment: "positive" | "neutral" | "negative"
  score: number
  author: string
  subreddit: string
  created: string
  url: string
}

interface MentionsListProps {
  mentions: Mention[]
}

export function MentionsList({ mentions }: MentionsListProps) {
  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case "positive":
        return "bg-chart-3/20 text-chart-3 border-chart-3/30"
      case "negative":
        return "bg-destructive/20 text-destructive border-destructive/30"
      default:
        return "bg-muted text-muted-foreground border-border"
    }
  }

  return (
    <div className="space-y-4">
      {mentions.length === 0 ? (
        <p className="text-center text-muted-foreground">No mentions found</p>
      ) : (
        mentions.map((mention) => (
          <div
            key={mention.id}
            className="rounded-lg border border-border bg-card p-4 transition-colors hover:bg-muted/50"
          >
            <div className="mb-2 flex items-start justify-between gap-4">
              <div className="flex-1">
                <p className="text-sm leading-relaxed text-card-foreground">{mention.text}</p>
              </div>
              <Badge className={getSentimentColor(mention.sentiment)}>{mention.sentiment}</Badge>
            </div>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span>r/{mention.subreddit}</span>
              <span>u/{mention.author}</span>
              <span>{new Date(mention.created).toLocaleString()}</span>
              <a
                href={mention.url}
                target="_blank"
                rel="noopener noreferrer"
                className="ml-auto flex items-center gap-1 text-primary hover:underline"
              >
                View <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </div>
        ))
      )}
    </div>
  )
}
