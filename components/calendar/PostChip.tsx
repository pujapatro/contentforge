import { getPlatformBgColor } from '@/lib/utils'
import type { Post } from '@/types'

interface PostChipProps {
  post: Post
}

const PLATFORM_ICONS: Record<string, string> = {
  linkedin: 'in',
  twitter: 'X',
  instagram: '📸',
}

export function PostChip({ post }: PostChipProps) {
  const bg = getPlatformBgColor(post.platform)
  const icon = PLATFORM_ICONS[post.platform] ?? '•'
  const preview = post.caption.slice(0, 28) + (post.caption.length > 28 ? '…' : '')

  return (
    <div
      className="flex items-center gap-1 px-1.5 py-0.5 rounded text-white text-xs leading-tight truncate"
      style={{ backgroundColor: bg }}
    >
      <span className="font-bold shrink-0 text-[10px]">{icon}</span>
      <span className="truncate">{preview}</span>
    </div>
  )
}
