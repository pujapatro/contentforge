'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams } from 'next/navigation'
import { Download, TrendingUp } from 'lucide-react'
import Papa from 'papaparse'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { CompletionDonut } from '@/components/analytics/CompletionDonut'
import { PlatformBar } from '@/components/analytics/PlatformBar'
import { PillarRadar } from '@/components/analytics/PillarRadar'
import { useAppStore } from '@/store/useAppStore'
import { getPlatformColor, getStatusColor, truncateText, formatDate } from '@/lib/utils'
import type { AnalyticsData, Brand } from '@/types'

type Period = 30 | 90 | 365

const PERIODS: { value: Period; label: string }[] = [
  { value: 30, label: '30 days' },
  { value: 90, label: '90 days' },
  { value: 365, label: 'All time' },
]

export default function AnalyticsPage() {
  const params = useParams()
  const brandId = params.brandId as string
  const { setActiveBrand } = useAppStore()

  const [brand, setBrand] = useState<Brand | null>(null)
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [period, setPeriod] = useState<Period>(30)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setActiveBrand(brandId)
  }, [brandId, setActiveBrand])

  useEffect(() => {
    fetch(`/api/brands/${brandId}`)
      .then((r) => r.json())
      .then((d) => setBrand(d.brand))
      .catch(console.error)
  }, [brandId])

  const fetchAnalytics = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/analytics?brandId=${brandId}&period=${period}`)
      const data = await res.json()
      setAnalytics(data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [brandId, period])

  useEffect(() => {
    fetchAnalytics()
  }, [fetchAnalytics])

  const handleExportCSV = async () => {
    const res = await fetch(`/api/posts?brandId=${brandId}`)
    const data = await res.json()
    const posts = data.posts ?? []

    const rows = posts.map((p: { platform: string; scheduledDate: string; status: string; caption: string; hashtags: string[]; contentPillar: string; analytics?: { likes: number; comments: number; shares: number; reach: number } }) => ({
      platform: p.platform,
      date: formatDate(p.scheduledDate),
      status: p.status,
      caption: p.caption,
      hashtags: p.hashtags.join(' '),
      pillar: p.contentPillar,
      likes: p.analytics?.likes ?? 0,
      comments: p.analytics?.comments ?? 0,
      shares: p.analytics?.shares ?? 0,
      reach: p.analytics?.reach ?? 0,
    }))

    const csv = Papa.unparse(rows)
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${brand?.name ?? 'brand'}-posts.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  if (loading || !analytics) {
    return (
      <div className="space-y-6 max-w-6xl">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-72 rounded-xl" />)}
        </div>
      </div>
    )
  }

  const topPlatform = analytics.postsByPlatform.reduce(
    (best, cur) => (cur.count > (best?.count ?? 0) ? cur : best),
    analytics.postsByPlatform[0]
  )

  const statCards = [
    { label: 'Total Posts', value: Object.values(analytics.postsByStatus).reduce((a, b) => a + b, 0) },
    { label: 'Published', value: analytics.postsByStatus.published },
    { label: 'Completion Rate', value: `${analytics.completionRate}%` },
    { label: 'Top Platform', value: topPlatform?.platform ? topPlatform.platform.charAt(0).toUpperCase() + topPlatform.platform.slice(1) : '—' },
  ]

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex-1">
          <h2 className="text-2xl font-bold">{brand?.name} Analytics</h2>
          <p className="text-muted-foreground text-sm mt-1">Content performance overview</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Period selector */}
          <div className="flex items-center gap-1 p-1 rounded-lg bg-muted">
            {PERIODS.map((p) => (
              <button
                key={p.value}
                onClick={() => setPeriod(p.value)}
                className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                  period === p.value
                    ? 'bg-background shadow-sm text-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
          <Button variant="outline" size="sm" onClick={handleExportCSV} className="gap-2">
            <Download className="w-3.5 h-3.5" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((s) => (
          <Card key={s.label}>
            <CardHeader className="pb-2 pt-4 px-5">
              <CardTitle className="text-sm font-medium text-muted-foreground">{s.label}</CardTitle>
            </CardHeader>
            <CardContent className="pb-4 px-5">
              <p className="text-3xl font-bold">{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Post Completion</CardTitle>
          </CardHeader>
          <CardContent>
            <CompletionDonut data={analytics.postsByStatus} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Posts by Platform</CardTitle>
          </CardHeader>
          <CardContent>
            <PlatformBar data={analytics.postsByPlatform} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Content Pillar Balance</CardTitle>
          </CardHeader>
          <CardContent>
            <PillarRadar data={analytics.postsByPillar} />
          </CardContent>
        </Card>
      </div>

      {/* Top Performing Post */}
      {analytics.topPerformingPost && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-amber-600" />
              Top Performing Post
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-start gap-4">
              <span
                className={`inline-flex items-center justify-center w-10 h-10 rounded-xl text-xs font-bold shrink-0 ${getPlatformColor(analytics.topPerformingPost.platform)}`}
              >
                {analytics.topPerformingPost.platform.slice(0, 2).toUpperCase()}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-foreground leading-relaxed">
                  {truncateText(analytics.topPerformingPost.caption, 200)}
                </p>
                <div className="flex flex-wrap items-center gap-3 mt-2">
                  <span className="text-xs text-muted-foreground">
                    {formatDate(analytics.topPerformingPost.scheduledDate)}
                  </span>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs ${getStatusColor(analytics.topPerformingPost.status)}`}>
                    {analytics.topPerformingPost.status}
                  </span>
                  {analytics.topPerformingPost.analytics && (
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span>❤️ {analytics.topPerformingPost.analytics.likes}</span>
                      <span>💬 {analytics.topPerformingPost.analytics.comments}</span>
                      <span>🔁 {analytics.topPerformingPost.analytics.shares}</span>
                      <span>👁 {analytics.topPerformingPost.analytics.reach}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Engagement by Platform */}
      {analytics.engagementByPlatform.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Avg. Engagement by Platform</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {analytics.engagementByPlatform.map((e) => (
                <div key={e.platform} className="p-4 rounded-xl bg-muted space-y-2">
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getPlatformColor(e.platform)}`}
                  >
                    {e.platform.charAt(0).toUpperCase() + e.platform.slice(1)}
                  </span>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div>
                      <p className="text-lg font-bold">{e.avgLikes}</p>
                      <p className="text-xs text-muted-foreground">Likes</p>
                    </div>
                    <div>
                      <p className="text-lg font-bold">{e.avgComments}</p>
                      <p className="text-xs text-muted-foreground">Comments</p>
                    </div>
                    <div>
                      <p className="text-lg font-bold">{e.avgShares}</p>
                      <p className="text-xs text-muted-foreground">Shares</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
