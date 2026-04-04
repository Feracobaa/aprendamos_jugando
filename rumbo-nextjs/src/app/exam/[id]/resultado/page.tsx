import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { CheckCircle2, XCircle, ArrowLeft, Trophy, Target, AlertCircle } from 'lucide-react'

export const metadata = { title: 'Retroalimentación de Examen | Aprendamos Jugando' }

export default async function ExamResultadoPage({ 
  params,
  searchParams
}: { 
  params: Promise<{ id: string }>,
  searchParams: Promise<{ res?: string }>
}) {
  const supabase = await createClient()
  const resolvedParams = await params
  const resolvedSearch = await searchParams
  const examId = parseInt(resolvedParams.id)
  const resultadoId = resolvedSearch.res ? parseInt(resolvedSearch.res) : null

  if (!resultadoId) {
    redirect('/dashboard')
  }

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: perfil } = await supabase.from('usuarios').select('id').eq('email', user.email).single()
  
  // 1. Obtener resultado base
  const { data: resultado } = await supabase
    .from('resultados')
    .select('id, puntaje, estudiante_id, examenes(titulo)')
    .eq('id', resultadoId)
    .single()

  if (!resultado || resultado.estudiante_id !== perfil?.id) {
    redirect('/dashboard')
  }

  // 2. Obtener respuestas detalladas con la pregunta
  const { data: respuestas, error } = await supabase
    .from('exam_responses')
    .select(`
      respuesta_estudiante,
      es_correcta,
      preguntas (
        id, enunciado, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, explicacion_correcta
      )
    `)
    .eq('resultado_id', resultadoId)
    .order('pregunta_id', { ascending: true }) // O asumiendo que el orden es por id de pregunta

  if (error || !respuestas) {
    return <div className="p-10 text-center">Error al cargar la retroalimentación.</div>
  }

  // Cálculos
  const totalPreguntas = respuestas.length
  const aciertos = resultado.puntaje
  const porcentaje = totalPreguntas > 0 ? (aciertos / totalPreguntas) * 100 : 0
  const porcentajeRounded = Math.round(porcentaje)

  // Mensaje Motivacional
  let mensajeTitulo = ''
  let mensajeCuerpo = ''
  let ColorTheme = ''

  if (porcentajeRounded >= 90) {
    mensajeTitulo = '¡Excelente Desempeño!'
    mensajeCuerpo = 'Demostraste un dominio superior en lectura crítica. ¡Sigue así!'
    ColorTheme = 'from-emerald-400 to-teal-500'
  } else if (porcentajeRounded >= 70) {
    mensajeTitulo = '¡Muy Bien!'
    mensajeCuerpo = 'Tienes una gran comprensión, aunque hay pequeños detalles por afinar.'
    ColorTheme = 'from-blue-400 to-indigo-500'
  } else if (porcentajeRounded >= 50) {
    mensajeTitulo = 'Necesita Refuerzo'
    mensajeCuerpo = 'Estás en el camino correcto, pero te recomendamos repasar los conceptos de esta fase.'
    ColorTheme = 'from-orange-400 to-amber-500'
  } else {
    mensajeTitulo = '¡No te Rindas!'
    mensajeCuerpo = 'Cada error es una oportunidad para aprender. Revisa tus respuestas y vuelve a intentarlo con más fuerza.'
    ColorTheme = 'from-red-400 to-rose-500'
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans">
      <nav className="bg-white border-b border-slate-200 px-4 sm:px-6 py-4 shadow-sm sticky top-0 z-20 flex justify-between items-center">
        <Link href="/dashboard" className="inline-flex items-center gap-2 text-slate-500 hover:text-teal-600 font-bold text-sm transition-colors">
          <ArrowLeft size={16} /> Volver al Hub
        </Link>
        <span className="font-bold text-slate-800 hidden sm:inline">
          {/* @ts-ignore */}
          {resultado.examenes?.titulo}
        </span>
        <div className="w-20"></div>
      </nav>

      <main className="max-w-4xl mx-auto p-4 md:p-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        
        {/* Tarjeta de Resumen y Motivación */}
        <div className="bg-white rounded-3xl overflow-hidden shadow-sm border border-slate-200 mb-10">
          <div className={`p-8 sm:p-12 text-white bg-gradient-to-br ${ColorTheme} flex flex-col items-center text-center relative`}>
            {porcentajeRounded >= 70 ? (
              <Trophy size={64} className="mb-4 opacity-90 drop-shadow-md" />
            ) : (
              <Target size={64} className="mb-4 opacity-90 drop-shadow-md" />
            )}
            <h1 className="text-3xl sm:text-4xl font-extrabold mb-2 drop-shadow-sm">{mensajeTitulo}</h1>
            <p className="text-white/90 font-medium text-lg max-w-lg mb-8 drop-shadow-sm">
              {mensajeCuerpo}
            </p>
            
            <div className="bg-white/20 backdrop-blur-md rounded-2xl p-6 flex items-center justify-center gap-6 sm:gap-12 border border-white/30 shadow-inner w-full max-w-sm">
               <div className="text-center">
                 <p className="text-white/80 text-xs font-bold uppercase tracking-wider mb-1">Puntaje</p>
                 <p className="text-4xl font-black">{aciertos}<span className="text-xl font-medium opacity-70">/{totalPreguntas}</span></p>
               </div>
               <div className="w-px h-12 bg-white/30"></div>
               <div className="text-center">
                 <p className="text-white/80 text-xs font-bold uppercase tracking-wider mb-1">Aciertos</p>
                 <p className="text-4xl font-black">{porcentajeRounded}%</p>
               </div>
            </div>
          </div>
        </div>

        {/* Revisión Detallada */}
        <h3 className="text-2xl font-extrabold text-slate-800 mb-6 flex items-center gap-2">
          <AlertCircle className="text-teal-500" />
          Revisión Detallada
        </h3>

        <div className="space-y-6">
          {respuestas.map((r, i) => {
            const p = r.preguntas as any
            if (!p) return null

            const esCorrecta = r.es_correcta
            const opciones = [
              { letra: 'A', texto: p.opcion_a },
              { letra: 'B', texto: p.opcion_b },
              { letra: 'C', texto: p.opcion_c },
              { letra: 'D', texto: p.opcion_d },
            ]

            return (
              <div key={p.id} className={`bg-white rounded-2xl p-6 sm:p-8 border-2 shadow-sm transition-all ${esCorrecta ? 'border-emerald-100' : 'border-rose-100'}`}>
                <div className="flex items-start gap-4 mb-6">
                  <div className={`mt-1 shrink-0 ${esCorrecta ? 'text-emerald-500' : 'text-rose-500'}`}>
                    {esCorrecta ? <CheckCircle2 size={28} /> : <XCircle size={28} />}
                  </div>
                  <div className="flex-1">
                    <h4 className="text-lg font-bold text-slate-800 leading-relaxed">
                      <span className="text-slate-400 mr-2">{i + 1}.</span>
                      {p.enunciado}
                    </h4>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3 pl-0 sm:pl-11">
                  {opciones.map((opt) => {
                    const fueSeleccionada = r.respuesta_estudiante === opt.letra
                    const eraCorrecta = p.respuesta_correcta === opt.letra
                    
                    let bgClass = "bg-slate-50 border-slate-200 text-slate-600"
                    let ringClass = ""

                    if (eraCorrecta) {
                      // Siempre mostramos la correcta en verde
                      bgClass = "bg-emerald-50 border-emerald-300 text-emerald-800"
                      ringClass = "ring-2 ring-emerald-500 ring-offset-1"
                    } else if (fueSeleccionada && !eraCorrecta) {
                      // Si la marcó y era incorrecta, en rojo
                      bgClass = "bg-rose-50 border-rose-300 text-rose-800"
                      ringClass = "opacity-90"
                    } else {
                      // Opción normal no seleccionada
                      bgClass = "bg-slate-50 border-slate-200 text-slate-500"
                    }

                    return (
                      <div key={opt.letra} className={`flex items-start gap-3 p-3 rounded-xl border ${bgClass} ${ringClass}`}>
                        <div className={`w-8 h-8 shrink-0 flex items-center justify-center rounded-lg font-black text-sm
                          ${eraCorrecta ? 'bg-emerald-500 text-white' : 
                            (fueSeleccionada ? 'bg-rose-500 text-white' : 'bg-slate-200 text-slate-500')}
                        `}>
                          {opt.letra}
                        </div>
                        <span className="font-medium mt-1 text-sm sm:text-base leading-relaxed">
                          {opt.texto}
                        </span>
                        
                        {/* Indicators for accessibility / clearer view */}
                        {fueSeleccionada && (
                           <div className="ml-auto mt-1 shrink-0">
                             <span className={`text-xs font-bold px-2 py-1 rounded-md ${eraCorrecta ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                               Tu respuesta
                             </span>
                           </div>
                        )}
                        {!fueSeleccionada && eraCorrecta && (
                           <div className="ml-auto mt-1 shrink-0">
                             <span className="text-xs font-bold px-2 py-1 rounded-md bg-emerald-100 text-emerald-700">
                               Respuesta Correcta
                             </span>
                           </div>
                        )}
                      </div>
                    )
                  })}
                </div>
                
                {p.explicacion_correcta && (
                   <div className="mt-6 pl-0 sm:pl-11">
                     <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                       <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Explicación</p>
                       <p className="text-slate-700 text-sm">{p.explicacion_correcta}</p>
                     </div>
                   </div>
                )}
              </div>
            )
          })}
        </div>

      </main>
    </div>
  )
}
