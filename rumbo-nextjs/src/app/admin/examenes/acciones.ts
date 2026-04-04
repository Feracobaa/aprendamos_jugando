'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function createExam(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No tienes sesión activa.' }

  const { data: admin } = await supabase.from('usuarios').select('id, role').eq('email', user.email).single()
  if (!admin || (admin.role !== 'admin' && admin.role !== 'profesor')) return { error: 'Acceso denegado: solo profesores o administradores pueden crear.' }

  const titulo = formData.get('titulo') as string
  const descripcion = formData.get('descripcion') as string
  const tiempo_limite = parseInt(formData.get('tiempo_limite') as string) || 60
  const fase_lectura = formData.get('fase_lectura') as string
  
  const { data, error } = await supabase.from('examenes').insert({
    titulo,
    descripcion,
    tiempo_limite,
    fase_lectura,
    admin_id: admin.id,
    intentos_permitidos: 1,
    es_global: true
  }).select('id').single()

  if (error) {
    console.error(error)
    return { error: `Error DB: ${error.message}` }
  }

  revalidatePath('/admin/examenes')
  redirect(`/admin/examenes/${data.id}/preguntas`)
}

export async function deleteExam(id: number) {
  const supabase = await createClient()
  await supabase.from('examenes').delete().eq('id', id)
  revalidatePath('/admin/examenes')
}
