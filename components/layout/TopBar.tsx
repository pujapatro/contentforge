'use client'

import { usePathname, useRouter } from 'next/navigation'
import { ThemeToggle } from './ThemeToggle'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useAppStore } from '@/store/useAppStore'
import type { Brand } from '@/types'

interface TopBarProps {
  brands: Brand[]
  pageTitle: string
}

function getPageTitle(pathname: string): string {
  if (pathname.startsWith('/dashboard')) return 'Dashboard'
  if (pathname.startsWith('/brands/new')) return 'New Brand'
  if (pathname.match(/\/brands\/[^/]+$/) && !pathname.includes('new')) return 'Edit Brand'
  if (pathname.startsWith('/brands')) return 'Brands'
  if (pathname.startsWith('/calendar')) return 'Content Calendar'
  if (pathname.startsWith('/analytics')) return 'Analytics'
  if (pathname.startsWith('/library')) return 'Caption Library'
  return 'ContentForge'
}

export function TopBar({ brands, pageTitle }: TopBarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { activeBrandId, setActiveBrand } = useAppStore()

  const title = pageTitle || getPageTitle(pathname)

  const handleBrandChange = (brandId: string) => {
    setActiveBrand(brandId)
    if (pathname.startsWith('/calendar')) {
      router.push(`/calendar/${brandId}`)
    } else if (pathname.startsWith('/analytics')) {
      router.push(`/analytics/${brandId}`)
    }
  }

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-6 bg-background border-b border-border">
      <h1 className="text-lg font-semibold text-foreground">{title}</h1>

      <div className="flex items-center gap-3">
        {brands.length > 0 && (
          <Select
            value={activeBrandId ?? brands[0]?.id}
            onValueChange={handleBrandChange}
          >
            <SelectTrigger className="w-44 h-9 text-sm">
              <SelectValue placeholder="Select brand" />
            </SelectTrigger>
            <SelectContent>
              {brands.map((brand) => (
                <SelectItem key={brand.id} value={brand.id}>
                  {brand.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        <ThemeToggle />
      </div>
    </header>
  )
}
