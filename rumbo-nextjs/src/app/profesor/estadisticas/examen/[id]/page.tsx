import { createClient } from '@/utils/supabase/server'
import { ArrowLeft, Target, Users, BookOpen, AlertOctagon, FileCheck2 } from 'lucide-react'
import Link from 'next/link'
import { redirect } from 'next/navigation'

export const metadata = { title: 'Análisis de Examen | Admin' }

export default async function EstadisticasExamenPage({ params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const resolveParams = await params;
  const examId = parseInt(resolveParams.id)

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: perfil } = await supabase.from('usuarios').select('id').eq('email', user.email).single()
  if (!perfil) return null

  // Verificar que el examen pertenece al profesor
  const { data: examen } = await supabase
    .from('examenes')
    .select('titulo, id')
    .eq('id', examId)
    .eq('admin_id', perfil.id)
    .single()

  if (!examen) redirect('/profesor/estadisticas')

  // Obtener preguntas
  const { data: preguntas } = await supabase
    .from('preguntas')
    .select('id, enunciado, respuesta_correcta')
    .eq('examen_id', examId)

  // Obtener resultados asociados (Total intentos) y detalles del estudiante
  const { data: resultados } = await supabase
    .from('resultados')
    .select('*, usuarios(nombre, email)')
    .eq('examen_id', examId)
    .order('fecha', { ascending: false })

  const intentosTotales = resultados?.length || 0
  const promedioPuntaje = intentosTotales > 0 
    ? Math.round(resultados!.reduce((acc, curr) => acc + curr.puntaje, 0) / intentosTotales) 
    : 0

  const resIds = resultados?.map(r => r.id) || []

  // Obtener exam_responses para calcular tasas de error por pregunta
  let respuestasData: any[] = []
  if (resIds.length > 0) {
    const { data: respuestas } = await supabase
      .from('exam_responses')
      .select('pregunta_id, es_correcta, respuesta_estudiante')
      .in('resultado_id', resIds)
    
    if (respuestas) {
      respuestasData = respuestas
    }
  }

  // Agrupar analíticas por pregunta
  const metricasPreguntas = (preguntas || []).map(p => {
    const resDePregunta = respuestasData.filter(r => r.pregunta_id === p.id)
    const respuestasTotales = resDePregunta.length
    const correctas = resDePregunta.filter(r => r.es_correcta === true).length
    const errorRate = respuestasTotales > 0 ? Math.round(((respuestasTotales - correctas) / respuestasTotales) * 100) : 0
    
    // Distractor más común
    const distractores = resDePregunta.filter(r => !r.es_correcta).reduce((acc: any, curr) => {
      acc[curr.respuesta_estudiante] = (acc[curr.respuesta_estudiante] || 0) + 1
      return acc
    }, {})
    
    let distractorComun = '-'
    let max = 0
    for(const l in distractores) {
      if (distractores[l] > max) { max = distractores[l]; distractorComun = l }
    }

    return {
      ...p,
      respuestasTotales,
      errorRate,
      distractorComun
    }
  })

  // Ordenar por las preguntas donde los alumnos se equivocan más (Mayor error rate primero)
  metricasPreguntas.sort((a, b) => b.errorRate - a.errorRate)

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-6xl mx-auto py-4">
      <Link href="/profesor/estadisticas" className="flex items-center gap-2 text-slate-500 hover:text-slate-800 transition font-medium mb-6">
        <ArrowLeft size={18} /> Volver a Resumen Evaluativo
      </Link>

      <div className="bg-slate-900 rounded-3xl p-8 shadow-xl text-white mb-8 relative overflow-hidden">
         <div className="absolute right-0 top-0 w-64 h-64 bg-violet-600/30 blur-[80px] rounded-full"></div>
         <h2 className="text-sm font-bold text-violet-400 uppercase tracking-widest mb-1 relative z-10">Análisis a Profundidad</h2>
         <h1 className="text-3xl md:text-4xl font-extrabold leading-tight relative z-10">{examen.titulo}</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex items-center gap-4 relative overflow-hidden">
           <div className="absolute top-0 right-0 w-24 h-24 bg-teal-500/10 rounded-full blur-2xl"></div>
           <div className="p-4 bg-teal-50 text-teal-600 rounded-xl relative z-10"><Users size={24} /></div>
           <div className="relative z-10">
             <p className="text-sm font-bold text-slate-500 uppercase tracking-wide">Intentos Registrados</p>
             <p className="text-4xl font-black text-slate-800">{intentosTotales}</p>
           </div>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex items-center gap-4 relative overflow-hidden">
           <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/10 rounded-full blur-2xl"></div>
           <div className="p-4 bg-indigo-50 text-indigo-600 rounded-xl relative z-10"><Target size={24} /></div>
           <div className="relative z-10">
             <p className="text-sm font-bold text-slate-500 uppercase tracking-wide">Puntaje Promedio</p>
             <p className="text-4xl font-black text-slate-800">{promedioPuntaje} <span className="text-lg text-slate-400 font-medium">pts</span></p>
           </div>
        </div>
      </div>

      <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
        <BookOpen size={20} className="text-slate-400" /> Analíticas por Pregunta
      </h3>

      <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200 shadow-sm">
         {metricasPreguntas.length === 0 ? (
           <p className="text-slate-500 text-center py-10 font-medium">Este examen no tiene preguntas o no hay registros.</p>
         ) : (
           <div className="space-y-6">
             {metricasPreguntas.map((p, idx) => (
               <div key={p.id} className="p-5 rounded-2xl border border-slate-100 bg-slate-50 transition hover:bg-white hover:shadow-md hover:border-slate-200 group flex items-start gap-4">
                  <div className="flex-shrink-0 w-10 h-10 bg-slate-200 text-slate-600 font-black rounded-lg flex items-center justify-center">
                    {idx + 1}
                  </div>
                  <div className="flex-1">
                    <p className="text-slate-800 font-bold mb-4">{p.enunciado}</p>
                    <div className="flex flex-wrap items-center gap-3">
                      <div className={`px-3 py-1.5 rounded-lg text-xs font-bold border ${p.errorRate > 50 ? 'bg-red-50 text-red-600 border-red-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'}`}>
                        {p.errorRate > 50 ? <AlertOctagon size={14} className="inline mr-1 -mt-0.5" /> : null}
                        {p.errorRate}% Error
                      </div>
                      <div className="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-100 text-slate-600 border border-slate-200">
                        {p.respuestasTotales} Muestras
                      </div>
                      <div className="px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-50 text-amber-600 border border-amber-100">
                        Opción {p.respuesta_correcta} era la correcta
                      </div>
                      {p.distractorComun !== '-' && p.errorRate > 0 && (
                        <div className="px-3 py-1.5 rounded-lg text-xs font-bold bg-purple-50 text-purple-600 border border-purple-100">
                          Se equivocaron más marcando: {p.distractorComun}
                        </div>
                      )}
                    </div>
                  </div>
               </div>
             ))}
           </div>
         )}
      </div>

      <h3 className="text-xl font-bold text-slate-800 mb-6 mt-12 flex items-center gap-2">
        <Users size={20} className="text-slate-400" /> Resultados por Estudiante
      </h3>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden mb-10">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider font-bold border-b border-slate-100">
              <th className="px-6 py-4">Estudiante</th>
              <th className="px-6 py-4 text-center">Puntaje Obtenido</th>
              <th className="px-6 py-4 text-center">Fecha de Intento</th>
              <th className="px-6 py-4 text-right">Revisión Detallada</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm">
            {!resultados || resultados.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-12 text-center text-slate-500 font-medium">
                  Aún no hay evaluaciones registradas.
                </td>
              </tr>
            ) : (
              resultados.map(res => (
                <tr key={res.id} className="hover:bg-slate-50 transition">
                  <td className="px-6 py-4">
                    <p className="font-bold text-slate-800">{(res as any).usuarios?.nombre || 'Estudiante Desconocido'}</p>
                    <p className="text-xs text-slate-400">{(res as any).usuarios?.email}</p>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className={`inline-flex items-center px-3 py-1.5 rounded-full font-bold text-xs ${res.puntaje >= 50 ? 'bg-emerald-50 text-emerald-600' : (res.puntaje >= 30 ? 'bg-orange-50 text-orange-600' : 'bg-red-50 text-red-600')}`}>
                       {res.puntaje}%
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center text-slate-500 font-medium">
                    {new Date(res.fecha).toLocaleString('es-ES')}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Link href={`/profesor/estadisticas/resultado/${res.id}`} className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 text-white hover:bg-slate-800 rounded-lg font-bold transition">
                      <FileCheck2 size={16} /> Ver Auditoría
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

    </div>
  )
}
