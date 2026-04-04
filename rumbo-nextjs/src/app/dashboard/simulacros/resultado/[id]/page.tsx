import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, CheckCircle2, XCircle, Trophy, Sparkles } from 'lucide-react'

export const metadata = { title: 'Reporte de Simulacro | Rumbo al Saber' }

export default async function SimulacroResultadoPage({ params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const resolveParams = await params;
  const simulacroId = parseInt(resolveParams.id)

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: perfil } = await supabase.from('usuarios').select('id, nombre').eq('email', user.email).single()
  
  // 1. Obtener resultado del simulacro
  const { data: resultado } = await supabase
    .from('simulacro_resultados')
    .select('*, simulacros(inicio, fin, estado)')
    .eq('simulacro_id', simulacroId)
    .single()

  if (!resultado || resultado.estudiante_id !== perfil?.id) {
    redirect('/dashboard/simulacros')
  }

  // 2. Obtener desglose de respuestas
  const { data: respuestas } = await supabase
    .from('simulacro_respuestas')
    .select('respuesta, preguntas(id, enunciado, respuesta_correcta)')
    .eq('simulacro_id', simulacroId)

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans">
      <nav className="bg-white border-b border-slate-200 px-6 py-4 shadow-sm sticky top-0 z-20">
        <Link href="/dashboard/simulacros" className="inline-flex items-center gap-2 text-slate-500 hover:text-orange-500 font-bold text-sm transition-colors">
          <ArrowLeft size={16} /> Volver a Entrenamientos
        </Link>
      </nav>

      <main className="max-w-4xl mx-auto p-4 md:p-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-200 mb-8 flex flex-col items-center text-center relative overflow-hidden">
           <div className="absolute right-0 top-0 w-64 h-64 bg-orange-500/10 blur-[80px] rounded-full pointer-events-none"></div>
           <div className="w-20 h-20 bg-orange-50 text-orange-500 rounded-full flex items-center justify-center mb-6 relative z-10 shadow-inner">
             {resultado.puntaje_total >= 60 ? <Trophy size={40} /> : <Sparkles size={40} />}
           </div>
           
           <h2 className="text-4xl font-black text-slate-800 mb-2 relative z-10">
              {resultado.puntaje_total} <span className="text-xl text-slate-400 font-medium">pts</span>
           </h2>
           <p className="text-slate-500 font-medium relative z-10 mb-6 max-w-lg">
             Este es el resultado de tu sesión de práctica. Obtuviste {resultado.respuestas_correctas} respuestas correctas. Recuerda que este puntaje es confidencial y solo tú puedes verlo.
           </p>
           
           <div className="flex gap-4 relative z-10 text-sm font-bold">
              <span className="bg-slate-100 text-slate-600 px-4 py-2 rounded-xl">ID #{simulacroId}</span>
              <span className="bg-emerald-50 text-emerald-600 px-4 py-2 rounded-xl border border-emerald-100 uppercase tracking-wider">
                {(resultado as any).simulacros?.estado}
              </span>
           </div>
        </div>

        <h3 className="text-xl font-bold text-slate-800 mb-6">Detalle de tu Desempeño</h3>

        <div className="space-y-4">
          {respuestas?.map((r: any, i) => {
            const esCorrecta = r.respuesta === r.preguntas?.respuesta_correcta
            return (
              <div key={r.preguntas?.id || i} className={`bg-white rounded-2xl p-6 border shadow-sm transition-all hover:shadow-md ${esCorrecta ? 'border-emerald-100 text-slate-800' : 'border-red-100 text-slate-800'}`}>
                <div className="flex items-start gap-4">
                   <div className={`mt-0.5 shrink-0 ${esCorrecta ? 'text-emerald-500' : 'text-red-500'}`}>
                     {esCorrecta ? <CheckCircle2 size={24} /> : <XCircle size={24} />}
                   </div>
                   <div className="flex-1">
                     <p className="font-bold mb-3 leading-relaxed">
                       <span className="text-slate-400 mr-2">{i+1}.</span>
                       {r.preguntas?.enunciado}
                     </p>
                     
                     <div className="flex flex-wrap gap-2 text-sm">
                       <div className="bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg text-slate-600 font-bold shadow-sm">
                         Marcaste: {r.respuesta || 'En blanco'}
                       </div>
                       {!esCorrecta && (
                         <div className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1.5 rounded-lg font-bold shadow-sm">
                           Era correcta: {r.preguntas?.respuesta_correcta}
                         </div>
                       )}
                     </div>
                   </div>
                </div>
              </div>
            )
          })}
        </div>
      </main>
    </div>
  )
}
