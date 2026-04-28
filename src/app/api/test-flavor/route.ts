import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'https://api.almostcrackd.ai'

export async function POST(request: NextRequest) {
  const supabase = await createClient()

  // getSession reads from the cookie (has the raw access token)
  const { data: { session } } = await supabase.auth.getSession()
  // getUser verifies the JWT with the Supabase server
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  const accessToken = session?.access_token
  if (!accessToken) {
    return NextResponse.json({ error: 'No active session — please sign in again' }, { status: 401 })
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_superadmin, is_matrix_admin')
    .eq('id', user.id)
    .single()

  if (!profile?.is_superadmin && !profile?.is_matrix_admin) {
    return NextResponse.json({ error: 'Access denied' }, { status: 403 })
  }

  const body = await request.json()
  const { imageId, humorFlavorId } = body

  if (!imageId || !humorFlavorId) {
    return NextResponse.json({ error: 'imageId and humorFlavorId are required' }, { status: 400 })
  }

  try {
    const externalRes = await fetch(`${API_BASE}/pipeline/generate-captions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ imageId, humorFlavorId }),
    })

    const text = await externalRes.text()
    let data: unknown
    try { data = JSON.parse(text) } catch { data = { raw: text } }

    if (!externalRes.ok) {
      const d = data as Record<string, unknown>
      const msg = typeof d?.error === 'string' ? d.error
        : typeof d?.message === 'string' ? d.message
        : text || `HTTP ${externalRes.status}`
      console.error('[test-flavor] external API error', externalRes.status, text)
      return NextResponse.json(
        { error: `External API (${externalRes.status}): ${msg}`, raw: data },
        { status: 502 }
      )
    }

    return NextResponse.json(data)
  } catch (err) {
    return NextResponse.json(
      { error: `Failed to reach API: ${(err as Error).message}` },
      { status: 502 }
    )
  }
}
