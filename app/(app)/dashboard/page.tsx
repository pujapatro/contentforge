import { redirect } from 'next/navigation'
import Link from 'next/link'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { format } from 'date-fns'
import { startOfMonth, endOfMonth } from 'date-fns'
import { Plus, Sparkles, ExternalLink } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { getPlatformColor, getStatusColor, truncateText } from '@/lib/utils'

export default async function DashboardPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const userId = session.user.id
  const now = new Date()
  const monthStart = startOfMonth(now)
  const monthEnd = endOfMonth(now)

  const [brands, postsThisMonth, recentPosts] = await Promise.all([
    prisma.brand.findMany({ where: { userId }, select: { id: true, name: true } }),

    prisma.post.findMany({
      where: {
        userId,
        scheduledDate: { gte: monthStart, lte: monthEnd },
      },
      select: { status: true },
    }),

    prisma.post.findMany({
      where: { userId },
      include: { brand: { select: { name: true } }, analytics: true },
      orderBy: { createdAt: 'desc' },
      take: 10,
    }),
  ])

  const publishedThisMonth = postsThisMonth.filter((p) => p.status === 'published').length
  const nonSkipped = postsThisMonth.filter((p) => p.status !== 'skipped').length
  const completionRate =
    nonSkipped > 0 ? Math.round((publishedThisMonth / nonSkipped) * 100) : 0

  const stats = [
    { label: 'Total Brands', value: brands.length, href: '/brands' },
    { label: 'Posts This Month', value: postsThisMonth.length, href: '/brands' },
    { label: 'Published This Month', value: publishedThisMonth, href: '/brands' },
    { label: 'Completion Rate', value: `${completionRate}%`, href: '/brands' },
  ]

  const platformLabels: Record<string, string> = {
    linkedin: 'LI',
    twitter: 'X',
    instagram: 'IG',
  }

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Welcome */}
      <div>
        <h2 className="text-2xl font-bold text-foreground">
          Good {now.getHours() < 12 ? 'morning' : now.getHours() < 18 ? 'afternoon' : 'evening'},{' '}
          {session.user.name?.split(' ')[0] ?? 'there'} 👋
        </h2>
        <p className="text-muted-foreground mt-1">
          Here&apos;s your content overview for {format(now, 'MMMM yyyy')}.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => (
          <Card key={s.label} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-2 pt-4 px-5">
              <CardTitle className="text-sm font-medium text-muted-foreground">{s.label}</CardTitle>
            </CardHeader>
            <CardContent className="pb-4 px-5">
              <p className="text-3xl font-bold text-foreground">{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-3">
        <Button asChild>
          <Link href="/brands/new">
            <Plus className="w-4 h-4" />
            Create Brand
          </Link>
        </Button>
        {brands.length > 0 && (
          <Button asChild variant="outline">
            <Link href={`/calendar/${brands[0].id}`}>
              <Sparkles className="w-4 h-4" />
              Generate Calendar
            </Link>
          </Button>
        )}
      </div>

      {/* Recent Posts */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Recent Posts</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {recentPosts.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground text-sm mb-4">No posts yet.</p>
              {brands.length === 0 ? (
                <Button asChild size="sm">
                  <Link href="/brands/new">Create your first brand</Link>
                </Button>
              ) : (
                <Button asChild size="sm">
                  <Link href={`/calendar/${brands[0].id}`}>Generate your first calendar</Link>
                </Button>
              )}
            </div>
          ) : (
            <div className="divide-y divide-border">
              {recentPosts.map((post) => (
                <div
                  key={post.id}
                  className="flex items-center gap-4 px-6 py-3 hover:bg-muted/30 transition-colors"
                >
                  {/* Platform badge */}
                  <span
                    className={`inline-flex items-center justify-center w-8 h-8 rounded-lg text-xs font-bold shrink-0 ${getPlatformColor(post.platform)}`}
                  >
                    {platformLabels[post.platform]}
                  </span>

                  {/* Caption */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground truncate">
                      {truncateText(post.caption, 80)}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">{post.brand?.name}</p>
                  </div>

                  {/* Date */}
                  <span className="text-xs text-muted-foreground shrink-0 hidden sm:block">
                    {format(new Date(post.scheduledDate), 'MMM d')}
                  </span>

                  {/* Status */}
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium shrink-0 ${getStatusColor(post.status)}`}
                  >
                    {post.status}
                  </span>

                  {/* Edit link */}
                  <Button asChild variant="ghost" size="icon" className="w-7 h-7 shrink-0">
                    <Link href={`/calendar/${post.brandId}`}>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </Link>
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
