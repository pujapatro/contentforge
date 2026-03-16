import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const createSavedCaptionSchema = z.object({
  brandId: z.string().min(1),
  platform: z.enum(['linkedin', 'twitter', 'instagram']),
  caption: z.string().min(1),
  hashtags: z.array(z.string()).default([]),
  label: z.string().optional(),
})

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const brandId = searchParams.get('brandId')
    const platform = searchParams.get('platform')
    const search = searchParams.get('search')

    const where: Record<string, unknown> = { userId: session.user.id }
    if (brandId) where.brandId = brandId
    if (platform && platform !== 'all') where.platform = platform
    if (search) {
      where.caption = { contains: search, mode: 'insensitive' }
    }

    const captions = await prisma.savedCaption.findMany({
      where,
      include: { brand: { select: { id: true, name: true } } },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ captions })
  } catch (error) {
    console.error('GET /api/library error:', error)
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
    const validated = createSavedCaptionSchema.safeParse(body)

    if (!validated.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validated.error.flatten() },
        { status: 400 }
      )
    }

    // Verify brand ownership
    const brand = await prisma.brand.findUnique({ where: { id: validated.data.brandId } })
    if (!brand || brand.userId !== session.user.id) {
      return NextResponse.json({ error: 'Brand not found or forbidden' }, { status: 403 })
    }

    const caption = await prisma.savedCaption.create({
      data: {
        ...validated.data,
        userId: session.user.id,
      },
      include: { brand: { select: { id: true, name: true } } },
    })

    return NextResponse.json({ caption }, { status: 201 })
  } catch (error) {
    console.error('POST /api/library error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
