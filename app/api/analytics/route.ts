import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { subDays, startOfDay } from 'date-fns'

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const brandId = searchParams.get('brandId')
    const period = parseInt(searchParams.get('period') ?? '30')

    if (!brandId) {
      return NextResponse.json({ error: 'brandId is required' }, { status: 400 })
    }

    const brand = await prisma.brand.findUnique({ where: { id: brandId } })
    if (!brand || brand.userId !== session.user.id) {
      return NextResponse.json({ error: 'Brand not found or forbidden' }, { status: 403 })
    }

    const periodStart = startOfDay(subDays(new Date(), period))

    // All posts for this brand
    const allPosts = await prisma.post.findMany({
      where: { brandId },
      include: { analytics: true },
    })

    // Posts within period
    const periodPosts = allPosts.filter(
      (p) => new Date(p.scheduledDate) >= periodStart
    )

    // Posts by status
    const postsByStatus = {
      draft: allPosts.filter((p) => p.status === 'draft').length,
      scheduled: allPosts.filter((p) => p.status === 'scheduled').length,
      published: allPosts.filter((p) => p.status === 'published').length,
      skipped: allPosts.filter((p) => p.status === 'skipped').length,
    }

    // Posts by platform
    const platformCounts: Record<string, number> = {}
    for (const post of allPosts) {
      platformCounts[post.platform] = (platformCounts[post.platform] ?? 0) + 1
    }
    const postsByPlatform = Object.entries(platformCounts).map(([platform, count]) => ({
      platform,
      count,
    }))

    // Posts by pillar
    const pillarCounts: Record<string, number> = {}
    for (const post of allPosts) {
      pillarCounts[post.contentPillar] = (pillarCounts[post.contentPillar] ?? 0) + 1
    }
    const postsByPillar = Object.entries(pillarCounts).map(([pillar, count]) => ({
      pillar,
      count,
    }))

    // Published this period
    const publishedThisPeriod = periodPosts.filter((p) => p.status === 'published').length

    // Completion rate: published / (total non-skipped)
    const nonSkipped = allPosts.filter((p) => p.status !== 'skipped').length
    const published = allPosts.filter((p) => p.status === 'published').length
    const completionRate = nonSkipped > 0 ? Math.round((published / nonSkipped) * 100) : 0

    // Top performing post
    const postsWithAnalytics = allPosts.filter((p) => p.analytics)
    let topPerformingPost = null
    if (postsWithAnalytics.length > 0) {
      topPerformingPost = postsWithAnalytics.reduce((best, post) => {
        const bestScore =
          (best.analytics?.likes ?? 0) +
          (best.analytics?.comments ?? 0) +
          (best.analytics?.shares ?? 0)
        const postScore =
          (post.analytics?.likes ?? 0) +
          (post.analytics?.comments ?? 0) +
          (post.analytics?.shares ?? 0)
        return postScore > bestScore ? post : best
      })
    }

    // Engagement by platform
    const platformEngagement: Record<
      string,
      { likes: number; comments: number; shares: number; count: number }
    > = {}
    for (const post of postsWithAnalytics) {
      if (!platformEngagement[post.platform]) {
        platformEngagement[post.platform] = { likes: 0, comments: 0, shares: 0, count: 0 }
      }
      platformEngagement[post.platform].likes += post.analytics?.likes ?? 0
      platformEngagement[post.platform].comments += post.analytics?.comments ?? 0
      platformEngagement[post.platform].shares += post.analytics?.shares ?? 0
      platformEngagement[post.platform].count += 1
    }
    const engagementByPlatform = Object.entries(platformEngagement).map(
      ([platform, data]) => ({
        platform,
        avgLikes: Math.round(data.likes / data.count),
        avgComments: Math.round(data.comments / data.count),
        avgShares: Math.round(data.shares / data.count),
      })
    )

    return NextResponse.json({
      postsByStatus,
      postsByPlatform,
      postsByPillar,
      publishedThisPeriod,
      completionRate,
      topPerformingPost,
      engagementByPlatform,
    })
  } catch (error) {
    console.error('GET /api/analytics error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
