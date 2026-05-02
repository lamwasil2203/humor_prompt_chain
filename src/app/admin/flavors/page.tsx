import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import FlavorDeleteButton from '@/components/flavors/FlavorDeleteButton'
import FlavorDuplicateButton from '@/components/flavors/FlavorDuplicateButton'

export default async function FlavorsPage() {
  const supabase = await createClient()

  const { data: flavors, error } = await supabase
    .from('humor_flavors')
    .select('id, slug, description, created_datetime_utc')
    .order('slug', { ascending: true })

  // Step counts
  const { data: stepCounts } = await supabase
    .from('humor_flavor_steps')
    .select('humor_flavor_id')

  const countMap: Record<number, number> = {}
  stepCounts?.forEach(s => {
    countMap[s.humor_flavor_id] = (countMap[s.humor_flavor_id] ?? 0) + 1
  })

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Humor Flavors</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            {flavors?.length ?? 0} flavor{flavors?.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Link
          href="/admin/flavors/new"
          className="flex items-center gap-2 px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white text-sm font-medium rounded-lg transition-colors"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          New flavor
        </Link>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 p-4 text-sm text-red-700 dark:text-red-400 mb-4">
          Error loading flavors: {error.message}
        </div>
      )}

      {flavors && flavors.length === 0 && (
        <div className="text-center py-16 text-gray-400 dark:text-gray-600 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl">
          <p className="text-sm mb-3">No humor flavors yet.</p>
          <Link href="/admin/flavors/new" className="text-sky-600 hover:underline text-sm">
            Create your first flavor →
          </Link>
        </div>
      )}

      {flavors && flavors.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Slug</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden md:table-cell">Description</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Steps</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {flavors.map(flavor => (
                <tr key={flavor.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                  <td className="px-4 py-3">
                    <Link href={`/admin/flavors/${flavor.id}`} className="font-mono font-medium text-sky-600 dark:text-sky-400 hover:underline">
                      {flavor.slug}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-400 hidden md:table-cell max-w-xs">
                    <span className="line-clamp-1">{flavor.description ?? <span className="italic text-gray-400">—</span>}</span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400">
                      {countMap[flavor.id] ?? 0}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1.5 flex-wrap">
                      <Link
                        href={`/admin/flavors/${flavor.id}`}
                        className="px-2.5 py-1 text-xs font-medium rounded text-sky-600 dark:text-sky-400 hover:bg-sky-50 dark:hover:bg-sky-900/30 transition-colors"
                      >
                        Steps
                      </Link>
                      <Link
                        href={`/admin/flavors/${flavor.id}/edit`}
                        className="px-2.5 py-1 text-xs font-medium rounded text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                      >
                        Edit
                      </Link>
                      <Link
                        href={`/admin/flavors/${flavor.id}/captions`}
                        className="px-2.5 py-1 text-xs font-medium rounded text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 transition-colors"
                      >
                        Captions
                      </Link>
                      <Link
                        href={`/admin/flavors/${flavor.id}/test`}
                        className="px-2.5 py-1 text-xs font-medium rounded text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/30 transition-colors"
                      >
                        Test
                      </Link>
                      <FlavorDuplicateButton id={flavor.id} />
                      <FlavorDeleteButton id={flavor.id} slug={flavor.slug} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
