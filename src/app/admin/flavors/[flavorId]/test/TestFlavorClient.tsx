'use client'

import { useState, useRef } from 'react'
import Image from 'next/image'

const ACCEPTED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif', 'image/heic']

interface ImageOption {
  id: string
  url: string | null
  image_description: string | null
  is_common_use: boolean | null
  isUploaded?: boolean
}

interface TestResult {
  imageId: string
  imageUrl: string | null
  status: 'pending' | 'success' | 'error'
  data?: unknown
  error?: string
}

interface Props {
  flavorId: number
  images: ImageOption[]
}

export default function TestFlavorClient({ flavorId, images: dbImages }: Props) {
  const [uploadedImages, setUploadedImages] = useState<ImageOption[]>([])
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [results, setResults] = useState<TestResult[]>([])
  const [running, setRunning] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const allImages = [...dbImages, ...uploadedImages]

  function toggleImage(id: string) {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (!ACCEPTED_TYPES.includes(file.type)) {
      setUploadError(`Unsupported file type: ${file.type}`)
      return
    }

    setUploadError(null)
    setUploading(true)

    try {
      // Step 1: get presigned URL
      const presignRes = await fetch('/api/pipeline/presigned-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contentType: file.type }),
      })
      const { presignedUrl, cdnUrl, error: presignErr } = await presignRes.json()
      if (!presignRes.ok) throw new Error(presignErr ?? 'Failed to get upload URL')

      // Step 2: upload directly to S3
      const uploadRes = await fetch(presignedUrl, {
        method: 'PUT',
        headers: { 'Content-Type': file.type },
        body: file,
      })
      if (!uploadRes.ok) throw new Error(`Upload failed: HTTP ${uploadRes.status}`)

      // Step 3: register image URL in the pipeline
      const registerRes = await fetch('/api/pipeline/register-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageUrl: cdnUrl }),
      })
      const { imageId, error: registerErr } = await registerRes.json()
      if (!registerRes.ok) throw new Error(registerErr ?? 'Failed to register image')

      const newImage: ImageOption = {
        id: imageId,
        url: cdnUrl,
        image_description: file.name,
        is_common_use: false,
        isUploaded: true,
      }
      setUploadedImages(prev => [...prev, newImage])
      setSelectedIds(prev => new Set([...prev, imageId]))
    } catch (err) {
      setUploadError((err as Error).message)
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  async function runTest() {
    if (selectedIds.size === 0) return
    setRunning(true)

    const initial: TestResult[] = Array.from(selectedIds).map(id => ({
      imageId: id,
      imageUrl: allImages.find(i => i.id === id)?.url ?? null,
      status: 'pending',
    }))
    setResults(initial)

    for (const imageId of selectedIds) {
      const res = await fetch('/api/test-flavor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageId, humorFlavorId: flavorId }),
      })

      const data = await res.json()

      setResults(prev => prev.map(r =>
        r.imageId === imageId
          ? {
              ...r,
              status: res.ok ? 'success' : 'error',
              data: res.ok ? data : undefined,
              error: res.ok ? undefined : (data?.error ?? `HTTP ${res.status}`),
            }
          : r
      ))
    }

    setRunning(false)
  }

  return (
    <div className="space-y-6">
      {/* Image grid */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
            Select images ({selectedIds.size} selected)
          </h2>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSelectedIds(new Set(allImages.map(i => i.id)))}
              className="text-xs text-sky-600 dark:text-sky-400 hover:underline"
            >
              Select all
            </button>
            <button
              onClick={() => setSelectedIds(new Set())}
              className="text-xs text-gray-500 dark:text-gray-400 hover:underline"
            >
              Clear
            </button>
            {/* Upload button */}
            <label className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
              uploading
                ? 'opacity-50 cursor-not-allowed border-gray-200 dark:border-gray-700 text-gray-400'
                : 'border-sky-300 dark:border-sky-700 text-sky-600 dark:text-sky-400 hover:bg-sky-50 dark:hover:bg-sky-900/20'
            }`}>
              {uploading ? (
                <>
                  <svg className="animate-spin h-3.5 w-3.5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Uploading…
                </>
              ) : (
                <>
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                  Upload image
                </>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept={ACCEPTED_TYPES.join(',')}
                className="sr-only"
                disabled={uploading}
                onChange={handleFileUpload}
              />
            </label>
          </div>
        </div>

        {uploadError && (
          <div className="mb-3 rounded-lg bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 p-2.5 text-xs text-red-700 dark:text-red-400">
            {uploadError}
          </div>
        )}

        {allImages.length === 0 ? (
          <div className="text-sm text-gray-400 py-8 text-center border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl">
            No images available. Upload one above to get started.
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6 gap-3">
            {allImages.map(image => {
              const selected = selectedIds.has(image.id)
              return (
                <button
                  key={image.id}
                  onClick={() => toggleImage(image.id)}
                  className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                    selected
                      ? 'border-sky-500 ring-2 ring-sky-300 dark:ring-sky-700'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-500'
                  }`}
                >
                  {image.url ? (
                    <Image src={image.url} alt={image.image_description ?? ''} fill className="object-cover" unoptimized />
                  ) : (
                    <div className="w-full h-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                      <span className="text-xs text-gray-400">No image</span>
                    </div>
                  )}
                  {selected && (
                    <div className="absolute top-1 right-1 w-5 h-5 bg-sky-500 rounded-full flex items-center justify-center">
                      <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  )}
                  {image.isUploaded && (
                    <div className="absolute bottom-0 left-0 right-0 bg-sky-600/80 px-1 py-0.5">
                      <span className="text-xs text-white">uploaded</span>
                    </div>
                  )}
                  {image.is_common_use && !image.isUploaded && (
                    <div className="absolute bottom-0 left-0 right-0 bg-black/50 px-1 py-0.5">
                      <span className="text-xs text-white">common</span>
                    </div>
                  )}
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* Run button */}
      <button
        onClick={runTest}
        disabled={selectedIds.size === 0 || running}
        className="flex items-center gap-2 px-5 py-2.5 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors"
      >
        {running ? (
          <>
            <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Running…
          </>
        ) : (
          <>
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Run test ({selectedIds.size} image{selectedIds.size !== 1 ? 's' : ''})
          </>
        )}
      </button>

      {/* Results */}
      {results.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Results</h2>
          <div className="space-y-4">
            {results.map(result => (
              <div
                key={result.imageId}
                className={`rounded-xl border p-4 ${
                  result.status === 'pending'
                    ? 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'
                    : result.status === 'success'
                    ? 'border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/20'
                    : 'border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20'
                }`}
              >
                <div className="flex items-start gap-4">
                  {result.imageUrl && (
                    <div className="relative w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100 dark:bg-gray-700">
                      <Image src={result.imageUrl} alt="" fill className="object-cover" unoptimized />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      {result.status === 'pending' && (
                        <span className="flex items-center gap-1 text-xs text-gray-500">
                          <svg className="animate-spin h-3.5 w-3.5" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                          </svg>
                          Generating…
                        </span>
                      )}
                      {result.status === 'success' && (
                        <span className="text-xs font-medium text-emerald-700 dark:text-emerald-400">✓ Success</span>
                      )}
                      {result.status === 'error' && (
                        <span className="text-xs font-medium text-red-700 dark:text-red-400">✗ Error</span>
                      )}
                      <span className="text-xs text-gray-400 font-mono">{result.imageId.slice(0, 8)}…</span>
                    </div>

                    {result.status === 'error' && (
                      <p className="text-sm text-red-700 dark:text-red-400">{result.error}</p>
                    )}

                    {result.status === 'success' && result.data != null && (
                      <CaptionResults data={result.data} />
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function CaptionResults({ data }: { data: unknown }) {
  // If the API returns an array of caption records, render them nicely
  if (Array.isArray(data)) {
    return (
      <ul className="space-y-2">
        {data.map((item: unknown, i: number) => {
          const caption = (item as Record<string, unknown>)?.content
            ?? (item as Record<string, unknown>)?.caption
            ?? (item as Record<string, unknown>)?.text
            ?? JSON.stringify(item)
          return (
            <li key={i} className="text-sm text-gray-800 dark:text-gray-200 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2">
              {String(caption)}
            </li>
          )
        })}
      </ul>
    )
  }

  // Fallback: raw JSON
  return (
    <pre className="text-xs bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-3 overflow-x-auto whitespace-pre-wrap text-gray-800 dark:text-gray-200">
      {JSON.stringify(data as Record<string, unknown>, null, 2)}
    </pre>
  )
}
