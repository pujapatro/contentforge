import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { generateHashtags } from '@/lib/gemini'
import { z } from 'zod'

const generateHashtagsSchema = z.object({
  caption: z.string().min(1),
  platform: z.string().min(1),
  niche: z.string().min(1),
})

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const validated = generateHashtagsSchema.safeParse(body)

    if (!validated.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validated.error.flatten() },
        { status: 400 }
      )
    }

    const { caption, platform, niche } = validated.data
    const hashtags = await generateHashtags(caption, platform, niche)

    return NextResponse.json({ hashtags })
  } catch (error) {
    console.error('POST /api/generate/hashtags error:', error)
    return NextResponse.json({ error: 'Failed to generate hashtags' }, { status: 500 })
  }
}
