'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { X, Copy, BookMarked, Trash2, Hash, Loader2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Slider } from '@/components/ui/slider'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { StreamingCaption } from './StreamingCaption'
import { getPlatformColor, getStatusColor } from '@/lib/utils'
import type { Post, Brand, HashtagSuggestion } from '@/types'

const schema = z.object({
  platform: z.enum(['linkedin', 'twitter', 'instagram']),
  scheduledDate: z.string().min(1),
  scheduledTime: z.string().min(1),
  status: z.enum(['draft', 'scheduled', 'published', 'skipped']),
  caption: z.string().min(1),
  contentPillar: z.string().min(1),
  likes: z.number().optional(),
  comments: z.number().optional(),
  shares: z.number().optional(),
  reach: z.number().optional(),
})

type FormData = z.infer<typeof schema>

interface PostModalProps {
  post: Post | null
  brand: Brand
  defaultDate?: string
  open: boolean
  onClose: () => void
  onSave: (post: Post) => void
  onDelete: (postId: string) => void
}

export function PostModal({ post, brand, defaultDate, open, onClose, onSave, onDelete }: PostModalProps) {
  const isEdit = !!post
  const [hashtags, setHashtags] = useState<string[]>(post?.hashtags ?? [])
  const [hashtagInput, setHashtagInput] = useState('')
  const [tone, setTone] = useState(5)
  const [loadingHashtags, setLoadingHashtags] = useState(false)
  const [hashtagSuggestions, setHashtagSuggestions] = useState<HashtagSuggestion[]>([])
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const { register, handleSubmit, watch, setValue, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      platform: post?.platform ?? 'linkedin',
      scheduledDate: post?.scheduledDate
        ? new Date(post.scheduledDate).toISOString().slice(0, 10)
        : defaultDate ?? new Date().toISOString().slice(0, 10),
      scheduledTime: post?.scheduledTime ?? '09:00',
      status: post?.status ?? 'draft',
      caption: post?.caption ?? '',
      contentPillar: post?.contentPillar ?? (brand.contentPillars[0] ?? ''),
      likes: post?.analytics?.likes ?? 0,
      comments: post?.analytics?.comments ?? 0,
      shares: post?.analytics?.shares ?? 0,
      reach: post?.analytics?.reach ?? 0,
    },
  })

  const watchedPlatform = watch('platform')
  const watchedCaption = watch('caption')
  const watchedStatus = watch('status')

  useEffect(() => {
    if (open) {
      reset({
        platform: post?.platform ?? 'linkedin',
        scheduledDate: post?.scheduledDate
          ? new Date(post.scheduledDate).toISOString().slice(0, 10)
          : defaultDate ?? new Date().toISOString().slice(0, 10),
        scheduledTime: post?.scheduledTime ?? '09:00',
        status: post?.status ?? 'draft',
        caption: post?.caption ?? '',
        contentPillar: post?.contentPillar ?? (brand.contentPillars[0] ?? ''),
        likes: post?.analytics?.likes ?? 0,
        comments: post?.analytics?.comments ?? 0,
        shares: post?.analytics?.shares ?? 0,
        reach: post?.analytics?.reach ?? 0,
      })
      setHashtags(post?.hashtags ?? [])
      setHashtagSuggestions([])
    }
  }, [open, post, defaultDate, brand.contentPillars, reset])

  const onSubmit = async (data: FormData) => {
    setSaving(true)
    try {
      const payload: Record<string, unknown> = {
        platform: data.platform,
        scheduledDate: data.scheduledDate,
        scheduledTime: data.scheduledTime,
        status: data.status,
        caption: data.caption,
        hashtags,
        contentPillar: data.contentPillar,
      }

      if (data.status === 'published' || post?.analytics) {
        payload.analytics = {
          likes: data.likes ?? 0,
          comments: data.comments ?? 0,
          shares: data.shares ?? 0,
          reach: data.reach ?? 0,
        }
      }

      let res: Response
      if (isEdit && post) {
        res = await fetch(`/api/posts/${post.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
      } else {
        res = await fetch('/api/posts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...payload, brandId: brand.id }),
        })
      }

      if (!res.ok) throw new Error('Failed to save post')
      const json = await res.json()
      toast.success(isEdit ? 'Post updated!' : 'Post created!')
      onSave(json.post)
      onClose()
    } catch {
      toast.error('Failed to save post')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!post) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/posts/${post.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      toast.success('Post deleted')
      onDelete(post.id)
      onClose()
    } catch {
      toast.error('Failed to delete post')
    } finally {
      setDeleting(false)
    }
  }

  const handleSaveToLibrary = async () => {
    try {
      const res = await fetch('/api/library', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brandId: brand.id,
          platform: watchedPlatform,
          caption: watchedCaption,
          hashtags,
        }),
      })
      if (!res.ok) throw new Error()
      toast.success('Saved to library!')
    } catch {
      toast.error('Failed to save to library')
    }
  }

  const handleCopy = () => {
    const text = watchedCaption + (hashtags.length > 0 ? '\n\n' + hashtags.map((h) => `#${h}`).join(' ') : '')
    navigator.clipboard.writeText(text)
    toast.success('Copied to clipboard!')
  }

  const refreshHashtags = async () => {
    setLoadingHashtags(true)
    try {
      const res = await fetch('/api/generate/hashtags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          caption: watchedCaption,
          platform: watchedPlatform,
          niche: brand.niche,
        }),
      })
      if (!res.ok) throw new Error()
      const json = await res.json()
      setHashtagSuggestions(json.hashtags)
    } catch {
      toast.error('Failed to generate hashtags')
    } finally {
      setLoadingHashtags(false)
    }
  }

  const addHashtag = (tag: string) => {
    const clean = tag.replace(/^#/, '')
    if (clean && !hashtags.includes(clean)) {
      setHashtags([...hashtags, clean])
    }
  }

  const removeHashtag = (tag: string) => {
    setHashtags(hashtags.filter((h) => h !== tag))
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Post' : 'New Post'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {/* Row 1: Platform + Date + Time + Status */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Platform</Label>
              <Select value={watchedPlatform} onValueChange={(v) => setValue('platform', v as 'linkedin' | 'twitter' | 'instagram')}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {brand.platforms.map((p) => (
                    <SelectItem key={p} value={p}>
                      <span className={`inline-flex items-center gap-2`}>
                        <span className={`w-2 h-2 rounded-full ${getPlatformColor(p).split(' ')[0]}`} />
                        {p.charAt(0).toUpperCase() + p.slice(1)}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select value={watchedStatus} onValueChange={(v) => setValue('status', v as FormData['status'])}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {['draft', 'scheduled', 'published', 'skipped'].map((s) => (
                    <SelectItem key={s} value={s}>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs ${getStatusColor(s)}`}>
                        {s.charAt(0).toUpperCase() + s.slice(1)}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Date</Label>
              <Input type="date" {...register('scheduledDate')} />
              {errors.scheduledDate && <p className="text-xs text-red-500">{errors.scheduledDate.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Time</Label>
              <Input type="time" {...register('scheduledTime')} />
            </div>
          </div>

          {/* Content Pillar */}
          <div className="space-y-1.5">
            <Label>Content Pillar</Label>
            <Select
              value={watch('contentPillar')}
              onValueChange={(v) => setValue('contentPillar', v)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {brand.contentPillars.map((p) => (
                  <SelectItem key={p} value={p}>{p}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Caption */}
          <div className="space-y-1.5">
            <Label>Caption</Label>
            <Textarea rows={5} {...register('caption')} className="resize-none" />
            {errors.caption && <p className="text-xs text-red-500">{errors.caption.message}</p>}
          </div>

          {/* Tone slider */}
          {isEdit && post && (
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Formal</span>
                <span>Tone: {tone}/10</span>
                <span>Casual</span>
              </div>
              <Slider
                min={0}
                max={10}
                step={1}
                value={[tone]}
                onValueChange={([v]) => setTone(v)}
              />
            </div>
          )}

          {/* Streaming caption regeneration */}
          {isEdit && post && (
            <StreamingCaption
              postId={post.id}
              tone={tone}
              onComplete={(caption) => setValue('caption', caption)}
            />
          )}

          {/* Hashtags */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Hashtags</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-1.5 h-7 text-xs"
                onClick={refreshHashtags}
                disabled={loadingHashtags}
              >
                {loadingHashtags ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <Hash className="w-3 h-3" />
                )}
                AI Hashtags
              </Button>
            </div>

            <div className="flex gap-2">
              <Input
                placeholder="Add hashtag..."
                value={hashtagInput}
                onChange={(e) => setHashtagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    addHashtag(hashtagInput)
                    setHashtagInput('')
                  }
                }}
              />
            </div>

            <div className="flex flex-wrap gap-1.5">
              <AnimatePresence>
                {hashtags.map((tag) => (
                  <motion.span
                    key={tag}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-muted text-muted-foreground"
                  >
                    #{tag}
                    <button type="button" onClick={() => removeHashtag(tag)}>
                      <X className="w-3 h-3" />
                    </button>
                  </motion.span>
                ))}
              </AnimatePresence>
            </div>

            {hashtagSuggestions.length > 0 && (
              <div className="p-3 rounded-lg bg-muted space-y-2">
                <p className="text-xs font-medium text-muted-foreground">Suggestions (click to add):</p>
                <div className="flex flex-wrap gap-1.5">
                  {hashtagSuggestions.map((s) => (
                    <button
                      key={s.tag}
                      type="button"
                      onClick={() => addHashtag(s.tag)}
                      disabled={hashtags.includes(s.tag)}
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border transition-colors ${
                        hashtags.includes(s.tag)
                          ? 'opacity-40 cursor-not-allowed'
                          : 'hover:border-amber-600 hover:text-amber-600 cursor-pointer'
                      } ${
                        s.estimatedReach === 'high'
                          ? 'border-green-400 text-green-700'
                          : s.estimatedReach === 'medium'
                          ? 'border-yellow-400 text-yellow-700'
                          : 'border-gray-300 text-gray-600'
                      }`}
                    >
                      #{s.tag}
                      <span className="text-[10px] opacity-70">
                        {s.estimatedReach === 'high' ? '🔥' : s.estimatedReach === 'medium' ? '⚡' : '•'}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Analytics (show if published or has analytics) */}
          {(watchedStatus === 'published' || post?.analytics) && (
            <div className="space-y-3 p-4 rounded-xl bg-muted">
              <p className="text-sm font-medium">Analytics</p>
              <div className="grid grid-cols-4 gap-3">
                {(['likes', 'comments', 'shares', 'reach'] as const).map((field) => (
                  <div key={field} className="space-y-1">
                    <Label className="text-xs capitalize">{field}</Label>
                    <Input
                      type="number"
                      min={0}
                      className="h-8 text-sm"
                      {...register(field, { valueAsNumber: true })}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          <DialogFooter className="flex flex-col sm:flex-row gap-2 pt-2">
            <div className="flex gap-2 mr-auto">
              <Button type="button" variant="outline" size="sm" onClick={handleSaveToLibrary}>
                <BookMarked className="w-3.5 h-3.5" />
                Save to Library
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={handleCopy}>
                <Copy className="w-3.5 h-3.5" />
                Copy
              </Button>
              {isEdit && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="text-red-500 hover:text-red-600 border-red-200 hover:bg-red-50"
                  onClick={handleDelete}
                  disabled={deleting}
                >
                  {deleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                </Button>
              )}
            </div>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={saving}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {isEdit ? 'Save Changes' : 'Create Post'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
