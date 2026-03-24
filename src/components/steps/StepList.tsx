import Link from 'next/link'
import type { HumorFlavorStepWithRelations } from '@/types/database'
import StepReorderButtons from './StepReorderButtons'
import StepDeleteButton from './StepDeleteButton'

interface Props {
  steps: HumorFlavorStepWithRelations[]
  flavorId: number
}

export default function StepList({ steps, flavorId }: Props) {
  if (steps.length === 0) {
    return (
      <div className="text-center py-12 text-gray-400 dark:text-gray-600 text-sm border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl">
        No steps yet. Add the first step to get started.
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {steps.map((step, idx) => (
        <div
          key={step.id}
          className="flex items-start gap-3 p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700"
        >
          {/* Reorder */}
          <StepReorderButtons
            stepId={step.id}
            flavorId={flavorId}
            isFirst={idx === 0}
            isLast={idx === steps.length - 1}
          />

          {/* Step number */}
          <div className="flex-shrink-0 w-7 h-7 rounded-full bg-sky-100 dark:bg-sky-900/40 text-sky-700 dark:text-sky-400 flex items-center justify-center text-xs font-bold">
            {step.order_by}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-2">
              {step.description && (
                <span className="font-medium text-sm text-gray-900 dark:text-white">{step.description}</span>
              )}
              <Badge label={step.step_type?.slug ?? 'unknown'} color="purple" />
              <Badge label={step.llm_model?.name ?? 'unknown model'} color="sky" />
              {step.llm_temperature !== null && (
                <Badge label={`temp: ${step.llm_temperature}`} color="amber" />
              )}
              <Badge label={`in: ${step.llm_input_type?.slug ?? '?'}`} color="gray" />
              <Badge label={`out: ${step.llm_output_type?.slug ?? '?'}`} color="gray" />
            </div>

            {step.llm_system_prompt && (
              <PromptPreview label="System" text={step.llm_system_prompt} />
            )}
            {step.llm_user_prompt && (
              <PromptPreview label="User" text={step.llm_user_prompt} />
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1 shrink-0">
            <Link
              href={`/admin/flavors/${flavorId}/steps/${step.id}/edit`}
              className="px-2.5 py-1 text-xs font-medium rounded text-sky-600 dark:text-sky-400 hover:bg-sky-50 dark:hover:bg-sky-900/30 transition-colors"
            >
              Edit
            </Link>
            <StepDeleteButton
              stepId={step.id}
              flavorId={flavorId}
              stepLabel={`step ${step.order_by}${step.description ? ` (${step.description})` : ''}`}
            />
          </div>
        </div>
      ))}
    </div>
  )
}

function Badge({ label, color }: { label: string; color: 'purple' | 'sky' | 'amber' | 'gray' }) {
  const classes = {
    purple: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400',
    sky: 'bg-sky-100 dark:bg-sky-900/30 text-sky-700 dark:text-sky-400',
    amber: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400',
    gray: 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400',
  }
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${classes[color]}`}>
      {label}
    </span>
  )
}

function PromptPreview({ label, text }: { label: string; text: string }) {
  const preview = text.length > 120 ? text.slice(0, 120) + '…' : text
  return (
    <div className="mt-1.5 text-xs">
      <span className="font-medium text-gray-500 dark:text-gray-500 uppercase tracking-wide">{label}: </span>
      <span className="text-gray-600 dark:text-gray-400 font-mono">{preview}</span>
    </div>
  )
}
