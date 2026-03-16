'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { X, Plus, ChevronRight, ChevronLeft, Check } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import type { Brand } from '@/types'

const schema = z.object({
  name: z.string().min(1, 'Brand name is required'),
  niche: z.string().min(1, 'Niche is required'),
  targetAudience: z.string().min(1, 'Target audience is required'),
  tone: z.enum(['professional', 'casual', 'witty', 'inspirational']),
  platforms: z.array(z.enum(['linkedin', 'twitter', 'instagram'])).min(1, 'Select at least one platform'),
  contentPillars: z.array(z.string()).min(1, 'Add at least one content pillar'),
  competitorHandles: z.array(z.string()),
})

type FormData = z.infer<typeof schema>

const TONES = [
  { value: 'professional', label: 'Professional', desc: 'Formal, authoritative, data-driven' },
  { value: 'casual', label: 'Casual', desc: 'Friendly, conversational, approachable' },
  { value: 'witty', label: 'Witty', desc: 'Clever, humorous, entertaining' },
  { value: 'inspirational', label: 'Inspirational', desc: 'Motivating, uplifting, aspirational' },
] as const

const PLATFORMS = [
  { value: 'linkedin', label: 'LinkedIn', color: 'bg-blue-600' },
  { value: 'twitter', label: 'Twitter / X', color: 'bg-sky-500' },
  { value: 'instagram', label: 'Instagram', color: 'bg-pink-600' },
] as const

const SUGGESTED_PILLARS = [
  'Tips & Tricks', 'Case Studies', 'Behind the Scenes', 'Product Updates',
  'Industry News', 'Customer Stories',
]

const STEPS = ['Brand Identity', 'Voice & Platforms', 'Content Strategy']

interface BrandFormProps {
  existingBrand?: Brand
}

