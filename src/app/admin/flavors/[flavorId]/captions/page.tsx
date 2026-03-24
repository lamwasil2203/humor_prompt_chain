import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/server'

interface Props {
  params: { flavorId: string }
  searchParams: { page?: string }
}

const PAGE_SIZE = 20

export default async function FlavorCaptionsPage({ params, searchParams }: Props) {
  const flavorId = Number(params.flavorId)
  if (isNaN(flavorId)) notFound()

  const page = Math.max(1, Number(searchParams.page ?? 1))
  const offset = (page - 1) * PAGE_SIZE

  const supabase = await createClient()

  const [flavorRes, captionsRes] = await Promise.all([
    supabase.from('humor_flavors').select('slug').eq('id', flavorId).single(),
    supabase
      .from('captions')
      .select(`
        id, content, is_public, like_count, created_datetime_utc,
        image:images(id, url, image_description),
        profile:profiles(first_name, last_name, email)
      `)
      .eq('humor_flavor_id', flavorId)
      .order('created_datetime_utc', { ascending: false })
      .range(offset, offset + PAGE_SIZE - 1),
  ])

  if (!flavorRes.data) notFound()

  const captions = captionsRes.data ?? []
  const hasMore = captions.length === PAGE_SIZE

  return (
    <div>
      <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-6">
        <Link href="/admin/flavors" className="hover:text-gray-700 dark:hover:text-gray-300">Humor Flavors</Link>
        <span>/</span>
        <Link href={`/admin/flavors/${flavorId}`} className="hover:text-gray-700 dark:hover:text-gray-300 font-mono">{flavorRes.data.slug}</Link>
        <span>/</span>
        <span className="text-gray-900 dark:text-white font-medium">Captions</span>
      </div>

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">
          Captions for <span className="font-mono">{flavorRes.data.slug}</span>
        </h1>
        <span className="text-sm text-gray-500 dark:text-gray-400">Page {page}</span>
      </div>

      {captions.length === 0 && (
        <div className="text-center py-16 text-gray-400 dark:text-gray-600 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl">
          <p className="text-sm">No captions generated with this flavor yet.</p>
          <Link href={`/admin/flavors/${flavorId}/test`} className="mt-3 inline-block text-sky-600 hover:underline text-sm">
            Test this flavor to generate some →
          </Link>
        </div>
      )}

      {captions.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {captions.map((caption: Record<string, unknown>) => {
            const image = caption.image as { id: string; url: string | null; image_description: string | null } | null
            const profile = caption.profile as { first_name: string | null; last_name: string | null; email: string | null } | null
            const authorName = profile?.first_name
              ? `${profile.first_name}${profile.last_name ? ` ${profile.last_name}` : ''}`
              : profile?.email ?? 'Unknown'

            return (
              <div key={caption.id as string} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                {image?.url && (
                  <div className="relative aspect-video bg-gray-100 dark:bg-gray-700">
                    <Image
                      src={image.url}
                      alt={image.image_description ?? 'Caption image'}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  </div>
                )}
                <div className="p-4">
                  <p className="text-sm text-gray-900 dark:text-white leading-relaxed">
                    {caption.content as string ?? <span className="italic text-gray-400">No content</span>}
                  </p>
                  <div className="mt-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                        caption.is_public
                          ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                      }`}>
                        {caption.is_public ? 'Public' : 'Private'}
                      </span>
                      <span className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                        <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                        </svg>
                        {caption.like_count as number}
                      </span>
                    </div>
                    <span className="text-xs text-gray-400">{authorName}</span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Pagination */}
      {(page > 1 || hasMore) && (
        <div className="flex items-center justify-center gap-3 mt-8">
          {page > 1 && (
            <Link
              href={`/admin/flavors/${flavorId}/captions?page=${page - 1}`}
              className="px-4 py-2 text-sm font-medium rounded-lg border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              ← Previous
            </Link>
          )}
          {hasMore && (
            <Link
              href={`/admin/flavors/${flavorId}/captions?page=${page + 1}`}
              className="px-4 py-2 text-sm font-medium rounded-lg border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              Next →
            </Link>
          )}
        </div>
      )}
    </div>
  )
}
