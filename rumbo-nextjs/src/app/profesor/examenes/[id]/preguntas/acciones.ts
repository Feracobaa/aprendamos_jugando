'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function addPregunta(examenId: number, data: {
  enunciado: string
  opcion_a: string
  opcion_b: string
  opcion_c: string
  opcion_d: string
  respuesta_correcta: string
  imagen?: string | null
}) {
  const supabase = await createClient()

  // Construir el objeto a insertar, solo incluir imagen si tiene valor
  const insertData: Record<string, unknown> = {
    examen_id: examenId,
    enunciado: data.enunciado,
    opcion_a: data.opcion_a,
    opcion_b: data.opcion_b,
    opcion_c: data.opcion_c,
    opcion_d: data.opcion_d,
    respuesta_correcta: data.respuesta_correcta,
  }

  if (data.imagen) {
    insertData.imagen = data.imagen
  }

  const { error } = await supabase.from('preguntas').insert(insertData)

  if (error) {
    console.error(error)
    return { success: false, error: error.message }
  }

  revalidatePath(`/profesor/examenes/${examenId}/preguntas`)
  return { success: true }
}

export async function deletePregunta(preguntaId: number, examenId: number) {
  const supabase = await createClient()
  await supabase.from('preguntas').delete().eq('id', preguntaId)
  revalidatePath(`/profesor/examenes/${examenId}/preguntas`)
}
