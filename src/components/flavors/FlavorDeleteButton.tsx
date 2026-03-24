'use client'

import { useState, useTransition } from 'react'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import { deleteFlavor } from '@/actions/flavor-actions'

interface Props {
  id: number
  slug: string
}

export default function FlavorDeleteButton({ id, slug }: Props) {
  const [open, setOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleConfirm() {
    startTransition(async () => {
      const result = await deleteFlavor(id)
      if (result?.error) {
        setError(result.error)
        setOpen(false)
      } else {
        setOpen(false)
      }
    })
  }

  return (
    <>
      {error && <span className="text-xs text-red-500">{error}</span>}
      <button
        onClick={() => setOpen(true)}
        disabled={isPending}
        className="px-3 py-1.5 text-xs font-medium rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 border border-red-200 dark:border-red-800 transition-colors disabled:opacity-50"
      >
        {isPending ? 'Deleting…' : 'Delete'}
      </button>
      <ConfirmDialog
        isOpen={open}
        title="Delete humor flavor"
        message={`Are you sure you want to delete "${slug}"? This will also delete all associated steps. This action cannot be undone.`}
        confirmLabel="Delete"
        danger
        onConfirm={handleConfirm}
        onCancel={() => setOpen(false)}
      />
    </>
  )
}
