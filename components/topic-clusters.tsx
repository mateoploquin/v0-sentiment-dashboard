"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import type { TopicCluster } from "@/lib/types"
import { AlertCircle, TrendingDown, TrendingUp, Minus } from "lucide-react"

interface TopicClustersProps {
  clusters: TopicCluster[]
}

export function TopicClusters({ clusters }: TopicClustersProps) {
  if (!clusters || clusters.length === 0) {
    return null
  }

  const getSentimentIcon = (score: number) => {
    if (score > 10) return <TrendingUp className="h-4 w-4 text-green-500" />
    if (score < -10) return <TrendingDown className="h-4 w-4 text-red-500" />
    return <Minus className="h-4 w-4 text-gray-500" />
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "destructive"
      case "medium":
        return "default"
      case "low":
        return "secondary"
      default:
        return "secondary"
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold">Topic Analysis</h2>
        <p className="text-muted-foreground">Sentiment grouped by discussion topics</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {clusters.map((cluster, index) => {
          const positivePercent = (cluster.positive / cluster.mentionCount) * 100
          const negativePercent = (cluster.negative / cluster.mentionCount) * 100

          return (
            <Card key={index} className={cluster.shouldAddress ? "border-orange-300" : ""}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="flex items-center gap-2">
                      {getSentimentIcon(cluster.averageSentiment)}
                      {cluster.topic}
                    </CardTitle>
                    <CardDescription className="mt-1">{cluster.description}</CardDescription>
                  </div>
                  {cluster.shouldAddress && (
                    <Badge variant={getPriorityColor(cluster.priority)} className="ml-2">
                      {cluster.priority === "high" && <AlertCircle className="mr-1 h-3 w-3" />}
                      {cluster.priority.toUpperCase()}
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{cluster.mentionCount} mentions</span>
                  <span className={cluster.averageSentiment < -10 ? "text-red-600 font-medium" : cluster.averageSentiment > 10 ? "text-green-600 font-medium" : "text-gray-600"}>
                    Score: {cluster.averageSentiment.toFixed(1)}
                  </span>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full flex">
                        <div
                          className="bg-green-500"
                          style={{ width: `${positivePercent}%` }}
                        />
                        <div
                          className="bg-red-500"
                          style={{ width: `${negativePercent}%` }}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span className="text-green-600">{cluster.positive} positive</span>
                    <span className="text-gray-600">{cluster.neutral} neutral</span>
                    <span className="text-red-600">{cluster.negative} negative</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
