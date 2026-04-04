'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

/**
 * Actualiza el nombre y la foto del perfil del usuario autenticado.
 */
export async function actualizarPerfil(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado.' }

  const nombre = (formData.get('nombre') as string)?.trim()
  const nuevoEmail = (formData.get('email') as string)?.trim()
  if (!nombre) return { error: 'El nombre no puede estar vacío.' }
  if (!nuevoEmail) return { error: 'El correo no puede estar vacío.' }

  // 1. Update in the custom usuarios table
  const { error: dbError } = await supabase
    .from('usuarios')
    .update({ nombre, email: nuevoEmail })
    .eq('email', user.email)

  if (dbError) {
    console.error(dbError)
    if (dbError.code === '23505') {
      return { error: 'El correo ya está en uso por otra cuenta.' }
    }
    return { error: 'Error al actualizar el perfil en la base de datos.' }
  }

  // 2. Update in Supabase Auth if email changed
  if (user.email !== nuevoEmail) {
    const { error: authError } = await supabase.auth.updateUser({ email: nuevoEmail })
    if (authError) {
       console.error("No se pudo actualizar email en Auth:", authError)
       // Si solo falla auth, al menos se actualizó en DB, pero devolvemos error
       return { error: 'Perfil modificado, pero el correo falló en actualización de seguridad.' }
    }
  }

  revalidatePath('/perfil')
  return { success: true }
}

/**
 * Cambia la contraseña del usuario autenticado a través de Supabase Auth.
 */
export async function cambiarPassword(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado.' }

  const nueva = formData.get('nueva_password') as string
  const confirmar = formData.get('confirmar_password') as string

  if (!nueva || nueva.length < 6) {
    return { error: 'La contraseña debe tener al menos 6 caracteres.' }
  }

  if (nueva !== confirmar) {
    return { error: 'Las contraseñas no coinciden.' }
  }

  const { error } = await supabase.auth.updateUser({ password: nueva })

  if (error) {
    console.error(error)
    return { error: 'Error al actualizar la contraseña.' }
  }

  return { success: true }
}
