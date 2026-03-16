import { redirect, notFound } from 'next/navigation'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { BrandForm } from '@/components/brand/BrandForm'
import type { Brand } from '@/types'

interface EditBrandPageProps {
  params: { id: string }
}

export default async function EditBrandPage({ params }: EditBrandPageProps) {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const brand = await prisma.brand.findUnique({ where: { id: params.id } })

  if (!brand) notFound()
  if (brand.userId !== session.user.id) redirect('/brands')

  return (
    <div className="max-w-2xl mx-auto py-4">
      <div className="mb-8">
        <h2 className="text-2xl font-bold">Edit Brand</h2>
        <p className="text-muted-foreground text-sm mt-1">
          Update your brand settings. Changes will apply to future AI generations.
        </p>
      </div>
      <BrandForm existingBrand={brand as Brand} />
    </div>
  )
}
