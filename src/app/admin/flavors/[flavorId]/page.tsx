import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import StepList from '@/components/steps/StepList'
import type { HumorFlavorStepWithRelations } from '@/types/database'

interface Props {
  params: { flavorId: string }
}

export default async function FlavorDetailPage({ params }: Props) {
  const id = Number(params.flavorId)
  if (isNaN(id)) notFound()

  const supabase = await createClient()

  const [flavorRes, stepsRes] = await Promise.all([
    supabase.from('humor_flavors').select('*').eq('id', id).single(),
    supabase
      .from('humor_flavor_steps')
      .select(`
        *,
        llm_model:llm_models(id, name, is_temperature_supported, provider_model_id),
        llm_input_type:llm_input_types(id, slug, description),
        llm_output_type:llm_output_types(id, slug, description),
        step_type:humor_flavor_step_types(id, slug, description)
      `)
      .eq('humor_flavor_id', id)
      .order('order_by', { ascending: true }),
  ])

  if (!flavorRes.data) notFound()

  const flavor = flavorRes.data
  const steps = (stepsRes.data ?? []) as HumorFlavorStepWithRelations[]

  return (
    <div>
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-6">
        <Link href="/admin/flavors" className="hover:text-gray-700 dark:hover:text-gray-300">Humor Flavors</Link>
        <span>/</span>
        <span className="text-gray-900 dark:text-white font-mono font-medium">{flavor.slug}</span>
      </div>

      {/* Flavor info */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 mb-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold text-gray-900 dark:text-white font-mono">{flavor.slug}</h1>
              <span className="text-xs text-gray-400">#{flavor.id}</span>
            </div>
            {flavor.description ? (
              <p className="mt-1.5 text-sm text-gray-600 dark:text-gray-400">{flavor.description}</p>
            ) : (
              <p className="mt-1.5 text-sm text-gray-400 italic">No description</p>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Link
              href={`/admin/flavors/${id}/captions`}
              className="px-3 py-1.5 text-xs font-medium rounded-lg text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800 transition-colors"
            >
              View captions
            </Link>
            <Link
              href={`/admin/flavors/${id}/test`}
              className="px-3 py-1.5 text-xs font-medium rounded-lg text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/30 border border-purple-200 dark:border-purple-800 transition-colors"
            >
              Test flavor
            </Link>
            <Link
              href={`/admin/flavors/${id}/edit`}
              className="px-3 py-1.5 text-xs font-medium rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700 transition-colors"
            >
              Edit
            </Link>
          </div>
        </div>
      </div>

      {/* Steps section */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-semibold text-gray-900 dark:text-white">
          Steps <span className="ml-1.5 text-sm font-normal text-gray-400">({steps.length})</span>
        </h2>
        <Link
          href={`/admin/flavors/${id}/steps/new`}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-sky-600 hover:bg-sky-700 text-white text-xs font-medium rounded-lg transition-colors"
        >
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Add step
        </Link>
      </div>

      <StepList steps={steps} flavorId={id} />
    </div>
  )
}
