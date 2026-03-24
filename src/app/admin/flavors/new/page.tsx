import Link from 'next/link'
import FlavorForm from '@/components/flavors/FlavorForm'

export default function NewFlavorPage() {
  return (
    <div className="max-w-xl">
      <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-6">
        <Link href="/admin/flavors" className="hover:text-gray-700 dark:hover:text-gray-300">Humor Flavors</Link>
        <span>/</span>
        <span className="text-gray-900 dark:text-white font-medium">New</span>
      </div>

      <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Create humor flavor</h1>
      <FlavorForm />
    </div>
  )
}
