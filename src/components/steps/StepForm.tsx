'use client'

import { useState, useTransition, FormEvent } from 'react'
import { createStep, updateStep } from '@/actions/step-actions'
import type { HumorFlavorStep, HumorFlavorStepType, LlmModel, LlmInputType, LlmOutputType } from '@/types/database'
import Link from 'next/link'

interface Props {
  flavorId: number
  step?: HumorFlavorStep
  stepTypes: HumorFlavorStepType[]
  models: LlmModel[]
  inputTypes: LlmInputType[]
  outputTypes: LlmOutputType[]
}

export default function StepForm({ flavorId, step, stepTypes, models, inputTypes, outputTypes }: Props) {
  const isEdit = !!step
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [selectedModelId, setSelectedModelId] = useState<number>(step?.llm_model_id ?? 0)

  const selectedModel = models.find(m => m.id === selectedModelId)
  const showTemp = selectedModel?.is_temperature_supported ?? false

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    const formData = new FormData(e.currentTarget)
    startTransition(async () => {
      const result = isEdit
        ? await updateStep(step!.id, flavorId, formData)
        : await createStep(flavorId, formData)
      if (result?.error) setError(result.error)
    })
  }

  const fieldClass = 'w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent text-sm'
  const labelClass = 'block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'

  return (
    <form onSubmit={handleSubmit} className="space-y-5 max-w-2xl">
      {/* Description */}
      <div>
        <label className={labelClass}>Description</label>
        <input
          name="description"
          type="text"
          defaultValue={step?.description ?? ''}
          placeholder="Optional label for this step"
          className={fieldClass}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Step type */}
        <div>
          <label className={labelClass}>Step type <span className="text-red-500">*</span></label>
          <select name="humor_flavor_step_type_id" required defaultValue={step?.humor_flavor_step_type_id} className={fieldClass}>
            <option value="">Select step type…</option>
            {stepTypes.map(t => (
              <option key={t.id} value={t.id}>{t.slug} — {t.description}</option>
            ))}
          </select>
        </div>

        {/* LLM Model */}
        <div>
          <label className={labelClass}>LLM model <span className="text-red-500">*</span></label>
          <select
            name="llm_model_id"
            required
            defaultValue={step?.llm_model_id}
            onChange={e => setSelectedModelId(Number(e.target.value))}
            className={fieldClass}
          >
            <option value="">Select model…</option>
            {models.map(m => (
              <option key={m.id} value={m.id}>{m.name} ({m.provider_model_id})</option>
            ))}
          </select>
        </div>

        {/* Input type */}
        <div>
          <label className={labelClass}>Input type <span className="text-red-500">*</span></label>
          <select name="llm_input_type_id" required defaultValue={step?.llm_input_type_id} className={fieldClass}>
            <option value="">Select input type…</option>
            {inputTypes.map(t => (
              <option key={t.id} value={t.id}>{t.slug} — {t.description}</option>
            ))}
          </select>
        </div>

        {/* Output type */}
        <div>
          <label className={labelClass}>Output type <span className="text-red-500">*</span></label>
          <select name="llm_output_type_id" required defaultValue={step?.llm_output_type_id} className={fieldClass}>
            <option value="">Select output type…</option>
            {outputTypes.map(t => (
              <option key={t.id} value={t.id}>{t.slug} — {t.description}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Temperature */}
      {showTemp && (
        <div className="max-w-xs">
          <label className={labelClass}>Temperature</label>
          <input
            name="llm_temperature"
            type="number"
            min="0"
            max="2"
            step="0.1"
            defaultValue={step?.llm_temperature ?? 1.0}
            className={fieldClass}
          />
          <p className="mt-1 text-xs text-gray-500">0.0 = deterministic, 2.0 = very creative</p>
        </div>
      )}

      {/* System prompt */}
      <div>
        <label className={labelClass}>System prompt</label>
        <textarea
          name="llm_system_prompt"
          rows={6}
          defaultValue={step?.llm_system_prompt ?? ''}
          placeholder="System instructions for the LLM…"
          className={`${fieldClass} font-mono resize-y`}
        />
      </div>

      {/* User prompt */}
      <div>
        <label className={labelClass}>User prompt</label>
        <textarea
          name="llm_user_prompt"
          rows={6}
          defaultValue={step?.llm_user_prompt ?? ''}
          placeholder="User prompt template. Use {{previous_output}} to reference the output from the previous step…"
          className={`${fieldClass} font-mono resize-y`}
        />
        <p className="mt-1 text-xs text-gray-500">Use <code className="font-mono bg-gray-100 dark:bg-gray-700 px-1 rounded">{"{{previous_output}}"}</code> to reference the previous step&apos;s output</p>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 p-3 text-sm text-red-700 dark:text-red-400">
          {error}
        </div>
      )}

      <div className="flex items-center gap-3 pt-2">
        <button
          type="submit"
          disabled={isPending}
          className="px-5 py-2 bg-sky-600 hover:bg-sky-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-sky-500"
        >
          {isPending ? 'Saving…' : isEdit ? 'Save changes' : 'Add step'}
        </button>
        <Link
          href={`/admin/flavors/${flavorId}`}
          className="px-5 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
        >
          Cancel
        </Link>
      </div>
    </form>
  )
}
