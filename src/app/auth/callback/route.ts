import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// Supabase redirects the user back here after OAuth with a `code` param.
// We exchange that code for a session, then redirect into the admin area.
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/admin'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // Something went wrong — send back to login with an error flag
  return NextResponse.redirect(`${origin}/login?error=auth_failed`)
}
