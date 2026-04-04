'use server'

import { createClient } from '@/utils/supabase/server'

export async function updatePresence() {
  const supabase = await createClient()

  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) return { success: false }

    const { error } = await supabase
      .from('usuarios')
      .update({ last_seen: new Date().toISOString() })
      .eq('email', user.email)

    if (error) {
      console.error('Error updating presence:', error)
      return { success: false }
    }
    return { success: true }
  } catch (err) {
    return { success: false }
  }
}
