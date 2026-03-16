import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const createBrandSchema = z.object({
  name: z.string().min(1, 'Brand name is required').max(100),
  niche: z.string().min(1, 'Niche is required').max(200),
  targetAudience: z.string().min(1, 'Target audience is required').max(500),
  tone: z.enum(['professional', 'casual', 'witty', 'inspirational']),
  platforms: z.array(z.enum(['linkedin', 'twitter', 'instagram'])).min(1),
  contentPillars: z.array(z.string()).min(1),
  competitorHandles: z.array(z.string()).default([]),
})

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const brands = await prisma.brand.findMany({
      where: { userId: session.user.id },
      include: {
        _count: {
          select: { posts: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ brands })
  } catch (error) {
    console.error('GET /api/brands error:', error)
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
    const validated = createBrandSchema.safeParse(body)

    if (!validated.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validated.error.flatten() },
        { status: 400 }
      )
    }

    const brand = await prisma.brand.create({
      data: {
        ...validated.data,
        userId: session.user.id,
      },
    })

    return NextResponse.json({ brand }, { status: 201 })
  } catch (error) {
    console.error('POST /api/brands error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
