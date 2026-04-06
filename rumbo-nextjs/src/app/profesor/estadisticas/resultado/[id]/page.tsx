import { createClient } from '@/utils/supabase/server'
import { ArrowLeft, CheckCircle2, XCircle, AlertTriangle, Clock, Activity, ShieldAlert } from 'lucide-react'
import Link from 'next/link'
import { redirect } from 'next/navigation'

export const metadata = { title: 'Auditoría de Evaluación | Admin' }

export default async function DetalleResultadoEstudiante({ params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const resolveParams = await params;
  const resultadoId = parseInt(resolveParams.id)

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: perfil } = await supabase.from('usuarios').select('id, role').eq('email', user.email).single()
  if (!perfil) return null

  // 1. Obtener resultado y verificar seguridad
  const { data: resultado } = await supabase
    .from('resultados')
    .select('*, usuarios(nombre, email), examenes(id, titulo, admin_id)')
    .eq('id', resultadoId)
    .single()

  // Si no existe o no le pertenece a este profesor (y no es admin)
  if (!resultado || (perfil.role !== 'admin' && (resultado as any).examenes?.admin_id !== perfil.id)) {
    redirect('/profesor/estadisticas')
  }

  const examenId = resultado.examen_id
  const estudianteId = resultado.estudiante_id

  const backUrl = perfil.role === 'admin' ? '/admin/estadisticas' : `/profesor/estadisticas/examen/${examenId}`

  // 2. Obtener respuestas específicas de este intento
  const { data: respuestas } = await supabase
    .from('exam_responses')
    .select('*, preguntas(enunciado, respuesta_correcta, opcion_a, opcion_b, opcion_c, opcion_d)')
    .eq('resultado_id', resultadoId)

  // 3. Obtener Audit Log de este examen y estudiante (Registro Anti-trampas)
  const { data: auditLogs } = await supabase
    .from('exam_audit_log')
    .select('*')
    .eq('estudiante_id', estudianteId)
    .eq('examen_id', examenId)
    .order('timestamp', { ascending: false })

  const aciertos = respuestas?.filter(r => r.es_correcta).length || 0;
  const desaciertos = (respuestas?.length || 0) - aciertos;

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-5xl mx-auto py-4">
      <Link href={backUrl} className="flex items-center gap-2 text-slate-500 hover:text-slate-800 transition font-medium mb-6">
        <ArrowLeft size={18} /> Volver a {perfil.role === 'admin' ? 'Estadísticas Globales' : 'Estadísticas del Examen'}
      </Link>

      {/* Header Panel */}
      <div className="bg-slate-900 rounded-3xl p-8 shadow-xl text-white mb-8 relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6">
         <div className="absolute right-0 top-0 w-64 h-64 bg-indigo-500/20 blur-[80px] rounded-full"></div>
         
         <div className="relative z-10">
           <h2 className="text-sm font-bold text-indigo-400 uppercase tracking-widest mb-2 flex items-center gap-2">
             <Activity size={16} /> Reporte de Estudiante
           </h2>
           <h1 className="text-3xl font-extrabold leading-tight">{(resultado as any).usuarios?.nombre}</h1>
           <p className="text-slate-400 mt-1">{(resultado as any).usuarios?.email}</p>
           <div className="mt-4 flex flex-wrap items-center gap-3">
             <div className="px-3 py-1 bg-white/10 rounded-lg text-sm font-bold border border-white/20">
               {new Date(resultado.fecha).toLocaleString('es-ES')}
             </div>
             <div className="px-3 py-1 bg-white/10 rounded-lg text-sm font-bold border border-white/20">
               {(resultado as any).examenes?.titulo}
             </div>
           </div>
         </div>

         <div className="relative z-10 bg-white/5 border border-white/10 rounded-2xl p-6 text-center backdrop-blur-sm min-w-[200px]">
            <p className="text-slate-400 font-bold text-sm tracking-widest uppercase mb-1">Calificación</p>
            <p className="text-5xl font-black mb-2">{resultado.puntaje}%</p>
            <div className="flex justify-center gap-4 text-xs font-bold uppercase tracking-wider">
              <span className="text-emerald-400">{aciertos} Aciertos</span>
              <span className="text-red-400">{desaciertos} Desaciertos</span>
            </div>
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
        
        {/* Columna Izquierda: Respuestas */}
        <div className="lg:col-span-2 space-y-6">
          <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <CheckCircle2 size={20} className="text-emerald-500" /> Detalle de Respuestas
          </h3>

          {!respuestas || respuestas.length === 0 ? (
            <div className="p-8 text-center bg-slate-50 border border-slate-200 rounded-2xl text-slate-500 font-medium">
              No se encontraron respuestas registradas en este intento.
            </div>
          ) : (
            <div className="space-y-4 shadow-sm">
              {respuestas.map((r, i) => (
                <div key={r.id} className={`p-6 rounded-2xl border ${r.es_correcta ? 'bg-emerald-50/30 border-emerald-100' : 'bg-red-50/30 border-red-100'}`}>
                  <div className="flex items-start gap-4">
                     <div className={`mt-0.5 shrink-0 ${r.es_correcta ? 'text-emerald-500' : 'text-red-500'}`}>
                       {r.es_correcta ? <CheckCircle2 size={24} /> : <XCircle size={24} />}
                     </div>
                     <div className="flex-1">
                       <p className="text-slate-800 font-bold mb-3"><span className="text-slate-400 mr-2">{i+1}.</span>{(r as any).preguntas?.enunciado}</p>
                       <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                          <div className="bg-white px-4 py-2 rounded-lg border border-slate-200 shadow-sm font-medium">
                            <span className="text-slate-400 text-xs block mb-0.5 font-bold uppercase">Su Respuesta</span>
                            {r.respuesta_estudiante ? `Opción ${r.respuesta_estudiante}` : 'No respondió'} 
                          </div>
                          <div className="bg-emerald-50 px-4 py-2 rounded-lg border border-emerald-200 shadow-sm font-medium text-emerald-800">
                            <span className="text-emerald-600/70 text-xs block mb-0.5 font-bold uppercase">Respuesta Correcta</span>
                            Opción {(r as any).preguntas?.respuesta_correcta}
                          </div>
                       </div>
                       {r.tiempo_respuesta && (
                         <div className="mt-3 text-xs text-slate-500 font-bold flex items-center gap-1">
                           <Clock size={14} /> Tiempo empleado: {r.tiempo_respuesta} seg.
                         </div>
                       )}
                     </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Columna Derecha: Auditoría */}
        <div className="space-y-6">
          <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
             <ShieldAlert size={20} className="text-red-500" /> Registro de Auditoría
          </h3>

          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            {!auditLogs || auditLogs.length === 0 ? (
              <div className="text-center py-6 text-slate-500 flex flex-col items-center">
                 <div className="w-12 h-12 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mb-3">
                   <CheckCircle2 size={24} />
                 </div>
                 <p className="font-bold text-slate-700">Comportamiento Limpio</p>
                 <p className="text-sm mt-1">No se detectaron anomalías, abandonos de pantalla ni eventos sospechosos.</p>
              </div>
            ) : (
              <div className="relative border-l-2 border-slate-100 ml-3 pl-5 space-y-6 before:absolute before:inset-0 before:bg-gradient-to-b before:from-transparent before:via-slate-100 before:to-transparent">
                {auditLogs.map((log) => (
                  <div key={log.id} className="relative">
                    <div className="absolute -left-[29px] top-1 w-3 h-3 rounded-full bg-red-400 ring-4 ring-white"></div>
                    <p className="text-xs text-slate-400 font-bold mb-1">{new Date(log.timestamp).toLocaleTimeString()}</p>
                    <div className="bg-red-50 text-red-700 border border-red-100 rounded-lg p-3 text-sm flex gap-2">
                       <AlertTriangle size={16} className="shrink-0 mt-0.5" />
                       <div>
                         <p className="font-bold">{log.evento_tipo}</p>
                         {log.detalles && (
                           <pre className="mt-1 text-xs opacity-80 whitespace-pre-wrap font-mono uppercase">
                             {JSON.stringify(log.detalles).replace(/[{""}]/g, ' ')}
                           </pre>
                         )}
                       </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 shadow-sm text-sm text-slate-600">
             <p className="font-bold text-slate-800 mb-1">Sobre la Auditoría</p>
             <p>Este panel registra automáticamente si el estudiante abandonó la pestaña del examen, minimizó el navegador o se detectaron comportamientos anómalos durante el intento.</p>
          </div>

        </div>

      </div>
    </div>
  )
}
