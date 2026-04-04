import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import {
  Users, GraduationCap, BookOpen, ShieldCheck, FileText,
  CheckCircle2, BarChart3, TrendingUp, Eye, Brain, Sparkles,
  Activity, Clock, Layout
} from 'lucide-react'

export const metadata = { title: 'Estadísticas Globales | Aprendamos Jugando' }

export default async function EstadisticasPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // ====== USERS ======
  const { count: totalUsuarios } = await supabase.from('usuarios').select('*', { count: 'exact', head: true })
  const { count: totalEstudiantes } = await supabase.from('usuarios').select('*', { count: 'exact', head: true }).eq('role', 'estudiante')
  const { count: totalProfesores } = await supabase.from('usuarios').select('*', { count: 'exact', head: true }).eq('role', 'profesor')
  const { count: totalAdmins } = await supabase.from('usuarios').select('*', { count: 'exact', head: true }).eq('role', 'admin')

  // ====== EXAMS ======
  const { data: allExamenes } = await supabase.from('examenes').select('id, titulo, fase_lectura, created_at, publicado')
  const totalExamenes = allExamenes?.length || 0
  const exLiteral = allExamenes?.filter(e => e.fase_lectura === 'literal').length || 0
  const exInferencial = allExamenes?.filter(e => e.fase_lectura === 'inferencial').length || 0
  const exCritico = allExamenes?.filter(e => e.fase_lectura === 'critico').length || 0
  
  const exPublicados = allExamenes?.filter(e => e.publicado !== false).length || 0
  const exBorradores = allExamenes?.filter(e => e.publicado === false).length || 0

  // ====== RESULTS ======
  const { data: allResultados } = await supabase.from('resultados').select('id, puntaje, examen_id, fecha, usuarios!resultados_estudiante_id_fkey(nombre), examenes!resultados_examen_id_fkey(titulo, fase_lectura)')
  const totalResultados = allResultados?.length || 0
  const promedioGlobal = totalResultados > 0
    ? Math.round((allResultados!.reduce((sum, r) => sum + (r.puntaje || 0), 0) / totalResultados) * 10) / 10
    : 0

  // Promedio por nivel
  const examIdsByFase: Record<string, number[]> = {
    literal: allExamenes?.filter(e => e.fase_lectura === 'literal').map(e => e.id) || [],
    inferencial: allExamenes?.filter(e => e.fase_lectura === 'inferencial').map(e => e.id) || [],
    critico: allExamenes?.filter(e => e.fase_lectura === 'critico').map(e => e.id) || [],
  }

  function promedioByFase(fase: string) {
    const ids = examIdsByFase[fase]
    if (!ids || ids.length === 0) return 0
    const resF = allResultados?.filter(r => ids.includes(r.examen_id)) || []
    if (resF.length === 0) return 0
    return Math.round((resF.reduce((s, r) => s + (r.puntaje || 0), 0) / resF.length) * 10) / 10
  }

  const promLiteral = promedioByFase('literal')
  const promInferencial = promedioByFase('inferencial')
  const promCritico = promedioByFase('critico')

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
          <div className="p-3 bg-gradient-to-tr from-indigo-500 to-purple-600 rounded-2xl text-white shadow-xl">
            <BarChart3 size={32} />
          </div>
          Análisis del Ecosistema
        </h2>
        <p className="text-muted-light mt-2 font-medium text-lg ml-0 sm:ml-16">Estadísticas globales de Lectura Crítica en tiempo real.</p>
      </div>

      {/* Grid de Usuarios */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard icon={<Users size={24} />} label="Total Usuarios" value={totalUsuarios || 0} gradient="from-slate-600 to-slate-800" />
        <StatCard icon={<GraduationCap size={24} />} label="Estudiantes" value={totalEstudiantes || 0} gradient="from-teal-500 to-emerald-500" />
        <StatCard icon={<BookOpen size={24} />} label="Profesores" value={totalProfesores || 0} gradient="from-amber-500 to-orange-500" />
        <StatCard icon={<ShieldCheck size={24} />} label="Administradores" value={totalAdmins || 0} gradient="from-red-500 to-rose-500" />
      </div>

      {/* Grid de Exámenes y Rendimiento */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
        
        {/* Desglose de Exámenes */}
        <div className="bg-card rounded-3xl border border-card-border p-8 shadow-sm">
           <h3 className="text-xl font-bold text-foreground mb-8 flex items-center justify-between">
             <div className="flex items-center gap-2">
                <FileText size={22} className="text-blue-500" /> Baterías por Nivel
             </div>
             <div className="flex gap-2">
                <span className="text-[10px] font-black text-emerald-500 bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-100 uppercase tracking-tighter">{exPublicados} Pub.</span>
                <span className="text-[10px] font-black text-slate-500 bg-slate-50 px-2 py-1 rounded-lg border border-slate-100 uppercase tracking-tighter">{exBorradores} Draft</span>
             </div>
           </h3>
           <div className="grid grid-cols-2 gap-4">
              <MiniStat label="Nivel Literal" value={exLiteral} icon={<Eye size={16}/>} color="emerald" />
              <MiniStat label="Nivel Inferencial" value={exInferencial} icon={<Brain size={16}/>} color="blue" />
              <MiniStat label="Nivel Crítico" value={exCritico} icon={<Sparkles size={16}/>} color="purple" />
              <MiniStat label="Total General" value={totalExamenes} icon={<Layout size={16}/>} color="slate" />
           </div>
        </div>

        {/* Promedios de Comprensión */}
        <div className="bg-card rounded-3xl border border-card-border p-8 shadow-sm">
           <h3 className="text-xl font-bold text-foreground mb-8 flex items-center gap-2">
             <TrendingUp size={22} className="text-emerald-500" /> Rendimiento de Comprensión
           </h3>
           <div className="space-y-6">
              <ProgressItem label="Promedio Literal" value={promLiteral} color="bg-emerald-500" />
              <ProgressItem label="Promedio Inferencial" value={promInferencial} color="bg-blue-500" />
              <ProgressItem label="Promedio Crítico" value={promCritico} color="bg-purple-500" />
           </div>
        </div>

      </div>

      {/* Actividad Reciente */}
      <div className="bg-card rounded-3xl border border-card-border shadow-sm overflow-hidden mb-10">
        <div className="p-6 border-b border-card-border bg-white/50 dark:bg-slate-900/50 flex justify-between items-center">
          <h3 className="text-xl font-bold text-foreground flex items-center gap-2">
            <Activity className="text-indigo-500" size={20} /> Feed de Evaluaciones
          </h3>
          <span className="text-xs font-black text-muted uppercase tracking-widest">{totalResultados} presentados</span>
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
              {!allResultados || allResultados.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-8 py-16 text-center text-muted font-medium italic">No se han registrado evaluaciones todavía.</td>
                </tr>
              ) : (
                allResultados.slice(0, 15).map((r: any) => {
                  const x = r.examenes as any
                  const u = r.usuarios as any
                  const fl = FASE_LABELS[x?.fase_lectura || '']
                  return (
                    <tr key={r.id} className="hover:bg-card-hover transition-colors group">
                      <td className="px-8 py-4 font-bold text-foreground text-sm">{u?.nombre || 'Estudiante'}</td>
                      <td className="px-8 py-4 text-sm text-muted font-medium">{x?.titulo || 'Examen'}</td>
                      <td className="px-8 py-4 text-center">
                        {fl && (
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider border ${fl.color} border-current opacity-70`}>
                            {fl.label}
                          </span>
                        )}
                      </td>
                      <td className="px-8 py-4 text-center">
                        <span className={`text-lg font-black ${r.puntaje >= 50 ? 'text-emerald-500' : (r.puntaje >= 30 ? 'text-orange-500' : 'text-red-500')}`}>
                          {r.puntaje}%
                        </span>
                      </td>
                      <td className="px-8 py-4 text-right text-xs text-muted-light font-bold">
                        {new Date(r.fecha).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}
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
       <p className="text-3xl font-black text-foreground mb-1">{value}</p>
       <p className="text-[10px] font-black text-muted uppercase tracking-[0.2em]">{label}</p>
    </div>
  )
}

function MiniStat({ label, value, icon, color }: any) {
  const colors: any = {
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-900/10 dark:border-emerald-800',
    blue: 'bg-blue-50 text-blue-600 border-blue-100 dark:bg-blue-900/10 dark:border-blue-800',
    purple: 'bg-purple-50 text-purple-600 border-purple-100 dark:bg-purple-900/10 dark:border-purple-800',
    slate: 'bg-slate-50 text-slate-600 border-slate-100 dark:bg-slate-900/10 dark:border-slate-800',
  }
  return (
    <div className={`p-4 rounded-2xl border ${colors[color]} flex items-center justify-between`}>
       <div className="flex items-center gap-2">
          {icon}
          <span className="text-[10px] font-black uppercase tracking-wider">{label}</span>
       </div>
       <span className="text-xl font-black">{value}</span>
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
