'use server'

import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'

export async function startSimulacro() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: perfil } = await supabase
    .from('usuarios')
    .select('id')
    .eq('email', user.email)
    .single()

  if (!perfil) redirect('/dashboard')

  // 1. Crear el registro vacío del simulacro
  const { data: nuevoSimulacro, error: simError } = await supabase
    .from('simulacros')
    .insert({
      estudiante_id: perfil.id,
      inicio: new Date().toISOString(),
      estado: 'activo'
    })
    .select('id')
    .single()

  if (simError || !nuevoSimulacro) {
    console.error('Error creando simulacro:', simError)
    redirect('/dashboard/simulacros?error=creacion')
  }

  // Obtener preguntas aleatorias de todos los exámenes disponibles
  const queryIdsPromesa = supabase.from('preguntas').select('id').limit(100)

  const { data: preguntasPosibles } = await queryIdsPromesa;
  
  if (preguntasPosibles && preguntasPosibles.length > 0) {
    // Mezclar
    const shuffled = preguntasPosibles.sort(() => 0.5 - Math.random())
    // Tomar máximo 20
    const seleccionadas = shuffled.slice(0, 20)
    
    // Insertar en simulacro_respuestas (plantilla vacía)
    const inserciones = seleccionadas.map(p => ({
      simulacro_id: nuevoSimulacro.id,
      pregunta_id: p.id,
      respuesta: null
    }))
    
    await supabase.from('simulacro_respuestas').insert(inserciones)
  }

  redirect(`/simulacro/${nuevoSimulacro.id}`)
}
