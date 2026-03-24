'use client'

import { useTransition } from 'react'
import { reorderStep } from '@/actions/step-actions'

interface Props {
  stepId: number
  flavorId: number
  isFirst: boolean
  isLast: boolean
}

export default function StepReorderButtons({ stepId, flavorId, isFirst, isLast }: Props) {
  const [isPending, startTransition] = useTransition()

  function move(direction: 'up' | 'down') {
    startTransition(async () => { await reorderStep(stepId, flavorId, direction) })
  }

  return (
    <div className="flex flex-col gap-0.5">
      <button
        onClick={() => move('up')}
        disabled={isFirst || isPending}
        title="Move up"
        className="p-1 rounded text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 disabled:opacity-25 disabled:cursor-not-allowed transition-colors"
      >
        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
        </svg>
      </button>
      <button
        onClick={() => move('down')}
        disabled={isLast || isPending}
        title="Move down"
        className="p-1 rounded text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 disabled:opacity-25 disabled:cursor-not-allowed transition-colors"
      >
        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
    </div>
  )
}
