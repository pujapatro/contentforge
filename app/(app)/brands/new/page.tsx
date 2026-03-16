import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { BrandForm } from '@/components/brand/BrandForm'

export default async function NewBrandPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  return (
    <div className="max-w-2xl mx-auto py-4">
      <div className="mb-8">
        <h2 className="text-2xl font-bold">Create a New Brand</h2>
        <p className="text-muted-foreground text-sm mt-1">
          Set up your brand identity so AI can generate perfectly-tailored content.
        </p>
      </div>
      <BrandForm />
    </div>
  )
}
