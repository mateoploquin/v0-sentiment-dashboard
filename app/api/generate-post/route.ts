import { type NextRequest, NextResponse } from "next/server"
import { SocialMediaGenerator } from "@/lib/social-media-generator"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { company, topic, postIdea, platform, generateAll } = body

    if (!company || !topic || !postIdea) {
      return NextResponse.json(
        { error: "Missing required fields: company, topic, postIdea" },
        { status: 400 },
      )
    }

    console.log(`[v0] Generating ${platform || "all platforms"} post for: ${company} - ${topic}`)

    const generator = new SocialMediaGenerator()

    if (generateAll) {
      // Generate content for all platforms
      const posts = await generator.generateAllPlatforms(company, topic, postIdea)
      return NextResponse.json({ posts })
    } else {
      // Generate content for specific platform
      if (!platform) {
        return NextResponse.json(
          { error: "Platform required when generateAll is false" },
          { status: 400 },
        )
      }

      const post = await generator.generateContent({
        company,
        topic,
        postIdea,
        platform,
      })

      return NextResponse.json({ post })
    }
  } catch (error) {
    console.error("[v0] Generate post error:", error)
    return NextResponse.json(
      { error: "Failed to generate post content" },
      { status: 500 },
    )
  }
}
