import { GoogleGenerativeAI } from '@google/generative-ai'
import { format, startOfMonth, endOfMonth } from 'date-fns'
import type { Brand, HashtagSuggestion } from '@/types'

export const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

export const model = genAI.getGenerativeModel({
  model: 'gemini-1.5-flash',
  generationConfig: {
    responseMimeType: 'application/json',
  },
})

export const streamingModel = genAI.getGenerativeModel({
  model: 'gemini-1.5-flash',
})

interface GeneratedPost {
  platform: string
  scheduledDate: string
  scheduledTime: string
  caption: string
  hashtags: string[]
  contentPillar: string
  reasoning: string
}

export async function generateCalendarPosts(
  brand: Brand,
  month: string,
  postsPerWeek: number
): Promise<GeneratedPost[]> {
  const monthDate = new Date(month + '-01')
  const monthName = format(monthDate, 'MMMM yyyy')
  const totalPosts = postsPerWeek * 4

  const systemPrompt =
    'You are an expert social media content strategist. You create engaging, platform-optimised content calendars. Always respond with valid JSON.'

  const userPrompt = `Create a content calendar for the month of ${monthName}.
Brand: ${brand.name}
Niche: ${brand.niche}
Target audience: ${brand.targetAudience}
Brand voice/tone: ${brand.tone}
Content pillars: ${brand.contentPillars.join(', ')}
Platforms: ${brand.platforms.join(', ')}
Posts per week: ${postsPerWeek}

Generate exactly ${totalPosts} posts spread across the month.
Distribute posts evenly: one post every 2-3 days.
Rotate through content pillars and platforms.

For each post follow these rules:
- LinkedIn: professional tone, 150-300 words, no hashtags in body (add 3-5 at end)
- Twitter/X: punchy, max 240 characters, conversational, 2-3 hashtags
- Instagram: casual, emoji-rich, 100-200 words, 10-15 hashtags

Return ONLY this JSON structure, no other text:
{
  "posts": [
    {
      "platform": "linkedin",
      "scheduledDate": "${format(monthDate, 'yyyy-MM')}-03",
      "scheduledTime": "09:00",
      "caption": "full caption text here",
      "hashtags": ["tag1", "tag2"],
      "contentPillar": "pillar name",
      "reasoning": "brief reason this post fits the brand"
    }
  ]
}`

  const result = await model.generateContent(`${systemPrompt}\n\n${userPrompt}`)
  const response = result.response
  const text = response.text()

  const parsed = JSON.parse(text) as { posts: GeneratedPost[] }
  return parsed.posts
}

export async function generateHashtags(
  caption: string,
  platform: string,
  niche: string
): Promise<HashtagSuggestion[]> {
  const prompt = `Generate relevant hashtags for this ${platform} post in the ${niche} niche.

Caption: "${caption}"

Return ONLY this JSON structure:
{
  "hashtags": [
    {"tag": "hashtagname", "estimatedReach": "high"},
    {"tag": "hashtagname2", "estimatedReach": "medium"},
    {"tag": "hashtagname3", "estimatedReach": "low"}
  ]
}

Rules:
- Return exactly 15 hashtags
- Sort by estimated reach descending (high first, then medium, then low)
- Tags should not include the # symbol
- Mix popular and niche-specific hashtags
- estimatedReach must be exactly "high", "medium", or "low"`

  const result = await model.generateContent(prompt)
  const response = result.response
  const text = response.text()

  const parsed = JSON.parse(text) as { hashtags: HashtagSuggestion[] }
  return parsed.hashtags
}

export async function regenerateCaption(
  platform: string,
  brandName: string,
  niche: string,
  brandTone: string,
  contentPillar: string,
  originalCaption: string,
  toneLevel: number,
  instruction?: string
): Promise<string> {
  const prompt = `Rewrite the following social media caption for ${platform}.
Brand: ${brandName}, Niche: ${niche}, Tone: ${brandTone}
Content pillar: ${contentPillar}
Tone level: ${toneLevel}/10 (0=very formal, 10=very casual)
Additional instruction: ${instruction ?? 'none'}
Original caption: ${originalCaption}
Return only the new caption text, no JSON, no explanation.`

  const result = await streamingModel.generateContent(prompt)
  return result.response.text()
}
