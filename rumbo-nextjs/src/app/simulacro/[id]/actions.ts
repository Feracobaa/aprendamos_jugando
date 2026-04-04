'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function submitSimulacro(simulacroId: number, respuestasEstudiante: Record<number, string>) {
  const supabase = await createClient()

  // 1. Obtener la sesión
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Sesión de usuario no válida.' }

  const { data: perfil } = await supabase.from('usuarios').select('id, role').eq('email', user.email).single()
  if (!perfil) return { success: false, error: 'Perfil de usuario no activo.' }

  // 2. Verificar estado del simulacro
  const { data: simulacro } = await supabase
    .from('simulacros')
    .select('id, estado')
    .eq('id', simulacroId)
    .single()

  if (!simulacro || simulacro.estado !== 'activo') {
    return { success: false, error: 'Simulacro finalizado o inexistente.' }
  }

  // 3. Evaluar respuestas. Obtener las respuestas correctas.
  const preguntaIds = Object.keys(respuestasEstudiante).map(id => parseInt(id))
  let totalCorrectas = 0
  let totalPreguntas = preguntaIds.length || 1 // Avoid divide by zero // En realidad las preguntas están precargadas, vamos a contar las de la base

  // Las preguntas asignadas a este simulacro en `simulacro_respuestas`
  const { data: preguntasAsignadas } = await supabase
    .from('simulacro_respuestas')
    .select('id, pregunta_id, preguntas(respuesta_correcta)')
    .eq('simulacro_id', simulacroId)

  if (!preguntasAsignadas) {
    return { success: false, error: 'No se encontraron preguntas asignadas.' }
  }

  totalPreguntas = preguntasAsignadas.length

  // Iterar y calificar
  for (const pa of preguntasAsignadas) {
    const seleccion = respuestasEstudiante[pa.pregunta_id || 0]
    const corr = (pa as any).preguntas?.respuesta_correcta

    if (seleccion === corr) {
      totalCorrectas++;
    }

    // Actualizar la respuesta individual del estudiante
    if (seleccion) {
      await supabase
        .from('simulacro_respuestas')
        .update({ respuesta: seleccion })
        .eq('simulacro_id', simulacroId)
        .eq('pregunta_id', pa.pregunta_id)
    }
  }

  // Escalar puntaje a Base 100
  const puntajeFinal = Math.round((totalCorrectas / totalPreguntas) * 100)

  // 4. Guardar resultados y marcar fin
  const { data: resData, error: resError } = await supabase.from('simulacro_resultados').upsert({
    simulacro_id: simulacroId,
    estudiante_id: perfil.id,
    puntaje_total: puntajeFinal,
    respuestas_correctas: totalCorrectas
  }, { onConflict: 'simulacro_id' }).select()

  if (resError) {
    console.error('Error guardando resultados:', resError)
    return { success: false, error: 'No se pudo guardar el resultado final.' }
  }

  // 5. Cerrar simulacro con estado completado
  const { error: finishError } = await supabase.from('simulacros').update({
    estado: 'completado',
    fin: new Date().toISOString()
  }).eq('id', simulacroId)

  if (finishError) {
    console.error('Error finalizando simulacro:', finishError)
  }

  revalidatePath('/dashboard')
  revalidatePath('/dashboard/simulacros')

  return { 
    success: true, 
    puntaje: totalCorrectas, 
    total: totalPreguntas, 
    porcentaje: puntajeFinal 
  }
}

export async function registrarEventoSospechosoSimulacro(simulacroId: number, detalles: any) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  const { data: perfil } = await supabase.from('usuarios').select('id').eq('email', user.email).single()
  if (!perfil) return

  // Registrar en log de auditoría
  await supabase.from('exam_audit_log').insert({
    estudiante_id: perfil.id,
    examen_id: 0, // En este flujo de simulacro el exam_id está dentro de la tabla simulacros, pero el log pide uno.
    evento_tipo: 'SITUACION_SOSPECHOSA',
    detalles: detalles,
    ip_address: 'REDACTED',
    timestamp: new Date().toISOString()
  })

  // Anular simulacro si es grave
  if (detalles.grave) {
    await supabase.from('simulacros').update({
      estado: 'terminado',
      fin: new Date().toISOString()
    }).eq('id', simulacroId)
  }
  
  return { success: true }
}
