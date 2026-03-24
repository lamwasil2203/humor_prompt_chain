'use client'

import { useRouter } from 'next/navigation'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'
import ThemeToggle from './ThemeToggle'
import type { Profile } from '@/types/database'

interface Props {
  profile: Pick<Profile, 'first_name' | 'last_name' | 'email'> | null
}

export default function AdminHeader({ profile }: Props) {
  const router = useRouter()
  const supabase = getSupabaseBrowserClient()

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.replace('/login')
  }

  const displayName = profile?.first_name
    ? `${profile.first_name}${profile.last_name ? ` ${profile.last_name}` : ''}`
    : profile?.email ?? 'Admin'

  return (
    <header className="h-14 flex items-center justify-between px-6 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
      <div />
      <div className="flex items-center gap-3">
        <ThemeToggle />
        <span className="text-sm text-gray-600 dark:text-gray-400">{displayName}</span>
        <button
          onClick={handleSignOut}
          className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
        >
          Sign out
        </button>
      </div>
    </header>
  )
}
