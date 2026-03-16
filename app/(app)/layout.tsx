import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Sidebar } from '@/components/layout/Sidebar'
import { TopBar } from '@/components/layout/TopBar'
import type { Brand } from '@/types'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()

  if (!session?.user?.id) {
    redirect('/login')
  }

  const brands = await prisma.brand.findMany({
    where: { userId: session.user.id },
    select: {
      id: true,
      userId: true,
      name: true,
      niche: true,
      targetAudience: true,
      tone: true,
      platforms: true,
      contentPillars: true,
      competitorHandles: true,
      createdAt: true,
      updatedAt: true,
    },
    orderBy: { createdAt: 'asc' },
  })

  const firstBrandId = brands[0]?.id ?? null

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar
        user={{
          name: session.user.name,
          email: session.user.email,
          image: session.user.image,
        }}
        firstBrandId={firstBrandId}
      />

      <div className="flex-1 flex flex-col ml-60">
        <TopBar brands={brands as Brand[]} pageTitle="" />
        <main className="flex-1 p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
