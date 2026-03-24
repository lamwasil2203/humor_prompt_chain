import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import TestFlavorClient from './TestFlavorClient'

interface Props {
  params: { flavorId: string }
}

export default async function TestFlavorPage({ params }: Props) {
  const flavorId = Number(params.flavorId)
  if (isNaN(flavorId)) notFound()

  const supabase = await createClient()

  const [flavorRes, imagesRes] = await Promise.all([
    supabase.from('humor_flavors').select('id, slug, description').eq('id', flavorId).single(),
    supabase
      .from('images')
      .select('id, url, image_description, is_common_use')
      .or('is_public.eq.true,is_common_use.eq.true')
      .order('created_datetime_utc', { ascending: false })
      .limit(50),
  ])

  if (!flavorRes.data) notFound()

  return (
    <div>
      <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-6">
        <Link href="/admin/flavors" className="hover:text-gray-700 dark:hover:text-gray-300">Humor Flavors</Link>
        <span>/</span>
        <Link href={`/admin/flavors/${flavorId}`} className="hover:text-gray-700 dark:hover:text-gray-300 font-mono">{flavorRes.data.slug}</Link>
        <span>/</span>
        <span className="text-gray-900 dark:text-white font-medium">Test</span>
      </div>

      <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
        Test: <span className="font-mono">{flavorRes.data.slug}</span>
      </h1>
      {flavorRes.data.description && (
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">{flavorRes.data.description}</p>
      )}

      <TestFlavorClient
        flavorId={flavorId}
        images={imagesRes.data ?? []}
      />
    </div>
  )
}
