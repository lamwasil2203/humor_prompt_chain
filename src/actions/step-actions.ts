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

function parseStepForm(formData: FormData) {
  return {
    description: (formData.get('description') as string)?.trim() || null,
    humor_flavor_step_type_id: Number(formData.get('humor_flavor_step_type_id')),
    llm_model_id: Number(formData.get('llm_model_id')),
    llm_input_type_id: Number(formData.get('llm_input_type_id')),
    llm_output_type_id: Number(formData.get('llm_output_type_id')),
    llm_temperature: formData.get('llm_temperature') ? Number(formData.get('llm_temperature')) : null,
    llm_system_prompt: (formData.get('llm_system_prompt') as string)?.trim() || null,
    llm_user_prompt: (formData.get('llm_user_prompt') as string)?.trim() || null,
  }
}

export async function createStep(flavorId: number, formData: FormData): Promise<{ error?: string }> {
  try {
    const { supabase } = await getAdminUser()
    const fields = parseStepForm(formData)

    if (!fields.humor_flavor_step_type_id || !fields.llm_model_id || !fields.llm_input_type_id || !fields.llm_output_type_id) {
      return { error: 'Step type, model, input type, and output type are all required' }
    }

    // get next order_by
    const { data: existing } = await supabase
      .from('humor_flavor_steps')
      .select('order_by')
      .eq('humor_flavor_id', flavorId)
      .order('order_by', { ascending: false })
      .limit(1)

    const nextOrder = existing && existing.length > 0 ? existing[0].order_by + 1 : 1

    const { error } = await supabase.from('humor_flavor_steps').insert({
      humor_flavor_id: flavorId,
      order_by: nextOrder,
      ...fields,
    })

    if (error) return { error: error.message }
  } catch (e) {
    return { error: (e as Error).message }
  }

  revalidatePath(`/admin/flavors/${flavorId}`)
  redirect(`/admin/flavors/${flavorId}`)
}

export async function updateStep(stepId: number, flavorId: number, formData: FormData): Promise<{ error?: string }> {
  try {
    const { supabase } = await getAdminUser()
    const fields = parseStepForm(formData)

    const { error } = await supabase
      .from('humor_flavor_steps')
      .update(fields)
      .eq('id', stepId)

    if (error) return { error: error.message }
  } catch (e) {
    return { error: (e as Error).message }
  }

  revalidatePath(`/admin/flavors/${flavorId}`)
  redirect(`/admin/flavors/${flavorId}`)
}

export async function deleteStep(stepId: number, flavorId: number): Promise<{ error?: string }> {
  try {
    const { supabase } = await getAdminUser()

    const { error } = await supabase.from('humor_flavor_steps').delete().eq('id', stepId)
    if (error) return { error: error.message }

    // renumber remaining steps
    const { data: remaining } = await supabase
      .from('humor_flavor_steps')
      .select('id')
      .eq('humor_flavor_id', flavorId)
      .order('order_by', { ascending: true })

    if (remaining) {
      for (let i = 0; i < remaining.length; i++) {
        await supabase
          .from('humor_flavor_steps')
          .update({ order_by: i + 1 })
          .eq('id', remaining[i].id)
      }
    }
  } catch (e) {
    return { error: (e as Error).message }
  }

  revalidatePath(`/admin/flavors/${flavorId}`)
  return {}
}

export async function reorderStep(
  stepId: number,
  flavorId: number,
  direction: 'up' | 'down'
): Promise<{ error?: string }> {
  try {
    const { supabase } = await getAdminUser()

    const { data: steps } = await supabase
      .from('humor_flavor_steps')
      .select('id, order_by')
      .eq('humor_flavor_id', flavorId)
      .order('order_by', { ascending: true })

    if (!steps) return { error: 'Could not fetch steps' }

    const idx = steps.findIndex(s => s.id === stepId)
    if (idx === -1) return { error: 'Step not found' }

    const swapIdx = direction === 'up' ? idx - 1 : idx + 1
    if (swapIdx < 0 || swapIdx >= steps.length) return {}

    const stepA = steps[idx]
    const stepB = steps[swapIdx]

    // Use -1 as temp to avoid any potential conflicts
    await supabase.from('humor_flavor_steps').update({ order_by: -1 }).eq('id', stepA.id)
    await supabase.from('humor_flavor_steps').update({ order_by: stepA.order_by }).eq('id', stepB.id)
    await supabase.from('humor_flavor_steps').update({ order_by: stepB.order_by }).eq('id', stepA.id)
  } catch (e) {
    return { error: (e as Error).message }
  }

  revalidatePath(`/admin/flavors/${flavorId}`)
  return {}
}
