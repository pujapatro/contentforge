import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { startOfMonth, endOfMonth } from 'date-fns'

const createPostSchema = z.object({
  brandId: z.string().min(1),
  platform: z.enum(['linkedin', 'twitter', 'instagram']),
  scheduledDate: z.string().min(1),
  scheduledTime: z.string().default('09:00'),
  caption: z.string().min(1),
  hashtags: z.array(z.string()).default([]),
  contentPillar: z.string().min(1),
  status: z.enum(['draft', 'scheduled', 'published', 'skipped']).default('draft'),
})

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const brandId = searchParams.get('brandId')
    const month = searchParams.get('month')
    const platform = searchParams.get('platform')
    const status = searchParams.get('status')

    if (!brandId) {
      return NextResponse.json({ error: 'brandId is required' }, { status: 400 })
    }

    // Verify brand ownership
    const brand = await prisma.brand.findUnique({ where: { id: brandId } })
    if (!brand || brand.userId !== session.user.id) {
      return NextResponse.json({ error: 'Brand not found or forbidden' }, { status: 403 })
    }

    const where: Record<string, unknown> = { brandId }

    if (month) {
      const monthDate = new Date(month + '-01')
      where.scheduledDate = {
        gte: startOfMonth(monthDate),
        lte: endOfMonth(monthDate),
      }
    }

    if (platform && platform !== 'all') {
      where.platform = platform
    }

    if (status && status !== 'all') {
      where.status = status
    }

    const posts = await prisma.post.findMany({
      where,
      include: { analytics: true },
      orderBy: { scheduledDate: 'asc' },
    })

    return NextResponse.json({ posts })
  } catch (error) {
    console.error('GET /api/posts error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const validated = createPostSchema.safeParse(body)

    if (!validated.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validated.error.flatten() },
        { status: 400 }
      )
    }

    const brand = await prisma.brand.findUnique({ where: { id: validated.data.brandId } })
    if (!brand || brand.userId !== session.user.id) {
      return NextResponse.json({ error: 'Brand not found or forbidden' }, { status: 403 })
    }

    const post = await prisma.post.create({
      data: {
        ...validated.data,
        scheduledDate: new Date(validated.data.scheduledDate),
        userId: session.user.id,
        aiGenerated: false,
      },
      include: { analytics: true },
    })

    return NextResponse.json({ post }, { status: 201 })
  } catch (error) {
    console.error('POST /api/posts error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
