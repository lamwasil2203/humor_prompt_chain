'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

async function getAdminUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_superadmin, is_matrix_admin')
    .eq('id', user.id)
    .single()

  if (!profile?.is_superadmin && !profile?.is_matrix_admin) {
    throw new Error('Access denied')
  }

  return { supabase, user }
}

export async function createFlavor(formData: FormData): Promise<{ error?: string }> {
  const slug = (formData.get('slug') as string)?.trim()
  const description = (formData.get('description') as string)?.trim() || null

  if (!slug) return { error: 'Slug is required' }
  if (!/^[a-z0-9-]+$/.test(slug)) return { error: 'Slug must only contain lowercase letters, numbers, and hyphens' }

  try {
    const { supabase } = await getAdminUser()
    const { error } = await supabase.from('humor_flavors').insert({ slug, description })
    if (error) {
      if (error.code === '23505') return { error: `Slug "${slug}" already exists` }
      return { error: error.message }
    }
  } catch (e) {
    return { error: (e as Error).message }
  }

  revalidatePath('/admin/flavors')
  redirect('/admin/flavors')
}

export async function updateFlavor(id: number, formData: FormData): Promise<{ error?: string }> {
  const slug = (formData.get('slug') as string)?.trim()
  const description = (formData.get('description') as string)?.trim() || null

  if (!slug) return { error: 'Slug is required' }
  if (!/^[a-z0-9-]+$/.test(slug)) return { error: 'Slug must only contain lowercase letters, numbers, and hyphens' }

  try {
    const { supabase } = await getAdminUser()
    const { error } = await supabase
      .from('humor_flavors')
      .update({ slug, description })
      .eq('id', id)
    if (error) {
      if (error.code === '23505') return { error: `Slug "${slug}" already exists` }
      return { error: error.message }
    }
  } catch (e) {
    return { error: (e as Error).message }
  }

  revalidatePath('/admin/flavors')
  revalidatePath(`/admin/flavors/${id}`)
  redirect(`/admin/flavors/${id}`)
}

export async function deleteFlavor(id: number): Promise<{ error?: string }> {
  try {
    const { supabase } = await getAdminUser()
    const { error } = await supabase.from('humor_flavors').delete().eq('id', id)
    if (error) return { error: error.message }
  } catch (e) {
    return { error: (e as Error).message }
  }

  revalidatePath('/admin/flavors')
  return {}
}
