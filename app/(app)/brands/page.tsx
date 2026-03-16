import { redirect } from 'next/navigation'
import Link from 'next/link'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Plus, Building2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { BrandCard } from '@/components/brand/BrandCard'

export default async function BrandsPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const brands = await prisma.brand.findMany({
    where: { userId: session.user.id },
    include: {
      _count: { select: { posts: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Brands</h2>
          <p className="text-muted-foreground text-sm mt-1">
            {brands.length === 0
              ? 'Create your first brand to get started'
              : `${brands.length} brand${brands.length !== 1 ? 's' : ''}`}
          </p>
        </div>
        <Button asChild>
          <Link href="/brands/new">
            <Plus className="w-4 h-4" />
            New Brand
          </Link>
        </Button>
      </div>

      {brands.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-20 h-20 rounded-2xl bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center mb-6">
            <Building2 className="w-10 h-10 text-amber-600" />
          </div>
          <h3 className="text-xl font-semibold mb-2">No brands yet</h3>
          <p className="text-muted-foreground text-sm max-w-sm mb-8">
            Create your first brand to start generating AI-powered content calendars
            tailored to your audience and voice.
          </p>
          <Button asChild size="lg">
            <Link href="/brands/new">
              <Plus className="w-4 h-4" />
              Create your first brand
            </Link>
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
          {brands.map((brand) => (
            // @ts-expect-error – Prisma _count shape is compatible
            <BrandCard key={brand.id} brand={brand} />
          ))}
        </div>
      )}
    </div>
  )
}
