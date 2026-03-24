import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import FlavorForm from '@/components/flavors/FlavorForm'

interface Props {
  params: { flavorId: string }
}

export default async function EditFlavorPage({ params }: Props) {
  const id = Number(params.flavorId)
  if (isNaN(id)) notFound()

  const supabase = await createClient()
  const { data: flavor } = await supabase
    .from('humor_flavors')
    .select('*')
    .eq('id', id)
    .single()

  if (!flavor) notFound()

  return (
    <div className="max-w-xl">
      <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-6">
        <Link href="/admin/flavors" className="hover:text-gray-700 dark:hover:text-gray-300">Humor Flavors</Link>
        <span>/</span>
        <Link href={`/admin/flavors/${id}`} className="hover:text-gray-700 dark:hover:text-gray-300 font-mono">{flavor.slug}</Link>
        <span>/</span>
        <span className="text-gray-900 dark:text-white font-medium">Edit</span>
      </div>

      <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Edit humor flavor</h1>
      <FlavorForm flavor={flavor} />
    </div>
  )
}
