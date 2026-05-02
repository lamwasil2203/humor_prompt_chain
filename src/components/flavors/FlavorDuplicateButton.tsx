'use client'

import { useState, useTransition } from 'react'
import { duplicateFlavor } from '@/actions/flavor-actions'

interface Props {
  id: number
}

export default function FlavorDuplicateButton({ id }: Props) {
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleClick() {
    setError(null)
    startTransition(async () => {
      const result = await duplicateFlavor(id)
      if (result?.error) setError(result.error)
    })
  }

  return (
    <>
      {error && <span className="text-xs text-red-500">{error}</span>}
      <button
        onClick={handleClick}
        disabled={isPending}
        className="px-2.5 py-1 text-xs font-medium rounded text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/30 transition-colors disabled:opacity-50"
      >
        {isPending ? 'Duplicating…' : 'Duplicate'}
      </button>
    </>
  )
}
