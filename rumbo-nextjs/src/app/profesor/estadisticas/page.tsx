import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import {
  Users, GraduationCap, BookOpen, FileText,
  CheckCircle2, BarChart3, TrendingUp, Eye, Brain, Sparkles,
  Activity, Clock, Layout
} from 'lucide-react'

export const metadata = { title: 'Tus Estadísticas | Aprendamos Jugando' }

export default async function EstadisticasProfesorPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: perfil } = await supabase.from('usuarios').select('id').eq('email', user.email).single()
  if (!perfil) redirect('/dashboard')

  // --- Data Fetching (Filtered by Teacher) ---
  const { data: myExamenes } = await supabase.from('examenes').select('id, titulo, fase_lectura, created_at, publicado').eq('admin_id', perfil.id)
  const totalExamenesCount = myExamenes?.length || 0
  const myExamIds = myExamenes?.map(e => e.id) || []

  const exLiteral = myExamenes?.filter(e => e.fase_lectura === 'literal').length || 0
  const exInferencial = myExamenes?.filter(e => e.fase_lectura === 'inferencial').length || 0
  const exCritico = myExamenes?.filter(e => e.fase_lectura === 'critico').length || 0
  
  const exPublicados = myExamenes?.filter(e => e.publicado !== false).length || 0
  const exBorradores = myExamenes?.filter(e => e.publicado === false).length || 0

  let totalResultados = 0
  let promedioGlobal = 0
  let allResultados: any[] = []

  if (myExamIds.length > 0) {
    const { data: results } = await supabase
      .from('resultados')
      .select('id, puntaje, examen_id, fecha, usuarios!resultados_estudiante_id_fkey(nombre), examenes!resultados_examen_id_fkey(titulo, fase_lectura)')
      .in('examen_id', myExamIds)
      .order('fecha', { ascending: false })

    if (results) {
      allResultados = results
      totalResultados = results.length
      promedioGlobal = totalResultados > 0 
        ? Math.round((results.reduce((sum, r) => sum + (r.puntaje || 0), 0) / totalResultados) * 10) / 10 
        : 0
    }
  }

  // Average by level
  const promByLevel = (level: string) => {
    const ids = myExamenes?.filter(e => e.fase_lectura === level).map(e => e.id) || []
    if (ids.length === 0) return 0
    const resLevel = allResultados.filter(r => ids.includes(r.examen_id))
    if (resLevel.length === 0) return 0
    return Math.round((resLevel.reduce((sum, r) => sum + (r.puntaje || 0), 0) / resLevel.length) * 10) / 10
  }

  const promLiteral = promByLevel('literal')
  const promInferencial = promByLevel('inferencial')
  const promCritico = promByLevel('critico')

  const FASE_LABELS: Record<string, { label: string; color: string; icon: React.ReactNode; gradient: string }> = {
    literal: { label: 'Literal', color: 'text-emerald-600 dark:text-emerald-400', icon: <Eye size={14} />, gradient: 'from-emerald-500 to-green-600' },
    inferencial: { label: 'Inferencial', color: 'text-blue-600 dark:text-blue-400', icon: <Brain size={14} />, gradient: 'from-blue-500 to-indigo-600' },
    critico: { label: 'Crítico', color: 'text-purple-600 dark:text-purple-400', icon: <Sparkles size={14} />, gradient: 'from-purple-500 to-fuchsia-600' },
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* Header */}
      <div className="mb-10">
        <h2 className="text-3xl sm:text-4xl font-black text-foreground flex items-center gap-4">
          <div className="p-3 bg-gradient-to-tr from-teal-500 to-emerald-600 rounded-2xl text-white shadow-xl">
            <BarChart3 size={32} />
          </div>
          Tus Métricas de Lectura
        </h2>
        <p className="text-muted-light mt-2 font-medium text-lg ml-0 sm:ml-16">Análisis detallado de tus exámenes y el desempeño de tus estudiantes.</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        <StatCard icon={<FileText size={24} />} label="Tus Exámenes" value={totalExamenesCount} gradient="from-slate-600 to-slate-800" />
        <StatCard icon={<CheckCircle2 size={24} />} label="Total Presentados" value={totalResultados} gradient="from-teal-500 to-emerald-600" />
        <StatCard icon={<TrendingUp size={24} />} label="Promedio Global" value={`${promedioGlobal}%`} gradient="from-blue-500 to-indigo-600" />
        <StatCard icon={<Users size={24} />} label="Rendimiento Niv." value={`${Math.max(promLiteral, promInferencial, promCritico)}%`} gradient="from-purple-500 to-fuchsia-600" />
      </div>

      {/* Breakdown by Level */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
         {/* Baterías por nivel */}
         <div className="bg-card rounded-3xl border border-card-border p-8 shadow-sm">
            <h3 className="text-base font-black text-foreground mb-8 flex items-center justify-between uppercase tracking-widest">
               <span className="flex items-center gap-2"><Layout size={18} className="text-blue-500"/> Baterías por Nivel</span>
               <div className="flex gap-2">
                  <span className="text-[9px] px-2 py-1 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-lg">{exPublicados} PUB</span>
                  <span className="text-[9px] px-2 py-1 bg-slate-50 text-slate-500 border border-slate-100 rounded-lg">{exBorradores} DRAFT</span>
               </div>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
               <MiniStat label="Literal" value={exLiteral} config={FASE_LABELS.literal} />
               <MiniStat label="Inferencial" value={exInferencial} config={FASE_LABELS.inferencial} />
               <MiniStat label="Crítico" value={exCritico} config={FASE_LABELS.critico} />
            </div>
         </div>

         {/* Rendimiento Promedio */}
         <div className="bg-card rounded-3xl border border-card-border p-8 shadow-sm">
            <h3 className="text-base font-black text-foreground mb-8 flex items-center gap-2 uppercase tracking-widest">
               <TrendingUp size={18} className="text-emerald-500"/> Promedio de Comprensión
            </h3>
            <div className="space-y-6">
               <ProgressItem label="Nivel Literal" value={promLiteral} color="bg-emerald-500" />
               <ProgressItem label="Nivel Inferencial" value={promInferencial} color="bg-blue-500" />
               <ProgressItem label="Nivel Crítico" value={promCritico} color="bg-purple-500" />
            </div>
         </div>
      </div>

      {/* Recent Activity Table */}
      <div className="bg-card rounded-3xl border border-card-border shadow-sm overflow-hidden mb-10">
        <div className="p-6 border-b border-card-border flex items-center justify-between bg-white/50 dark:bg-slate-900/50">
          <h3 className="text-xl font-bold text-foreground flex items-center gap-2">
            <Activity className="text-teal-500" size={20} /> Actividad en tus Evaluaciones
          </h3>
          <span className="text-xs font-black text-muted uppercase tracking-widest">{totalResultados} registros</span>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-table-header-bg border-b border-card-border text-[10px] text-muted uppercase tracking-[0.2em] font-black">
                <th className="px-8 py-4">Estudiante</th>
                <th className="px-8 py-4">Examen</th>
                <th className="px-8 py-4 text-center">Nivel</th>
                <th className="px-8 py-4 text-center">Puntaje</th>
                <th className="px-8 py-4 text-right">Fecha</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-card-border">
              {allResultados.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-8 py-16 text-center text-muted font-medium italic">Buscando actividad...</td>
                </tr>
              ) : (
                allResultados.map((r: any) => {
                  const x = r.examenes as any
                  const u = r.usuarios as any
                  const fl = FASE_LABELS[x?.fase_lectura || '']
                  return (
                    <tr key={r.id} className="hover:bg-card-hover transition-colors group">
                      <td className="px-8 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-600 dark:bg-teal-900/30 flex items-center justify-center font-bold text-xs uppercase">
                            {u?.nombre?.charAt(0)}
                          </div>
                          <span className="font-bold text-foreground text-sm">{u?.nombre || 'Estudiante'}</span>
                        </div>
                      </td>
                      <td className="px-8 py-4 text-sm text-muted font-medium">{x?.titulo || 'Examen'}</td>
                      <td className="px-8 py-4 text-center">
                        {fl && (
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border ${fl.color} border-current opacity-70`}>
                            {fl.label}
                          </span>
                        )}
                      </td>
                      <td className="px-8 py-4 text-center">
                        <span className={`text-lg font-black ${r.puntaje >= 60 ? 'text-emerald-500' : 'text-orange-500'}`}>
                          {r.puntaje}%
                        </span>
                      </td>
                      <td className="px-8 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5 text-xs text-muted-light font-medium uppercase tracking-tight">
                           <Clock size={12} />
                           {new Date(r.fecha).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  )
}

function StatCard({ icon, label, value, gradient }: any) {
  return (
    <div className="bg-card rounded-3xl border border-card-border p-6 shadow-sm flex flex-col items-center text-center group hover:scale-[1.02] transition-all">
       <div className={`p-4 bg-gradient-to-tr ${gradient} text-white rounded-2xl shadow-lg mb-4 group-hover:rotate-6 transition-transform`}>
          {icon}
       </div>
       <p className="text-2xl font-black text-foreground mb-1">{value}</p>
       <p className="text-[10px] font-black text-muted uppercase tracking-[0.2em]">{label}</p>
    </div>
  )
}

function MiniStat({ label, value, config }: any) {
  return (
    <div className={`p-4 rounded-2xl border ${config.bg} ${config.border} flex flex-col items-center text-center`}>
       <div className={`${config.color} mb-1 opacity-70`}>{config.icon}</div>
       <p className="text-[9px] font-black uppercase tracking-wide text-muted mb-1">{label}</p>
       <span className="text-xl font-black text-foreground">{value}</span>
    </div>
  )
}

function ProgressItem({ label, value, color }: any) {
  return (
    <div className="space-y-2">
       <div className="flex justify-between items-end">
          <p className="text-[10px] font-black text-muted uppercase tracking-widest">{label}</p>
          <p className="text-xl font-black text-foreground">{value}%</p>
       </div>
       <div className="w-full bg-input-bg rounded-full h-3 border border-card-border overflow-hidden p-0.5">
          <div className={`${color} h-full rounded-full transition-all duration-1000 shadow-sm`} style={{ width: `${value}%` }}></div>
       </div>
    </div>
  )
}
