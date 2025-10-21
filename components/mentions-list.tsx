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
    <div className="space-y-3">
      {mentions.length === 0 ? (
        <p className="text-center text-muted-foreground py-8">No mentions found</p>
      ) : (
        mentions.map((mention) => (
          <div
            key={mention.id}
            className="rounded-2xl border border-white/20 dark:border-white/10 bg-white/40 dark:bg-white/5 backdrop-blur-sm p-5 transition-smooth hover:bg-white/60 dark:hover:bg-white/10 hover:scale-[1.02] hover:shadow-lg"
          >
            <div className="mb-3 flex items-start justify-between gap-4">
              <div className="flex-1">
                <p className="text-sm leading-relaxed text-foreground/90">{mention.text}</p>
              </div>
              <Badge className={`${getSentimentColor(mention.sentiment)} rounded-full font-medium`}>
                {mention.sentiment}
              </Badge>
            </div>
            <div className="flex items-center gap-4 text-xs text-muted-foreground/80">
              <span className="font-medium">r/{mention.subreddit}</span>
              <span>u/{mention.author}</span>
              <span>{new Date(mention.created).toLocaleDateString()}</span>
              <a
                href={mention.url}
                target="_blank"
                rel="noopener noreferrer"
                className="ml-auto flex items-center gap-1.5 text-primary hover:text-primary/80 transition-smooth font-medium"
              >
                View <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>
          </div>
        ))
      )}
    </div>
  )
}
