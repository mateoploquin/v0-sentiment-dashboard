"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import type { ActionableRecommendation } from "@/lib/types"
import { AlertCircle, CheckCircle2, Lightbulb, MessageSquare, ChevronRight } from "lucide-react"
import { PostGeneratorModal } from "./post-generator-modal"

interface RecommendationsProps {
  recommendations: ActionableRecommendation[]
  company: string
}

export function Recommendations({ recommendations, company }: RecommendationsProps) {
  const [selectedPost, setSelectedPost] = useState<{
    topic: string
    postIdea: { id: string; title: string; description: string; angle: string }
  } | null>(null)

  if (!recommendations || recommendations.length === 0) {
    return (
      <Card className="border-green-200 bg-green-50/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-700">
            <CheckCircle2 className="h-5 w-5" />
            No Critical Issues Detected
          </CardTitle>
          <CardDescription>
            Customer sentiment is generally positive. No immediate action items identified.
          </CardDescription>
        </CardHeader>
      </Card>
    )
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

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case "high":
        return <AlertCircle className="h-5 w-5" />
      default:
        return <Lightbulb className="h-5 w-5" />
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold">Actionable Recommendations</h2>
        <p className="text-muted-foreground">
          AI-generated strategies to address customer concerns
        </p>
      </div>

      <div className="space-y-4">
        {recommendations.map((rec, index) => (
          <Card key={index} className={rec.priority === "high" ? "border-orange-300" : ""}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    {getPriorityIcon(rec.priority)}
                    <CardTitle>{rec.topic}</CardTitle>
                  </div>
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant={getPriorityColor(rec.priority)}>
                      {rec.priority.toUpperCase()} PRIORITY
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      Affects {rec.affectedMentions} negative{" "}
                      {rec.affectedMentions === 1 ? "mention" : "mentions"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-2 mt-3">
                <div>
                  <p className="text-sm font-medium text-red-700">Issue:</p>
                  <p className="text-sm text-muted-foreground">{rec.issue}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-blue-700">Business Impact:</p>
                  <p className="text-sm text-muted-foreground">{rec.impact}</p>
                </div>
              </div>
            </CardHeader>

            <CardContent>
              <div>
                <p className="text-sm font-medium mb-3 flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  Social Media Post Ideas:
                </p>
                <div className="space-y-2">
                  {rec.postSuggestions.map((suggestion, suggestionIndex) => (
                    <div
                      key={suggestionIndex}
                      className="p-3 rounded-lg border border-border bg-muted/30 hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <p className="font-medium text-sm mb-1">{suggestion.title}</p>
                          <p className="text-xs text-muted-foreground mb-2">
                            {suggestion.description}
                          </p>
                          <Badge variant="outline" className="text-xs">
                            {suggestion.angle}
                          </Badge>
                        </div>
                        <Button
                          size="sm"
                          variant="default"
                          onClick={() =>
                            setSelectedPost({
                              topic: rec.topic,
                              postIdea: suggestion,
                            })
                          }
                          className="shrink-0"
                        >
                          Create Post
                          <ChevronRight className="ml-1 h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {selectedPost && (
        <PostGeneratorModal
          company={company}
          topic={selectedPost.topic}
          postIdea={selectedPost.postIdea}
          onClose={() => setSelectedPost(null)}
        />
      )}
    </div>
  )
}
