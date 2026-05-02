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

export async function duplicateFlavor(id: number): Promise<{ error?: string }> {
  try {
    const { supabase } = await getAdminUser()

    const { data: original, error: fetchErr } = await supabase
      .from('humor_flavors')
      .select('slug, description')
      .eq('id', id)
      .single()
    if (fetchErr || !original) return { error: fetchErr?.message ?? 'Flavor not found' }

    // Find a unique slug: "{slug}-copy", then "{slug}-copy-2", etc.
    const base = `${original.slug}-copy`
    const { data: existing } = await supabase
      .from('humor_flavors')
      .select('slug')
      .like('slug', `${base}%`)

    const taken = new Set(existing?.map(r => r.slug) ?? [])
    let newSlug = base
    let n = 2
    while (taken.has(newSlug)) {
      newSlug = `${base}-${n++}`
    }

    const { data: newFlavor, error: insertErr } = await supabase
      .from('humor_flavors')
      .insert({ slug: newSlug, description: original.description })
      .select('id')
      .single()
    if (insertErr || !newFlavor) return { error: insertErr?.message ?? 'Failed to create duplicate' }

    // Copy all steps
    const { data: steps } = await supabase
      .from('humor_flavor_steps')
      .select('order_by, description, humor_flavor_step_type_id, llm_model_id, llm_input_type_id, llm_output_type_id, llm_temperature, llm_system_prompt, llm_user_prompt')
      .eq('humor_flavor_id', id)
      .order('order_by', { ascending: true })

    if (steps && steps.length > 0) {
      const { error: stepsErr } = await supabase.from('humor_flavor_steps').insert(
        steps.map(s => ({ ...s, humor_flavor_id: newFlavor.id }))
      )
      if (stepsErr) return { error: stepsErr.message }
    }
  } catch (e) {
    return { error: (e as Error).message }
  }

  revalidatePath('/admin/flavors')
  return {}
}
