import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'https://api.almostcrackd.ai'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const { imageUrl } = await request.json()
  if (!imageUrl) return NextResponse.json({ error: 'imageUrl is required' }, { status: 400 })

  const { data: { session } } = await supabase.auth.getSession()

  const res = await fetch(`${API_BASE}/pipeline/upload-image-from-url`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session?.access_token}`,
    },
    body: JSON.stringify({ imageUrl, isCommonUse: false }),
  })

  const data = await res.json()
  if (!res.ok) {
    return NextResponse.json({ error: data?.error ?? `HTTP ${res.status}` }, { status: 502 })
  }
  return NextResponse.json(data) // { imageId, now }
}
