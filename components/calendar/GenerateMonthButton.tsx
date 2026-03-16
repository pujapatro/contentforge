'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Sparkles, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog'
import { format } from 'date-fns'
import type { Brand, Post } from '@/types'

interface GenerateMonthButtonProps {
  brand: Brand
  month: string // YYYY-MM
  onGenerated: (posts: Post[]) => void
}

export function GenerateMonthButton({ brand, month, onGenerated }: GenerateMonthButtonProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [postsPerWeek, setPostsPerWeek] = useState(3)

  const monthLabel = format(new Date(month + '-01'), 'MMMM yyyy')

  const handleGenerate = async () => {
    setLoading(true)
    const toastId = toast.loading(`Generating ${monthLabel} calendar…`)
    try {
      const res = await fetch('/api/generate/calendar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brandId: brand.id,
          month,
          postsPerWeek,
          regenerate: true,
        }),
      })
      if (!res.ok) throw new Error('Generation failed')
      const json = await res.json()
      toast.success(`Generated ${json.postsGenerated} posts for ${monthLabel}!`, { id: toastId })
      onGenerated(json.posts)
      setOpen(false)
    } catch {
      toast.error('Failed to generate calendar. Check your Gemini API key.', { id: toastId })
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        className="gap-2 bg-amber-600 hover:bg-amber-700 text-white shadow-sm"
      >
        <Sparkles className="w-4 h-4" />
        Generate {monthLabel}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Generate {monthLabel} Calendar</DialogTitle>
            <DialogDescription>
              This will generate AI-powered posts for{' '}
              <strong>{brand.name}</strong> in <strong>{monthLabel}</strong>.
              Existing draft posts for this month will be replaced.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Posts per week</label>
              <div className="flex items-center gap-3">
                {[2, 3, 4, 5, 7].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setPostsPerWeek(n)}
                    className={`w-10 h-10 rounded-lg border-2 text-sm font-medium transition-colors ${
                      postsPerWeek === n
                        ? 'border-amber-600 bg-amber-50 text-amber-700 dark:bg-amber-900/20'
                        : 'border-border hover:border-amber-300'
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                Total: ~{postsPerWeek * 4} posts across the month
              </p>
            </div>

            <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
              <p className="text-xs text-amber-800 dark:text-amber-200">
                <strong>Platforms:</strong> {brand.platforms.join(', ')}
                <br />
                <strong>Tone:</strong> {brand.tone}
                <br />
                <strong>Pillars:</strong> {brand.contentPillars.slice(0, 3).join(', ')}
                {brand.contentPillars.length > 3 && ` +${brand.contentPillars.length - 3} more`}
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
              Cancel
            </Button>
            <Button onClick={handleGenerate} disabled={loading} className="gap-2">
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4" />
              )}
              {loading ? 'Generating…' : 'Generate Calendar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
