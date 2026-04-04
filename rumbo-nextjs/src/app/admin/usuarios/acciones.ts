'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

/**
 * Crea un usuario nuevo desde el panel Admin.
 * 1. Crea la cuenta en Supabase Auth (con raw_user_meta_data para nombre y role).
 * 2. El trigger `handle_new_user` inserta automáticamente en public.usuarios.
 */
export async function crearUsuarioAdmin(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado.' }

  const { data: perfil } = await supabase.from('usuarios').select('role').eq('email', user.email).single()
  if (perfil?.role !== 'admin') return { error: 'Acceso denegado. Se requiere rol de administrador.' }

  const nombre = (formData.get('nombre') as string)?.trim()
  const email = (formData.get('email') as string)?.trim()
  const password = (formData.get('password') as string)
  const role = (formData.get('role') as string) || 'estudiante'
  const estado = (formData.get('estado') as string) || 'activo'

  if (!nombre || !email || !password) {
    return { error: 'Nombre, correo y contraseña son obligatorios.' }
  }

  if (password.length < 6) {
    return { error: 'La contraseña debe tener al menos 6 caracteres.' }
  }

  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        nombre,
        role,
      },
    },
  })

  if (authError) {
    console.error('Auth error:', authError)
    if (authError.message.includes('already registered')) {
      return { error: 'Este correo ya está registrado en la plataforma.' }
    }
    return { error: `Error de autenticación: ${authError.message}` }
  }

  revalidatePath('/admin/usuarios')
  return { success: true }
}

/**
 * Edita un usuario existente en la tabla pública.
 * No cambiamos la contraseña de Auth desde aquí (eso es perfil personal).
 */
export async function editarUsuario(id: number, formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado.' }

  const { data: perfil } = await supabase.from('usuarios').select('role').eq('email', user.email).single()
  if (perfil?.role !== 'admin') return { error: 'Acceso denegado. Se requiere rol de administrador.' }

  const nombre = (formData.get('nombre') as string)?.trim()
  const role = (formData.get('role') as string)
  const estado = (formData.get('estado') as string) || 'activo'

  if (!nombre) {
    return { error: 'El nombre es obligatorio.' }
  }

  const { error } = await supabase
    .from('usuarios')
    .update({ nombre, role, estado })
    .eq('id', id)

  if (error) {
    console.error(error)
    return { error: `Error DB: ${error.message}` }
  }

  revalidatePath('/admin/usuarios')
  return { success: true }
}

/**
 * Elimina un usuario de la tabla pública.
 * Nota: Esto no elimina su cuenta de Supabase Auth (requiere Admin API con service role).
 */
export async function eliminarUsuario(id: number) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado.' }

  const { data: perfil } = await supabase.from('usuarios').select('role').eq('email', user.email).single()
  if (perfil?.role !== 'admin') return { error: 'Acceso denegado. Se requiere rol de administrador.' }

  const { error } = await supabase.from('usuarios').delete().eq('id', id)

  if (error) {
    console.error(error)
    return { error: `No se pudo eliminar el usuario: ${error.message}` }
  }

  revalidatePath('/admin/usuarios')
  return { success: true }
}