export function BrandForm({ existingBrand }: BrandFormProps) {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [pillarInput, setPillarInput] = useState('')
  const [competitorInput, setCompetitorInput] = useState('')

  const { register, handleSubmit, watch, setValue, getValues, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: existingBrand
      ? {
          name: existingBrand.name,
          niche: existingBrand.niche,
          targetAudience: existingBrand.targetAudience,
          tone: existingBrand.tone,
          platforms: existingBrand.platforms,
          contentPillars: existingBrand.contentPillars,
          competitorHandles: existingBrand.competitorHandles,
        }
      : {
          tone: 'professional',
          platforms: [],
          contentPillars: [],
          competitorHandles: [],
        },
  })

  const watchedTone = watch('tone')
  const watchedPlatforms = watch('platforms')
  const watchedPillars = watch('contentPillars')
  const watchedHandles = watch('competitorHandles')

  const togglePlatform = (p: 'linkedin' | 'twitter' | 'instagram') => {
    const current = getValues('platforms')
    if (current.includes(p)) {
      setValue('platforms', current.filter((x) => x !== p))
    } else {
      setValue('platforms', [...current, p])
    }
  }

  const addPillar = (pillar: string) => {
    const trimmed = pillar.trim()
    if (!trimmed) return
    const current = getValues('contentPillars')
    if (!current.includes(trimmed)) {
      setValue('contentPillars', [...current, trimmed])
    }
    setPillarInput('')
  }

  const removePillar = (pillar: string) => {
    setValue('contentPillars', getValues('contentPillars').filter((p) => p !== pillar))
  }

  const addHandle = (handle: string) => {
    const trimmed = handle.trim().replace(/^@/, '')
    if (!trimmed) return
    const current = getValues('competitorHandles')
    if (!current.includes(trimmed)) {
      setValue('competitorHandles', [...current, trimmed])
    }
    setCompetitorInput('')
  }

  const removeHandle = (handle: string) => {
    setValue('competitorHandles', getValues('competitorHandles').filter((h) => h !== handle))
  }

  const onSubmit = async (data: FormData) => {
    setLoading(true)
    try {
      const url = existingBrand ? `/api/brands/${existingBrand.id}` : '/api/brands'
      const method = existingBrand ? 'PATCH' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error('Failed to save brand')
      const json = await res.json()
      toast.success(existingBrand ? 'Brand updated!' : 'Brand created!')
      router.push(`/calendar/${json.brand.id}`)
    } catch {
      toast.error('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const goNext = () => setStep((s) => Math.min(s + 1, 2))
  const goPrev = () => setStep((s) => Math.max(s - 1, 0))

  return (
    <div className="max-w-2xl mx-auto">
      {/* Progress */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          {STEPS.map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div
                className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors',
                  i < step
                    ? 'bg-amber-600 text-white'
                    : i === step
                    ? 'bg-amber-600 text-white'
                    : 'bg-muted text-muted-foreground'
                )}
              >
                {i < step ? <Check className="w-4 h-4" /> : i + 1}
              </div>
              <span
                className={cn(
                  'text-sm font-medium hidden sm:block',
                  i === step ? 'text-foreground' : 'text-muted-foreground'
                )}
              >
                {s}
              </span>
              {i < STEPS.length - 1 && (
                <div
                  className={cn(
                    'flex-1 h-0.5 w-16 mx-2',
                    i < step ? 'bg-amber-600' : 'bg-muted'
                  )}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <AnimatePresence mode="wait">
          {step === 0 && (
            <motion.div
              key="step0"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-5"
            >
              <div className="space-y-2">
                <Label htmlFor="name">Brand Name</Label>
                <Input id="name" placeholder="e.g. Acme Corp" {...register('name')} />
                {errors.name && <p className="text-sm text-red-500">{errors.name.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="niche">Niche</Label>
                <Input
                  id="niche"
                  placeholder="e.g. fitness coaching, SaaS startup, food blog"
                  {...register('niche')}
                />
                {errors.niche && <p className="text-sm text-red-500">{errors.niche.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="targetAudience">Target Audience</Label>
                <Textarea
                  id="targetAudience"
                  rows={3}
                  placeholder="Describe your ideal customer or follower in detail..."
                  {...register('targetAudience')}
                />
                {errors.targetAudience && (
                  <p className="text-sm text-red-500">{errors.targetAudience.message}</p>
                )}
              </div>
            </motion.div>
          )}

          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="space-y-3">
                <Label>Brand Tone</Label>
                <div className="grid grid-cols-2 gap-3">
                  {TONES.map((t) => (
                    <button
                      key={t.value}
                      type="button"
                      onClick={() => setValue('tone', t.value)}
                      className={cn(
                        'p-4 rounded-xl border-2 text-left transition-all',
                        watchedTone === t.value
                          ? 'border-amber-600 bg-amber-50 dark:bg-amber-900/20'
                          : 'border-border hover:border-amber-300'
                      )}
                    >
                      <p className="font-medium text-sm">{t.label}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{t.desc}</p>
                    </button>
                  ))}
                </div>
                {errors.tone && <p className="text-sm text-red-500">{errors.tone.message}</p>}
              </div>

              <div className="space-y-3">
                <Label>Platforms</Label>
                <div className="grid grid-cols-3 gap-3">
                  {PLATFORMS.map((p) => (
                    <button
                      key={p.value}
                      type="button"
                      onClick={() => togglePlatform(p.value)}
                      className={cn(
                        'p-3 rounded-xl border-2 text-center transition-all',
                        watchedPlatforms.includes(p.value)
                          ? 'border-amber-600 bg-amber-50 dark:bg-amber-900/20'
                          : 'border-border hover:border-amber-300'
                      )}
                    >
                      <div className={cn('w-6 h-6 rounded-full mx-auto mb-2', p.color)} />
                      <p className="text-xs font-medium">{p.label}</p>
                      {watchedPlatforms.includes(p.value) && (
                        <Check className="w-3 h-3 text-amber-600 mx-auto mt-1" />
                      )}
                    </button>
                  ))}
                </div>
                {errors.platforms && (
                  <p className="text-sm text-red-500">{errors.platforms.message}</p>
                )}
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="space-y-3">
                <Label>Content Pillars</Label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {SUGGESTED_PILLARS.map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => addPillar(p)}
                      disabled={watchedPillars.includes(p)}
                      className={cn(
                        'px-3 py-1 rounded-full text-xs border transition-colors',
                        watchedPillars.includes(p)
                          ? 'bg-amber-600 text-white border-amber-600'
                          : 'border-border hover:border-amber-600 hover:text-amber-600'
                      )}
                    >
                      {p}
                    </button>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    placeholder="Add custom pillar..."
                    value={pillarInput}
                    onChange={(e) => setPillarInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        addPillar(pillarInput)
                      }
                    }}
                  />
                  <Button type="button" variant="outline" size="icon" onClick={() => addPillar(pillarInput)}>
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {watchedPillars.map((p) => (
                    <span
                      key={p}
                      className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-200"
                    >
                      {p}
                      <button type="button" onClick={() => removePillar(p)}>
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
                {errors.contentPillars && (
                  <p className="text-sm text-red-500">{errors.contentPillars.message}</p>
                )}
              </div>

              <div className="space-y-3">
                <Label>Competitor Handles <span className="text-muted-foreground font-normal">(optional)</span></Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="@handle"
                    value={competitorInput}
                    onChange={(e) => setCompetitorInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        addHandle(competitorInput)
                      }
                    }}
                  />
                  <Button type="button" variant="outline" size="icon" onClick={() => addHandle(competitorInput)}>
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {watchedHandles.map((h) => (
                    <span
                      key={h}
                      className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-muted text-muted-foreground"
                    >
                      @{h}
                      <button type="button" onClick={() => removeHandle(h)}>
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex justify-between mt-8">
          <Button type="button" variant="outline" onClick={goPrev} disabled={step === 0}>
            <ChevronLeft className="w-4 h-4" />
            Back
          </Button>
          {step < 2 ? (
            <Button type="button" onClick={goNext}>
              Next
              <ChevronRight className="w-4 h-4" />
            </Button>
          ) : (
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving…' : existingBrand ? 'Update Brand' : 'Create Brand'}
            </Button>
          )}
        </div>
      </form>
    </div>
  )
}
