'use client'

import Link from 'next/link'
import { Building2, CalendarDays, Users } from 'lucide-react'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { getPlatformColor, capitalizeFirst } from '@/lib/utils'
import type { Brand } from '@/types'

interface BrandCardProps {
  brand: Brand & { _count?: { posts: number } }
}

const platformLabels: Record<string, string> = {
  linkedin: 'LinkedIn',
  twitter: 'Twitter',
  instagram: 'Instagram',
}

export function BrandCard({ brand }: BrandCardProps) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-900/20">
              <Building2 className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground leading-tight">{brand.name}</h3>
              <p className="text-sm text-muted-foreground">{brand.niche}</p>
            </div>
          </div>
          <Badge variant="outline" className="text-xs shrink-0">
            {capitalizeFirst(brand.tone)}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="pb-3 space-y-3">
        <div className="flex items-center gap-1.5 flex-wrap">
          {brand.platforms.map((platform) => (
            <span
              key={platform}
              className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getPlatformColor(platform)}`}
            >
              {platformLabels[platform] ?? platform}
            </span>
          ))}
        </div>

        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <CalendarDays className="w-3.5 h-3.5" />
            <span>{brand._count?.posts ?? 0} posts</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5" />
            <span className="truncate max-w-[140px]">{brand.targetAudience}</span>
          </div>
        </div>

        {brand.contentPillars.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {brand.contentPillars.slice(0, 3).map((pillar) => (
              <span
                key={pillar}
                className="inline-flex items-center px-2 py-0.5 rounded-md text-xs bg-muted text-muted-foreground"
              >
                {pillar}
              </span>
            ))}
            {brand.contentPillars.length > 3 && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs bg-muted text-muted-foreground">
                +{brand.contentPillars.length - 3} more
              </span>
            )}
          </div>
        )}
      </CardContent>

      <CardFooter className="pt-3 gap-2 border-t">
        <Button asChild size="sm" className="flex-1">
          <Link href={`/calendar/${brand.id}`}>
            <CalendarDays className="w-3.5 h-3.5" />
            Open Calendar
          </Link>
        </Button>
        <Button asChild variant="outline" size="sm">
          <Link href={`/brands/${brand.id}`}>Edit</Link>
        </Button>
      </CardFooter>
    </Card>
  )
}
