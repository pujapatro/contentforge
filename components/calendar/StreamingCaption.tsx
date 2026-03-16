'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { RefreshCw } from 'lucide-react'

interface StreamingCaptionProps {
  postId: string
  tone: number
  instruction?: string
  onComplete: (caption: string) => void
}

export function StreamingCaption({ postId, tone, instruction, onComplete }: StreamingCaptionProps) {
  const [streaming, setStreaming] = useState(false)
  const [streamedText, setStreamedText] = useState('')
  const abortRef = useRef<AbortController | null>(null)

  const startStream = async () => {
    if (streaming) {
      abortRef.current?.abort()
      return
    }

    setStreaming(true)
    setStreamedText('')
    abortRef.current = new AbortController()

    try {
      const res = await fetch('/api/generate/caption', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId, tone, instruction }),
        signal: abortRef.current.signal,
      })

      if (!res.ok || !res.body) throw new Error('Stream failed')

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let full = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value, { stream: true })
        full += chunk
        setStreamedText(full)
      }

      onComplete(full)
    } catch (err: unknown) {
      if (err instanceof Error && err.name !== 'AbortError') {
        console.error('Streaming error:', err)
      }
    } finally {
      setStreaming(false)
    }
  }

  return (
    <div className="space-y-2">
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={startStream}
        className="gap-2"
        disabled={false}
      >
        <RefreshCw className={`w-3.5 h-3.5 ${streaming ? 'animate-spin' : ''}`} />
        {streaming ? 'Streaming…' : 'Regenerate Caption'}
      </Button>

      {streamedText && (
        <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 text-sm text-foreground whitespace-pre-wrap">
          {streamedText}
          {streaming && <span className="inline-block w-0.5 h-4 bg-amber-600 animate-pulse ml-0.5 align-middle" />}
        </div>
      )}
    </div>
  )
}
