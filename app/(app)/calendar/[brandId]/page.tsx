'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams } from 'next/navigation'
import { format, addMonths, subMonths } from 'date-fns'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { CalendarView } from '@/components/calendar/CalendarView'
import { PostModal } from '@/components/calendar/PostModal'
import { GenerateMonthButton } from '@/components/calendar/GenerateMonthButton'
import { useAppStore } from '@/store/useAppStore'
import { getMonthString, getPlatformColor, getStatusColor } from '@/lib/utils'
import type { Brand, Post } from '@/types'

type Platform = 'all' | 'linkedin' | 'twitter' | 'instagram'
type Status = 'all' | 'draft' | 'scheduled' | 'published' | 'skipped'

const PLATFORM_FILTERS: { value: Platform; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'linkedin', label: 'LinkedIn' },
  { value: 'twitter', label: 'Twitter' },
  { value: 'instagram', label: 'Instagram' },
]

const STATUS_FILTERS: { value: Status; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'draft', label: 'Draft' },
  { value: 'scheduled', label: 'Scheduled' },
  { value: 'published', label: 'Published' },
  { value: 'skipped', label: 'Skipped' },
]

export default function CalendarPage() {
  const params = useParams()
  const brandId = params.brandId as string
  const { setActiveBrand, selectedMonth, setSelectedMonth } = useAppStore()

  const [brand, setBrand] = useState<Brand | null>(null)
  const [posts, setPosts] = useState<Post[]>([])
  const [loadingBrand, setLoadingBrand] = useState(true)
  const [loadingPosts, setLoadingPosts] = useState(true)

  const [platformFilter, setPlatformFilter] = useState<Platform>('all')
  const [statusFilter, setStatusFilter] = useState<Status>('all')

  const [modalOpen, setModalOpen] = useState(false)
  const [selectedPost, setSelectedPost] = useState<Post | null>(null)
  const [selectedDate, setSelectedDate] = useState<string | undefined>()

  const currentMonth = selectedMonth ?? getMonthString(new Date())

  useEffect(() => {
    setActiveBrand(brandId)
  }, [brandId, setActiveBrand])

  // Fetch brand
  useEffect(() => {
    setLoadingBrand(true)
    fetch(`/api/brands/${brandId}`)
      .then((r) => r.json())
      .then((data) => {
        setBrand(data.brand)
      })
      .catch(console.error)
      .finally(() => setLoadingBrand(false))
  }, [brandId])

  // Fetch posts for month
  const fetchPosts = useCallback(async () => {
    setLoadingPosts(true)
    try {
      const params = new URLSearchParams({ brandId, month: currentMonth })
      if (platformFilter !== 'all') params.set('platform', platformFilter)
      if (statusFilter !== 'all') params.set('status', statusFilter)
      const res = await fetch(`/api/posts?${params}`)
      const data = await res.json()
      setPosts(data.posts ?? [])
    } catch (e) {
      console.error(e)
    } finally {
      setLoadingPosts(false)
    }
  }, [brandId, currentMonth, platformFilter, statusFilter])

  useEffect(() => {
    fetchPosts()
  }, [fetchPosts])

  const handleMonthChange = (month: string) => {
    setSelectedMonth(month)
  }

  const handlePrevMonth = () => {
    const d = new Date(currentMonth + '-01')
    setSelectedMonth(getMonthString(subMonths(d, 1)))
  }

  const handleNextMonth = () => {
    const d = new Date(currentMonth + '-01')
    setSelectedMonth(getMonthString(addMonths(d, 1)))
  }

  const handlePostClick = (post: Post) => {
    setSelectedPost(post)
    setSelectedDate(undefined)
    setModalOpen(true)
  }

  const handleDateClick = (date: string) => {
    setSelectedPost(null)
    setSelectedDate(date)
    setModalOpen(true)
  }

  const handlePostSave = (updatedPost: Post) => {
    setPosts((prev) => {
      const idx = prev.findIndex((p) => p.id === updatedPost.id)
      if (idx >= 0) {
        const next = [...prev]
        next[idx] = updatedPost
        return next
      }
      return [...prev, updatedPost]
    })
  }

  const handlePostDelete = (postId: string) => {
    setPosts((prev) => prev.filter((p) => p.id !== postId))
  }

  const handleGenerated = (newPosts: Post[]) => {
    fetchPosts()
  }

  const monthLabel = format(new Date(currentMonth + '-01'), 'MMMM yyyy')

  if (loadingBrand) {
    return (
      <div className="space-y-6 max-w-6xl">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-44" />
        </div>
        <Skeleton className="h-[600px] w-full rounded-xl" />
      </div>
    )
  }

  if (!brand) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Brand not found.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4 max-w-6xl">
      {/* Top Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex items-center gap-3 flex-1">
          <h2 className="text-xl font-bold text-foreground">{brand.name}</h2>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handlePrevMonth}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-sm font-medium text-foreground w-36 text-center">{monthLabel}</span>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleNextMonth}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
        <GenerateMonthButton brand={brand} month={currentMonth} onGenerated={handleGenerated} />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Platform filters */}
        <div className="flex items-center gap-1 p-1 rounded-lg bg-muted">
          {PLATFORM_FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setPlatformFilter(f.value)}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                platformFilter === f.value
                  ? 'bg-background shadow-sm text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Status filters */}
        <div className="flex items-center gap-1 p-1 rounded-lg bg-muted">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setStatusFilter(f.value)}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                statusFilter === f.value
                  ? 'bg-background shadow-sm text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Post count */}
        <span className="text-xs text-muted-foreground ml-auto">
          {loadingPosts ? 'Loading…' : `${posts.length} post${posts.length !== 1 ? 's' : ''}`}
        </span>
      </div>

      {/* Calendar */}
      {loadingPosts ? (
        <Skeleton className="h-[600px] w-full rounded-xl" />
      ) : (
        <div className="rounded-xl border bg-card p-4 shadow-sm">
          <CalendarView
            posts={posts}
            onPostClick={handlePostClick}
            onDateClick={handleDateClick}
            onPostsUpdated={handlePostSave}
            currentMonth={currentMonth}
            onMonthChange={handleMonthChange}
          />
        </div>
      )}

      {/* Post Modal */}
      {brand && (
        <PostModal
          post={selectedPost}
          brand={brand}
          defaultDate={selectedDate}
          open={modalOpen}
          onClose={() => {
            setModalOpen(false)
            setSelectedPost(null)
            setSelectedDate(undefined)
          }}
          onSave={handlePostSave}
          onDelete={handlePostDelete}
        />
      )}
    </div>
  )
}
