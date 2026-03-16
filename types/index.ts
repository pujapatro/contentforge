export type Platform = 'linkedin' | 'twitter' | 'instagram'
export type Tone = 'professional' | 'casual' | 'witty' | 'inspirational'
export type PostStatus = 'draft' | 'scheduled' | 'published' | 'skipped'
export type GenerationJobStatus = 'pending' | 'running' | 'done' | 'failed'

export interface User {
  id: string
  email: string
  name: string | null
  image: string | null
  plan: string
  createdAt: Date
  updatedAt: Date
}

export interface Brand {
  id: string
  userId: string
  name: string
  niche: string
  targetAudience: string
  tone: Tone
  platforms: Platform[]
  contentPillars: string[]
  competitorHandles: string[]
  createdAt: Date
  updatedAt: Date
  _count?: {
    posts: number
  }
}

export interface PostAnalytic {
  id: string
  postId: string
  likes: number
  comments: number
  shares: number
  reach: number
  loggedAt: Date
}

export interface Post {
  id: string
  brandId: string
  userId: string
  platform: Platform
  scheduledDate: Date | string
  scheduledTime: string
  caption: string
  hashtags: string[]
  contentPillar: string
  status: PostStatus
  aiGenerated: boolean
  regenerationCount: number
  createdAt: Date
  updatedAt: Date
  brand?: Brand
  analytics?: PostAnalytic | null
}

export interface GenerationJob {
  id: string
  brandId: string
  month: Date
  status: GenerationJobStatus
  postsGenerated: number
  errorMessage: string | null
  createdAt: Date
}

export interface SavedCaption {
  id: string
  userId: string
  brandId: string
  platform: Platform
  caption: string
  hashtags: string[]
  label: string | null
  createdAt: Date
  brand?: Brand
}

export interface AnalyticsData {
  postsByStatus: {
    draft: number
    scheduled: number
    published: number
    skipped: number
  }
  postsByPlatform: Array<{ platform: string; count: number }>
  postsByPillar: Array<{ pillar: string; count: number }>
  publishedThisPeriod: number
  completionRate: number
  topPerformingPost: Post | null
  engagementByPlatform: Array<{
    platform: string
    avgLikes: number
    avgComments: number
    avgShares: number
  }>
}

export interface HashtagSuggestion {
  tag: string
  estimatedReach: 'high' | 'medium' | 'low'
}

export interface GenerateCalendarResponse {
  posts: Post[]
  jobId: string
  postsGenerated: number
}

export interface CalendarPost {
  id: string
  title: string
  start: string
  backgroundColor: string
  borderColor: string
  textColor: string
  extendedProps: {
    post: Post
  }
}
