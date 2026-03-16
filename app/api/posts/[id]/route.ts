import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const updatePostSchema = z.object({
  platform: z.enum(['linkedin', 'twitter', 'instagram']).optional(),
  scheduledDate: z.string().optional(),
  scheduledTime: z.string().optional(),
  caption: z.string().min(1).optional(),
  hashtags: z.array(z.string()).optional(),
  contentPillar: z.string().optional(),
  status: z.enum(['draft', 'scheduled', 'published', 'skipped']).optional(),
  analytics: z
    .object({
      likes: z.number().int().min(0),
      comments: z.number().int().min(0),
      shares: z.number().int().min(0),
      reach: z.number().int().min(0),
    })
    .optional(),
})

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const post = await prisma.post.findUnique({
      where: { id: params.id },
      include: { analytics: true, brand: true },
    })

    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 })
    }

    if (post.userId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    return NextResponse.json({ post })
  } catch (error) {
    console.error('GET /api/posts/[id] error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const existing = await prisma.post.findUnique({ where: { id: params.id } })
    if (!existing) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 })
    }
    if (existing.userId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await req.json()
    const validated = updatePostSchema.safeParse(body)

    if (!validated.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validated.error.flatten() },
        { status: 400 }
      )
    }

    const { analytics, scheduledDate, ...postData } = validated.data

    const post = await prisma.post.update({
      where: { id: params.id },
      data: {
        ...postData,
        ...(scheduledDate && { scheduledDate: new Date(scheduledDate) }),
      },
      include: { analytics: true },
    })

    if (analytics) {
      await prisma.postAnalytic.upsert({
        where: { postId: params.id },
        create: {
          postId: params.id,
          ...analytics,
        },
        update: analytics,
      })
    }

    const updatedPost = await prisma.post.findUnique({
      where: { id: params.id },
      include: { analytics: true },
    })

    return NextResponse.json({ post: updatedPost })
  } catch (error) {
    console.error('PATCH /api/posts/[id] error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const existing = await prisma.post.findUnique({ where: { id: params.id } })
    if (!existing) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 })
    }
    if (existing.userId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    await prisma.post.delete({ where: { id: params.id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('DELETE /api/posts/[id] error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
