'use client'

import { useState, useTransition } from 'react'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import { deleteStep } from '@/actions/step-actions'

interface Props {
  stepId: number
  flavorId: number
  stepLabel: string
}

export default function StepDeleteButton({ stepId, flavorId, stepLabel }: Props) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  function handleConfirm() {
    startTransition(async () => {
      await deleteStep(stepId, flavorId)
      setOpen(false)
    })
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        disabled={isPending}
        className="px-2.5 py-1 text-xs font-medium rounded text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors disabled:opacity-50"
      >
        {isPending ? '…' : 'Delete'}
      </button>
      <ConfirmDialog
        isOpen={open}
        title="Delete step"
        message={`Delete ${stepLabel}? The remaining steps will be renumbered.`}
        confirmLabel="Delete"
        danger
        onConfirm={handleConfirm}
        onCancel={() => setOpen(false)}
      />
    </>
  )
}
