'use client'

import { useState, useTransition, FormEvent } from 'react'
import { createFlavor, updateFlavor } from '@/actions/flavor-actions'
import type { HumorFlavor } from '@/types/database'
import Link from 'next/link'

interface Props {
  flavor?: HumorFlavor
}

export default function FlavorForm({ flavor }: Props) {
  const isEdit = !!flavor
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    const formData = new FormData(e.currentTarget)
    startTransition(async () => {
      const result = isEdit
        ? await updateFlavor(flavor!.id, formData)
        : await createFlavor(formData)
      if (result?.error) setError(result.error)
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 max-w-lg">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Slug <span className="text-red-500">*</span>
        </label>
        <input
          name="slug"
          type="text"
          required
          defaultValue={flavor?.slug}
          pattern="[a-z0-9-]+"
          title="Lowercase letters, numbers, and hyphens only"
          placeholder="my-humor-flavor"
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-mono placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
        />
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-500">Lowercase letters, numbers, and hyphens only</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Description
        </label>
        <textarea
          name="description"
          rows={4}
          defaultValue={flavor?.description ?? ''}
          placeholder="Describe what this humor flavor does…"
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent resize-y"
        />
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
          {isPending ? 'Saving…' : isEdit ? 'Save changes' : 'Create flavor'}
        </button>
        <Link
          href={isEdit ? `/admin/flavors/${flavor!.id}` : '/admin/flavors'}
          className="px-5 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
        >
          Cancel
        </Link>
      </div>
    </form>
  )
}
