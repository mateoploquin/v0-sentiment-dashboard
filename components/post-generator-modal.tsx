"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card } from "@/components/ui/card"
import { Copy, Check, Loader2, Twitter, Linkedin, Facebook, Instagram } from "lucide-react"
import type { SocialMediaPost } from "@/lib/types"

interface PostGeneratorModalProps {
  company: string
  topic: string
  postIdea: {
    id: string
    title: string
    description: string
    angle: string
  }
  onClose: () => void
}

export function PostGeneratorModal({
  company,
  topic,
  postIdea,
  onClose,
}: PostGeneratorModalProps) {
  const [isGenerating, setIsGenerating] = useState(false)
  const [posts, setPosts] = useState<SocialMediaPost[]>([])
  const [copiedPlatform, setCopiedPlatform] = useState<string | null>(null)
  const [selectedPlatform, setSelectedPlatform] = useState<string>("twitter")

  const platforms = [
    { id: "twitter", name: "Twitter/X", icon: Twitter, color: "text-sky-500" },
    { id: "linkedin", name: "LinkedIn", icon: Linkedin, color: "text-blue-600" },
    { id: "facebook", name: "Facebook", icon: Facebook, color: "text-blue-500" },
    { id: "instagram", name: "Instagram", icon: Instagram, color: "text-pink-600" },
  ]

  const handleGeneratePosts = async () => {
    setIsGenerating(true)
    try {
      const response = await fetch("/api/generate-post", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          company,
          topic,
          postIdea,
          generateAll: true,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to generate posts")
      }

      const data = await response.json()
      setPosts(data.posts)
    } catch (error) {
      console.error("Error generating posts:", error)
      alert("Failed to generate posts. Please try again.")
    } finally {
      setIsGenerating(false)
    }
  }

  const handleCopy = async (content: string, platform: string) => {
    await navigator.clipboard.writeText(content)
    setCopiedPlatform(platform)
    setTimeout(() => setCopiedPlatform(null), 2000)
  }

  const getPlatformPost = (platformId: string) => {
    return posts.find((p) => p.platform === platformId)
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">Generate Social Media Post</DialogTitle>
          <DialogDescription>
            Create platform-specific content for: <span className="font-semibold">{postIdea.title}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Post Idea Summary */}
          <Card className="p-4 bg-muted/50">
            <div className="space-y-2">
              <div>
                <span className="text-xs font-medium text-muted-foreground">Topic:</span>
                <p className="text-sm font-semibold">{topic}</p>
              </div>
              <div>
                <span className="text-xs font-medium text-muted-foreground">Approach:</span>
                <Badge variant="outline" className="ml-2">
                  {postIdea.angle}
                </Badge>
              </div>
              <div>
                <span className="text-xs font-medium text-muted-foreground">Goal:</span>
                <p className="text-sm">{postIdea.description}</p>
              </div>
            </div>
          </Card>

          {/* Generate Button */}
          {posts.length === 0 && (
            <div className="flex flex-col items-center gap-4 py-8">
              <p className="text-sm text-muted-foreground text-center">
                Click below to generate ready-to-post content for all social media platforms
              </p>
              <Button
                onClick={handleGeneratePosts}
                disabled={isGenerating}
                size="lg"
                className="min-w-48"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating Posts...
                  </>
                ) : (
                  "Generate Posts for All Platforms"
                )}
              </Button>
              <p className="text-xs text-muted-foreground">This may take 10-20 seconds</p>
            </div>
          )}

          {/* Platform Tabs with Generated Content */}
          {posts.length > 0 && (
            <Tabs value={selectedPlatform} onValueChange={setSelectedPlatform}>
              <TabsList className="grid w-full grid-cols-4">
                {platforms.map((platform) => {
                  const Icon = platform.icon
                  return (
                    <TabsTrigger key={platform.id} value={platform.id} className="gap-2">
                      <Icon className={`h-4 w-4 ${platform.color}`} />
                      <span className="hidden sm:inline">{platform.name}</span>
                    </TabsTrigger>
                  )
                })}
              </TabsList>

              {platforms.map((platform) => {
                const post = getPlatformPost(platform.id)
                const Icon = platform.icon

                return (
                  <TabsContent key={platform.id} value={platform.id} className="space-y-4">
                    {post && (
                      <>
                        {/* Platform Header */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Icon className={`h-5 w-5 ${platform.color}`} />
                            <h3 className="font-semibold">{platform.name}</h3>
                          </div>
                          <Badge variant="secondary">
                            {post.characterCount} / {platform.id === "twitter" ? "280" : "3000"}{" "}
                            characters
                          </Badge>
                        </div>

                        {/* Post Content */}
                        <Card className="p-4">
                          <div className="space-y-4">
                            <div className="prose prose-sm max-w-none">
                              <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed">
                                {post.content}
                              </pre>
                            </div>

                            {post.hashtags && post.hashtags.length > 0 && (
                              <div className="pt-2 border-t">
                                <p className="text-xs font-medium text-muted-foreground mb-2">
                                  Hashtags included:
                                </p>
                                <div className="flex flex-wrap gap-2">
                                  {post.hashtags.map((tag, idx) => (
                                    <Badge key={idx} variant="secondary">
                                      {tag}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            )}

                            {post.mediaRecommendation && (
                              <div className="pt-2 border-t">
                                <p className="text-xs font-medium text-muted-foreground mb-1">
                                  Media Suggestion:
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {post.mediaRecommendation}
                                </p>
                              </div>
                            )}
                          </div>
                        </Card>

                        {/* Action Buttons */}
                        <div className="flex gap-2">
                          <Button
                            onClick={() => handleCopy(post.content, platform.id)}
                            className="flex-1"
                            variant={copiedPlatform === platform.id ? "secondary" : "default"}
                          >
                            {copiedPlatform === platform.id ? (
                              <>
                                <Check className="mr-2 h-4 w-4" />
                                Copied!
                              </>
                            ) : (
                              <>
                                <Copy className="mr-2 h-4 w-4" />
                                Copy to Clipboard
                              </>
                            )}
                          </Button>
                        </div>
                      </>
                    )}
                  </TabsContent>
                )
              })}
            </Tabs>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
