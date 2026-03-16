'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'
import {
  LayoutDashboard,
  Building2,
  CalendarDays,
  BarChart3,
  BookMarked,
  LogOut,
  Zap,
} from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useAppStore } from '@/store/useAppStore'

interface SidebarProps {
  user: {
    name?: string | null
    email: string
    image?: string | null
  }
  firstBrandId?: string | null
}

const navItems = (brandId: string | null) => [
  {
    label: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    label: 'Brands',
    href: '/brands',
    icon: Building2,
  },
  {
    label: 'Calendar',
    href: brandId ? `/calendar/${brandId}` : '/brands',
    icon: CalendarDays,
  },
  {
    label: 'Analytics',
    href: brandId ? `/analytics/${brandId}` : '/brands',
    icon: BarChart3,
  },
  {
    label: 'Library',
    href: '/library',
    icon: BookMarked,
  },
]

export function Sidebar({ user, firstBrandId }: SidebarProps) {
  const pathname = usePathname()
  const { activeBrandId } = useAppStore()
  const brandId = activeBrandId ?? firstBrandId ?? null

  const initials = user.name
    ? user.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : user.email.slice(0, 2).toUpperCase()

  return (
    <aside className="fixed left-0 top-0 z-40 flex h-screen w-60 flex-col bg-[#0F172A] text-slate-100">
      {/* Logo */}
      <div className="flex items-center gap-2 px-6 py-5 border-b border-slate-800">
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-amber-600">
          <Zap className="w-4 h-4 text-white" />
        </div>
        <span className="font-bold text-lg tracking-tight text-white">ContentForge</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems(brandId).map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== '/brands' && pathname.startsWith(item.href.split('/').slice(0, 2).join('/')))
          return (
            <Link
              key={item.label}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'bg-amber-600 text-white'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100'
              )}
            >
              <item.icon className="w-4 h-4 shrink-0" />
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* User */}
      <div className="px-3 py-4 border-t border-slate-800">
        <div className="flex items-center gap-3 px-3 py-2 rounded-lg">
          <Avatar className="w-8 h-8 shrink-0">
            <AvatarImage src={user.image ?? undefined} alt={user.name ?? ''} />
            <AvatarFallback className="bg-amber-600 text-white text-xs">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-100 truncate">{user.name ?? 'User'}</p>
            <p className="text-xs text-slate-400 truncate">{user.email}</p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="w-full mt-1 justify-start gap-3 text-slate-400 hover:text-slate-100 hover:bg-slate-800 px-3"
          onClick={() => signOut({ callbackUrl: '/login' })}
        >
          <LogOut className="w-4 h-4" />
          Sign out
        </Button>
      </div>
    </aside>
  )
}
