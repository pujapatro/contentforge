import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import type { Platform, PostStatus } from '@/types'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getPlatformColor(platform: Platform | string): string {
  switch (platform) {
    case 'linkedin':
      return 'bg-blue-600 text-white'
    case 'twitter':
      return 'bg-sky-500 text-white'
    case 'instagram':
      return 'bg-pink-600 text-white'
    default:
      return 'bg-gray-500 text-white'
  }
}

export function getPlatformBgColor(platform: Platform | string): string {
  switch (platform) {
    case 'linkedin':
      return '#2563EB'
    case 'twitter':
      return '#0EA5E9'
    case 'instagram':
      return '#DB2777'
    default:
      return '#6B7280'
  }
}

export function getStatusColor(status: PostStatus | string): string {
  switch (status) {
    case 'draft':
      return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
    case 'scheduled':
      return 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
    case 'published':
      return 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
    case 'skipped':
      return 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
    default:
      return 'bg-gray-100 text-gray-700'
  }
}

export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength) + '...'
}

export function capitalizeFirst(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1)
}

export function getMonthString(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

export function parseMonthString(month: string): Date {
  const [year, mon] = month.split('-').map(Number)
  return new Date(year, mon - 1, 1)
}
