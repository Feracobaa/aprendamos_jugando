'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function submitExam(examId: number, respuestas: Record<string, string>) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Unauthorized' }

  // Obtener estudiante de la tabla usuarios pública
  const { data: userData } = await supabase.from('usuarios').select('id').eq('email', user.email).single()
  
  if (!userData) return { success: false, error: 'Estudiante no registrado en usuarios' }

  const estudianteId = userData.id

  // Extraer las respuestas reales sin que viajen por el cliente
  const { data: preguntas } = await supabase
    .from('preguntas')
    .select('id, respuesta_correcta')
    .eq('examen_id', examId)

  if (!preguntas) return { success: false, error: 'Preguntas no encontradas' }

  let puntajeTotal = 0
  const responsesInserts = []

  for (const p of preguntas) {
    const seleccionada = respuestas[p.id.toString()]
    const correcta = seleccionada === p.respuesta_correcta
    if (correcta) puntajeTotal++
    
    responsesInserts.push({
      pregunta_id: p.id,
      respuesta_estudiante: seleccionada || null,
      es_correcta: correcta
    })
  }

  // Insertar en resultados principales
  const { data: resultado, error: resError } = await supabase
    .from('resultados')
    .insert({
      estudiante_id: estudianteId,
      examen_id: examId,
      puntaje: Math.round((puntajeTotal / preguntas.length) * 100)
    })
    .select()
    .single()

  if (resError) return { success: false, error: resError.message }

  // Insertar respuestas detalladas (con for loop o bulk)
  const detalladas = responsesInserts.map(r => ({ ...r, resultado_id: resultado.id }))
  await supabase.from('exam_responses').insert(detalladas)

  // Desactivar sesión
  await supabase
    .from('active_exam_sessions')
    .update({ finalizada: true, ultimo_heartbeat: new Date().toISOString() })
    .match({ estudiante_id: estudianteId, examen_id: examId, finalizada: false })

  revalidatePath('/dashboard')
  return { success: true, puntaje: puntajeTotal, total: preguntas.length, resultadoId: resultado.id }
}
