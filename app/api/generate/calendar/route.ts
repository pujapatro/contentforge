import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { generateCalendarPosts } from '@/lib/gemini'
import { z } from 'zod'
import { startOfMonth, endOfMonth } from 'date-fns'

const generateCalendarSchema = z.object({
  brandId: z.string().min(1),
  month: z.string().regex(/^\d{4}-\d{2}$/, 'Month must be in YYYY-MM format'),
  postsPerWeek: z.number().int().min(1).max(7).default(3),
  regenerate: z.boolean().default(false),
})

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const validated = generateCalendarSchema.safeParse(body)

    if (!validated.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validated.error.flatten() },
        { status: 400 }
      )
    }

    const { brandId, month, postsPerWeek, regenerate } = validated.data

    // Verify brand ownership
    const brand = await prisma.brand.findUnique({ where: { id: brandId } })
    if (!brand || brand.userId !== session.user.id) {
      return NextResponse.json({ error: 'Brand not found or forbidden' }, { status: 403 })
    }

    const monthDate = new Date(month + '-01')

    // Create generation job record
    const job = await prisma.generationJob.create({
      data: {
        brandId,
        month: monthDate,
        status: 'running',
      },
    })

    try {
      // If regenerate, delete existing draft posts for this month
      if (regenerate) {
        await prisma.post.deleteMany({
          where: {
            brandId,
            status: 'draft',
            scheduledDate: {
              gte: startOfMonth(monthDate),
              lte: endOfMonth(monthDate),
            },
          },
        })
      }

      // Generate posts using Gemini
      const generatedPosts = await generateCalendarPosts(brand as Parameters<typeof generateCalendarPosts>[0], month, postsPerWeek)

      // Bulk insert posts
      const posts = await Promise.all(
        generatedPosts.map((p) =>
          prisma.post.create({
            data: {
              brandId,
              userId: session.user.id,
              platform: p.platform as 'linkedin' | 'twitter' | 'instagram',
              scheduledDate: new Date(p.scheduledDate),
              scheduledTime: p.scheduledTime,
              caption: p.caption,
              hashtags: p.hashtags,
              contentPillar: p.contentPillar,
              status: 'draft',
              aiGenerated: true,
            },
          })
        )
      )

      // Update job as done
      await prisma.generationJob.update({
        where: { id: job.id },
        data: {
          status: 'done',
          postsGenerated: posts.length,
        },
      })

      return NextResponse.json({
        posts,
        jobId: job.id,
        postsGenerated: posts.length,
      })
    } catch (genError) {
      await prisma.generationJob.update({
        where: { id: job.id },
        data: {
          status: 'failed',
          errorMessage: genError instanceof Error ? genError.message : 'Unknown error',
        },
      })
      throw genError
    }
  } catch (error) {
    console.error('POST /api/generate/calendar error:', error)
    return NextResponse.json({ error: 'Failed to generate calendar' }, { status: 500 })
  }
}
