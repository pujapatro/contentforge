'use client'

import { useEffect, useState, useCallback } from 'react'
import { Search, Copy, Trash2, BookMarked, Hash } from 'lucide-react'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { getPlatformColor, truncateText, formatDate } from '@/lib/utils'
import type { SavedCaption, Brand } from '@/types'

type PlatformFilter = 'all' | 'linkedin' | 'twitter' | 'instagram'

export default function LibraryPage() {
  const [captions, setCaptions] = useState<(SavedCaption & { brand?: { id: string; name: string } })[]>([])
  const [brands, setBrands] = useState<Brand[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [platformFilter, setPlatformFilter] = useState<PlatformFilter>('all')
  const [brandFilter, setBrandFilter] = useState<string>('all')

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300)
    return () => clearTimeout(t)
  }, [search])

  // Fetch brands
  useEffect(() => {
    fetch('/api/brands')
      .then((r) => r.json())
      .then((d) => setBrands(d.brands ?? []))
      .catch(console.error)
  }, [])

  const fetchCaptions = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (platformFilter !== 'all') params.set('platform', platformFilter)
      if (brandFilter !== 'all') params.set('brandId', brandFilter)
      if (debouncedSearch) params.set('search', debouncedSearch)
      const res = await fetch(`/api/library?${params}`)
      const data = await res.json()
      setCaptions(data.captions ?? [])
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [platformFilter, brandFilter, debouncedSearch])

  useEffect(() => {
    fetchCaptions()
  }, [fetchCaptions])

  const handleCopy = (caption: SavedCaption) => {
    const text =
      caption.caption +
      (caption.hashtags.length > 0
        ? '\n\n' + caption.hashtags.map((h) => `#${h}`).join(' ')
        : '')
    navigator.clipboard.writeText(text)
    toast.success('Copied to clipboard!')
  }

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/library/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      setCaptions((prev) => prev.filter((c) => c.id !== id))
      toast.success('Deleted from library')
    } catch {
      toast.error('Failed to delete')
    }
  }

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold">Caption Library</h2>
        <p className="text-muted-foreground text-sm mt-1">
          Your saved captions, ready to reuse and repurpose.
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search captions…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        {brands.length > 1 && (
          <Select value={brandFilter} onValueChange={setBrandFilter}>
            <SelectTrigger className="w-44">
              <SelectValue placeholder="All brands" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All brands</SelectItem>
              {brands.map((b) => (
                <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {/* Platform tabs */}
      <Tabs value={platformFilter} onValueChange={(v) => setPlatformFilter(v as PlatformFilter)}>
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="linkedin">LinkedIn</TabsTrigger>
          <TabsTrigger value="twitter">Twitter</TabsTrigger>
          <TabsTrigger value="instagram">Instagram</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Results */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-48 rounded-xl" />
          ))}
        </div>
      ) : captions.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-16 h-16 rounded-2xl bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center mb-4">
            <BookMarked className="w-8 h-8 text-amber-600" />
          </div>
          <h3 className="text-lg font-semibold mb-2">No saved captions</h3>
          <p className="text-muted-foreground text-sm max-w-sm">
            {debouncedSearch
              ? 'No captions match your search. Try different keywords.'
              : 'Save captions from the post editor to build your library.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence>
            {captions.map((caption) => (
              <motion.div
                key={caption.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className="flex flex-col rounded-xl border bg-card shadow-sm hover:shadow-md transition-shadow"
              >
                {/* Card header */}
                <div className="flex items-center justify-between p-4 pb-2">
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getPlatformColor(caption.platform)}`}
                  >
                    {caption.platform.charAt(0).toUpperCase() + caption.platform.slice(1)}
                  </span>
                  {caption.label && (
                    <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                      {caption.label}
                    </span>
                  )}
                </div>

                {/* Caption text */}
                <div className="flex-1 px-4 pb-3">
                  <p className="text-sm text-foreground leading-relaxed">
                    {truncateText(caption.caption, 140)}
                  </p>
                </div>

                {/* Hashtag count + brand */}
                <div className="px-4 pb-3 flex items-center gap-2">
                  {caption.hashtags.length > 0 && (
                    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                      <Hash className="w-3 h-3" />
                      {caption.hashtags.length} hashtags
                    </span>
                  )}
                  {caption.brand && (
                    <span className="text-xs text-muted-foreground ml-auto">{caption.brand.name}</span>
                  )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between px-4 py-3 border-t bg-muted/30 rounded-b-xl">
                  <span className="text-xs text-muted-foreground">
                    {formatDate(caption.createdAt)}
                  </span>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => handleCopy(caption)}
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-red-400 hover:text-red-500 hover:bg-red-50"
                      onClick={() => handleDelete(caption.id)}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  )
}
