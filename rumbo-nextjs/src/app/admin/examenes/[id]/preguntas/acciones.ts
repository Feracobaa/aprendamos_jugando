'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

async function checkAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: perfil } = await supabase.from('usuarios').select('role').eq('email', user.email).single()
  return perfil?.role === 'admin' || perfil?.role === 'profesor' ? perfil : null
}

export async function addPregunta(examenId: number, data: {
  enunciado: string
  opcion_a: string
  opcion_b: string
  opcion_c: string
  opcion_d: string
  respuesta_correcta: string
  imagen?: string | null
}) {
  const perfil = await checkAdmin()
  if (!perfil) return { success: false, error: 'No autorizado' }

  const supabase = await createClient()

  const insertData: Record<string, unknown> = {
    examen_id: examenId,
    enunciado: data.enunciado,
    opcion_a: data.opcion_a,
    opcion_b: data.opcion_b,
    opcion_c: data.opcion_c,
    opcion_d: data.opcion_d,
    respuesta_correcta: data.respuesta_correcta,
    imagen: data.imagen || null
  }

  const { error } = await supabase.from('preguntas').insert(insertData)
  if (error) return { success: false, error: error.message }

  revalidatePath(`/admin/examenes/${examenId}/preguntas`)
  return { success: true }
}

export async function editarPregunta(preguntaId: number, examenId: number, data: {
  enunciado: string
  opcion_a: string
  opcion_b: string
  opcion_c: string
  opcion_d: string
  respuesta_correcta: string
  imagen?: string | null
}) {
  const perfil = await checkAdmin()
  if (!perfil) return { success: false, error: 'No autorizado' }

  const supabase = await createClient()

  const updateData: Record<string, unknown> = {
    enunciado: data.enunciado,
    opcion_a: data.opcion_a,
    opcion_b: data.opcion_b,
    opcion_c: data.opcion_c,
    opcion_d: data.opcion_d,
    respuesta_correcta: data.respuesta_correcta,
  }

  if (data.imagen !== undefined) {
    updateData.imagen = data.imagen
  }

  const { error } = await supabase
    .from('preguntas')
    .update(updateData)
    .eq('id', preguntaId)

  if (error) return { success: false, error: error.message }

  revalidatePath(`/admin/examenes/${examenId}/preguntas`)
  return { success: true }
}

export async function deletePregunta(preguntaId: number, examenId: number) {
  const perfil = await checkAdmin()
  if (!perfil) return { success: false, error: 'No autorizado' }

  const supabase = await createClient()
  const { error } = await supabase.from('preguntas').delete().eq('id', preguntaId)
  
  if (error) return { success: false, error: error.message }

  revalidatePath(`/admin/examenes/${examenId}/preguntas`)
  return { success: true }
}
