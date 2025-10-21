# Social Media Response Generator - Usage Guide

## Quick Start

### 1. Run the Dashboard
```bash
npm run dev
```
Visit `http://localhost:3000`

### 2. Analyze Sentiment
- Enter a company name (e.g., "Tesla", "Apple", "Starbucks")
- Click "Analyze"
- Wait 30-60 seconds for the multi-stage analysis

### 3. View Results
The dashboard shows:
- Overall sentiment score and stats
- Sentiment gauge and trend chart
- **Topic Clusters** - Customer discussions grouped by theme
- **Actionable Recommendations** - Post ideas for addressing issues
- Recent mentions from Reddit

### 4. Generate Social Media Posts

#### When to Use This Feature
Look for recommendations with **HIGH** or **MEDIUM** priority badges. These indicate topics where customers have significant negative sentiment.

#### Step-by-Step Process

**Step 1: Choose a Post Idea**
- Scroll to "Actionable Recommendations" section
- Each recommendation shows:
  - The problematic topic (e.g., "Battery Life", "Customer Service")
  - Why it matters
  - 3-4 post ideas with different approaches

**Step 2: Click "Create Post"**
- Click the "Create Post" button next to any post idea
- A modal opens showing the post concept details

**Step 3: Generate Content**
- Review the post concept (topic, approach, goal)
- Click "Generate Posts for All Platforms"
- Wait 10-20 seconds while AI creates 4 platform versions

**Step 4: Choose Your Platform**
- Click tabs to switch between:
  - **Twitter/X** - Short, punchy (280 chars)
  - **LinkedIn** - Professional, detailed (up to 3000 chars)
  - **Facebook** - Conversational, engaging
  - **Instagram** - Visual, story-driven (with hashtags)

**Step 5: Copy & Post**
- Review the generated content
- Check character count and hashtags
- Note the media recommendation
- Click "Copy to Clipboard"
- Paste into your social media platform
- Add images/videos as suggested
- Publish!

## Example Workflow

### Scenario: Tesla Battery Complaints

1. **Dashboard shows**: High priority issue on "Battery Life"
   - 15 negative mentions
   - Average sentiment: -45.2

2. **Recommendation displays**:
   ```
   Issue: Customers reporting shorter battery life after update
   Impact: Trust erosion and potential churn

   Post Ideas:
   ✓ Acknowledge Issue & Share Fix Timeline
   ✓ Explain What Happened (Transparency)
   ✓ Share Battery Optimization Tips
   ```

3. **User selects**: "Acknowledge Issue & Share Fix Timeline"

4. **System generates**:

   **Twitter** (278 chars):
   ```
   We've heard your concerns about battery life after our latest update.
   Our team identified the issue and is testing a fix now.

   Expect an update by Friday. Thanks for your patience! 🔋

   #TechUpdate #CustomerFirst
   ```

   **LinkedIn** (Professional post with details):
   ```
   Battery Life Update for Our Customers

   We've been closely monitoring feedback following our latest
   software update, and we want to address concerns about battery
   performance head-on.

   [Full details about what happened, what we're doing, next steps]

   #ProductUpdate #CustomerExperience
   ```

5. **User posts on LinkedIn**, directly addressing customer concerns with transparency

## Tips for Best Results

### Choosing the Right Post Idea
- **Acknowledge & Explain**: Best when you know the cause and solution
- **Announce Improvement**: When you've already fixed the issue
- **Share Roadmap**: For known limitations you're working on
- **Educate Users**: When customers misunderstand features
- **Address Misconception**: For inaccurate negative perceptions

### Customizing Generated Content
The AI creates ready-to-post content, but you can:
- Add specific dates/timelines
- Include links to support articles
- Mention specific team members
- Add company-specific terminology
- Adjust tone if needed

### Platform Selection
- **Twitter/X**: Quick acknowledgments, brief updates
- **LinkedIn**: Detailed explanations, company perspectives
- **Facebook**: Community engagement, conversational updates
- **Instagram**: Visual storytelling (requires image/video)

### When to Post
- **Immediately**: For urgent issues affecting many users
- **After internal review**: For sensitive topics
- **During business hours**: For better engagement
- **Avoid**: Posting without genuine solutions/updates

## Advanced Features

### Multiple Post Variations
- Generate content for the same idea at different times
- Compare approaches across different post ideas
- A/B test messaging (track which performs better)

### Batch Processing
- Review all recommendations at once
- Generate posts for multiple topics
- Create a posting calendar

### Integration with Workflow
1. Morning: Run sentiment analysis
2. Review high-priority recommendations
3. Generate posts for critical issues
4. Have team review content
5. Schedule posts throughout the day
6. Monitor responses and engagement

## Best Practices

### Do's ✅
- Be authentic and transparent
- Acknowledge issues honestly
- Provide timelines when possible
- Show empathy for customer frustration
- Follow up with actual solutions

### Don'ts ❌
- Don't be defensive or make excuses
- Don't promise what you can't deliver
- Don't ignore high-priority issues
- Don't post without management approval for sensitive topics
- Don't use generated content without reviewing it

## Troubleshooting

### "No recommendations generated"
- This means sentiment is generally positive!
- No critical issues detected
- Keep monitoring for changes

### "Failed to generate posts"
- Check your OpenAI API key in `.env`
- Ensure you have API credits
- Try again (occasional API timeouts)

### Content seems off-brand
- Review and customize before posting
- Adjust the post idea selection
- Try a different approach angle
- Remember: AI provides a starting point

## API Configuration

Required environment variables:
```env
OPENAI_API_KEY=your-openai-api-key
```

The system uses:
- **GPT-4o-mini** for all AI tasks
- Optimized for cost and speed
- ~$0.002 per sentiment analysis run
- ~$0.005 per post generation (all platforms)

## Support

For issues or questions:
1. Check the console for error messages
2. Review `SOCIAL_MEDIA_FEATURE.md` for technical details
3. Ensure all dependencies are installed: `npm install`
4. Verify API keys are configured correctly
