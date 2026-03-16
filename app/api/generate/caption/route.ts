import { NextRequest } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { streamingModel } from '@/lib/gemini'
import { z } from 'zod'

const generateCaptionSchema = z.object({
  postId: z.string().min(1),
  instruction: z.string().optional(),
  tone: z.number().min(0).max(10).default(5),
})

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const body = await req.json()
    const validated = generateCaptionSchema.safeParse(body)

    if (!validated.success) {
      return new Response(
        JSON.stringify({ error: 'Validation failed', details: validated.error.flatten() }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const { postId, instruction, tone } = validated.data

    const post = await prisma.post.findUnique({
      where: { id: postId },
      include: { brand: true },
    })

    if (!post || post.userId !== session.user.id) {
      return new Response(JSON.stringify({ error: 'Post not found or forbidden' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const prompt = `Rewrite the following social media caption for ${post.platform}.
Brand: ${post.brand.name}, Niche: ${post.brand.niche}, Tone: ${post.brand.tone}
Content pillar: ${post.contentPillar}
Tone level: ${tone}/10 (0=very formal, 10=very casual)
Additional instruction: ${instruction ?? 'none'}
Original caption: ${post.caption}
Return only the new caption text, no JSON, no explanation.`

    const result = await streamingModel.generateContentStream(prompt)

    const stream = new ReadableStream({
      async start(controller) {
        let fullText = ''
        for await (const chunk of result.stream) {
          const text = chunk.text()
          fullText += text
          controller.enqueue(new TextEncoder().encode(text))
        }
        controller.close()

        // Increment regeneration count after streaming completes
        await prisma.post.update({
          where: { id: postId },
          data: { regenerationCount: { increment: 1 } },
        })
      },
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Transfer-Encoding': 'chunked',
        'X-Content-Type-Options': 'nosniff',
      },
    })
  } catch (error) {
    console.error('POST /api/generate/caption error:', error)
    return new Response(JSON.stringify({ error: 'Failed to generate caption' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
