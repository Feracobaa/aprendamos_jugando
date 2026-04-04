import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import SimulacroClient from './SimulacroClient'

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const resolveParams = await params;
  return { title: `Simulacro #${resolveParams.id} | Rumbo al Saber` }
}

export default async function SimulacroPage({ params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const resolveParams = await params;
  const simulacroId = parseInt(resolveParams.id)

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: perfil } = await supabase.from('usuarios').select('id').eq('email', user.email).single()
  
  // Validar simulacro
  const { data: simulacro } = await supabase
    .from('simulacros')
    .select('id, estudiante_id, estado, inicio')
    .eq('id', simulacroId)
    .single()

  if (!simulacro || simulacro.estudiante_id !== perfil?.id) {
    return <div className="p-10 text-center text-slate-500">Sesión de Simulacro inválida o protegida.</div>
  }

  if (simulacro.estado !== 'activo') {
    return (
      <div className="p-10 text-center text-slate-800 bg-slate-50 min-h-screen">
        <h2 className="text-2xl font-bold">Simulacro Cerrado</h2>
        <p className="mt-2 text-slate-500">Este simulacro ya ha sido procesado ({simulacro.estado}).</p>
        <a href="/dashboard/simulacros" className="mt-4 inline-block text-orange-600 font-bold hover:underline">Volver a mis simulacros</a>
      </div>
    )
  }

  // Obtener preguntas asociadas
  const { data: simulacroRespuestas } = await supabase
    .from('simulacro_respuestas')
    .select('pregunta_id, preguntas(id, enunciado, opcion_a, opcion_b, opcion_c, opcion_d)')
    .eq('simulacro_id', simulacroId)

  // Aplanar la estructura para Mandar al cliente
  const preguntasFinales = simulacroRespuestas?.map(sr => sr.preguntas) || []

  // Calcular el tiempo restante. Un simulacro estándar dura 45 minutos (ejemplo).
  const duracionSimulacroMs = 45 * 60 * 1000
  const inicioMs = new Date(simulacro.inicio).getTime()
  const ahoraMs = Date.now()
  const deltaMs = ahoraMs - inicioMs
  
  const tiempoRestanteReal = Math.max(0, duracionSimulacroMs - deltaMs)
  const tiempoRestanteMinutos = tiempoRestanteReal / (1000 * 60);

  // Si ya se pasó el tiempo en el servidor, podríamos auto-cerrar, pero dejemos que el cliente lo mande
  // o le pasamos 0 y el cliente dispara cerrar.
  
  return (
    <SimulacroClient 
      simulacroId={simulacro.id} 
      tiempoLimiteMinutos={tiempoRestanteMinutos} 
      preguntas={preguntasFinales as any[]} 
    />
  )
}
