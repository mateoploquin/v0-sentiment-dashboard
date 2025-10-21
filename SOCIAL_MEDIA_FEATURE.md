# Social Media Post Generator Feature

## Overview
This feature transforms the sentiment analysis dashboard into an actionable tool for addressing customer concerns through social media. Instead of generic recommendations, the system now generates ready-to-post content for multiple platforms.

## How It Works

### 1. Topic Clustering & Analysis (Existing)
- AI analyzes customer mentions and groups them into topics
- Identifies negative sentiment patterns
- Flags topics that need company attention

### 2. Post Idea Generation (New)
For each problematic topic, the AI generates 3-4 social media post ideas with:
- **Title**: Catchy headline for the post concept
- **Description**: What the post will communicate
- **Angle**: The approach (e.g., "acknowledge and explain", "announce improvement", "educate users")

### 3. Platform-Specific Content Generation (New)
When a user selects a post idea, the system generates ready-to-post content for:
- **Twitter/X** (280 chars, concise & punchy)
- **LinkedIn** (3000 chars, professional & detailed)
- **Facebook** (conversational & engaging)
- **Instagram** (visual & story-driven, with hashtags)

Each platform version includes:
- Optimized content within character limits
- Platform-appropriate tone and style
- Relevant hashtags
- Media recommendations

## User Flow

1. **View Recommendations**
   - Dashboard shows "Actionable Recommendations" section
   - Each recommendation includes post ideas for addressing the issue

2. **Select a Post Idea**
   - Click "Create Post" on any suggestion
   - Modal opens with post details

3. **Generate Content**
   - Click "Generate Posts for All Platforms"
   - AI creates 4 platform-specific versions (10-20 seconds)

4. **Review & Copy**
   - Browse tabs for each platform
   - See character count, hashtags, media suggestions
   - Copy ready-to-post content to clipboard

5. **Post on Social Media**
   - Paste into your preferred platform
   - Add any images/videos per media suggestion
   - Publish to address customer concerns publicly

## Technical Architecture

### New Files Created

#### Core Logic
- **`lib/social-media-generator.ts`**: Generates platform-specific content
- **`app/api/generate-post/route.ts`**: API endpoint for content generation

#### UI Components
- **`components/post-generator-modal.tsx`**: Modal with platform tabs
- **`components/ui/dialog.tsx`**: Dialog/modal primitives
- **`components/ui/tabs.tsx`**: Tab navigation primitives

#### Modified Files
- **`lib/types.ts`**: Added `PostSuggestion`, `SocialMediaPost` interfaces
- **`lib/recommendation-engine.ts`**: Changed to generate post ideas instead of action items
- **`components/recommendations.tsx`**: Added post selection and modal trigger
- **`components/sentiment-dashboard.tsx`**: Pass company name to recommendations

### Platform Configurations

```typescript
{
  twitter: {
    maxChars: 280,
    style: "concise and punchy",
    hashtags: 2
  },
  linkedin: {
    maxChars: 3000,
    style: "professional and detailed",
    hashtags: 5
  },
  facebook: {
    maxChars: 63206,
    style: "conversational and engaging",
    hashtags: 3
  },
  instagram: {
    maxChars: 2200,
    style: "visual and story-driven",
    hashtags: 10
  }
}
```

## Example Output

### Input
- **Topic**: "Battery Life"
- **Issue**: "Customers reporting significantly shorter battery life after recent update"
- **Post Idea**: "Acknowledge and provide fix timeline"

### Generated Content

**Twitter/X** (279 chars):
```
We've heard your concerns about battery life after our latest update.
Our team identified the issue and is testing a fix now.

Expect an update by Friday. Thanks for your patience! 🔋

#TechUpdate #CustomerFirst
```

**LinkedIn** (Professional, ~200 words):
```
Battery Life Update for Our Customers

We've been closely monitoring feedback following our latest software update,
and we want to address concerns about battery performance head-on.

What happened:
Our recent update included a background process optimization that,
unfortunately, had an unintended impact on battery consumption for some users.

What we're doing:
• Our engineering team identified the root cause within 48 hours
• We've developed and are testing a patch
• The fix will be released by end of week

What you can do now:
• Temporarily disable background app refresh to extend battery life
• Ensure you're on the latest version to receive the fix immediately

We take these issues seriously. Every piece of feedback helps us improve,
and we're grateful for our community's patience as we work to resolve this.

Update: We'll share more details as we approach the release.

#ProductUpdate #CustomerExperience #TechTransparency
```

## Key Features

### Intelligent Content Generation
- **Context-aware**: Uses actual customer feedback from mentions
- **Tone matching**: Adapts to company voice
- **Platform optimization**: Follows best practices for each network
- **Authentic messaging**: Encourages transparency over defensiveness

### Ready-to-Post
- No editing required (though customization welcome)
- Character limits enforced
- Hashtags integrated naturally
- Media suggestions included

### Efficient Workflow
- Generate all platforms at once
- One-click copy to clipboard
- Visual platform icons
- Character count indicators

## Future Enhancements

Potential additions:
- [ ] Schedule posts directly from dashboard
- [ ] A/B test multiple post variations
- [ ] Track engagement metrics on published posts
- [ ] Integration with social media management tools (Buffer, Hootsuite)
- [ ] Image generation for posts
- [ ] Multi-language support
- [ ] Sentiment tracking post-publication
