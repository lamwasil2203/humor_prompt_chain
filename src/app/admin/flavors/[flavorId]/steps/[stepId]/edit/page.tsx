import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import StepForm from '@/components/steps/StepForm'

interface Props {
  params: { flavorId: string; stepId: string }
}

export default async function EditStepPage({ params }: Props) {
  const flavorId = Number(params.flavorId)
  const stepId = Number(params.stepId)
  if (isNaN(flavorId) || isNaN(stepId)) notFound()

  const supabase = await createClient()

  const [flavorRes, stepRes, stepTypesRes, modelsRes, inputTypesRes, outputTypesRes] = await Promise.all([
    supabase.from('humor_flavors').select('slug').eq('id', flavorId).single(),
    supabase.from('humor_flavor_steps').select('*').eq('id', stepId).single(),
    supabase.from('humor_flavor_step_types').select('*').order('slug'),
    supabase.from('llm_models').select('*').order('name'),
    supabase.from('llm_input_types').select('*').order('slug'),
    supabase.from('llm_output_types').select('*').order('slug'),
  ])

  if (!flavorRes.data || !stepRes.data) notFound()

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-6">
        <Link href="/admin/flavors" className="hover:text-gray-700 dark:hover:text-gray-300">Humor Flavors</Link>
        <span>/</span>
        <Link href={`/admin/flavors/${flavorId}`} className="hover:text-gray-700 dark:hover:text-gray-300 font-mono">{flavorRes.data.slug}</Link>
        <span>/</span>
        <span className="text-gray-900 dark:text-white font-medium">Edit step {stepRes.data.order_by}</span>
      </div>

      <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Edit step {stepRes.data.order_by}</h1>

      <StepForm
        flavorId={flavorId}
        step={stepRes.data}
        stepTypes={stepTypesRes.data ?? []}
        models={modelsRes.data ?? []}
        inputTypes={inputTypesRes.data ?? []}
        outputTypes={outputTypesRes.data ?? []}
      />
    </div>
  )
}
