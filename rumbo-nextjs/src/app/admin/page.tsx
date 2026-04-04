import { createClient } from '@/utils/supabase/server'
import { 
  Users, FileText, Activity, TrendingUp, 
  BarChart3, Sparkles, Brain, Eye, Clock,
  ArrowUpRight, ArrowDownRight, GraduationCap
} from 'lucide-react'
import Link from 'next/link'

export const metadata = { title: 'Panel Admin — Aprendamos Jugando' }

export default async function AdminHome() {
  const supabase = await createClient()

  // --- Real Data Fetching ---
  const { count: totalUsuarios } = await supabase.from('usuarios').select('*', { count: 'exact', head: true })
  const { count: alumnosCount } = await supabase.from('usuarios').select('*', { count: 'exact', head: true }).eq('role', 'estudiante')
  const { count: profesCount } = await supabase.from('usuarios').select('*', { count: 'exact', head: true }).eq('role', 'profesor')
  
  const { data: allExamenes } = await supabase.from('examenes').select('fase_lectura')
  const totalExamenes = allExamenes?.length || 0
  const exLiteral = allExamenes?.filter(e => e.fase_lectura === 'literal').length || 0
  const exInferencial = allExamenes?.filter(e => e.fase_lectura === 'inferencial').length || 0
  const exCritico = allExamenes?.filter(e => e.fase_lectura === 'critico').length || 0

  const { data: allResultados } = await supabase.from('resultados').select('puntaje, fecha')
  const totalResultados = allResultados?.length || 0
  const promedioGlobal = totalResultados > 0 
    ? Math.round(allResultados!.reduce((acc, r) => acc + (r.puntaje || 0), 0) / totalResultados) 
    : 0

  const { data: ultimasEvaluaciones } = await supabase
    .from('resultados')
    .select('id, puntaje, fecha, usuarios!resultados_estudiante_id_fkey(nombre), examenes!resultados_examen_id_fkey(titulo, fase_lectura)')
    .order('fecha', { ascending: false })
    .limit(5)

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
        <div>
          <h2 className="text-3xl sm:text-4xl font-black text-foreground tracking-tight">
            Hola, <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">Administrador</span> 👋
          </h2>
          <p className="text-muted-light mt-2 font-medium text-lg">
            Aquí tienes un resumen del progreso en <span className="font-bold text-foreground">Lectura Crítica</span>.
          </p>
        </div>
        <div className="flex items-center gap-3 bg-card border border-card-border p-2 rounded-2xl shadow-sm">
           <div className="p-3 bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 rounded-xl">
             <Clock size={20} />
           </div>
           <div className="pr-4">
             <p className="text-[10px] font-bold text-muted-light uppercase tracking-widest">Estado del Sistema</p>
             <p className="text-sm font-black text-emerald-500 flex items-center gap-1.5 uppercase tracking-wide">
               <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span> Operativo
             </p>
           </div>
        </div>
      </div>

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        <KPICard 
          icon={<Users size={24} />} 
          label="Estudiantes" 
          value={alumnosCount || 0} 
          trend="+12%" 
          trendUp={true} 
          color="blue"
        />
        <KPICard 
          icon={<FileText size={24} />} 
          label="Exámenes" 
          value={totalExamenes} 
          trend="+3" 
          trendUp={true} 
          color="indigo"
        />
        <KPICard 
          icon={<Activity size={24} />} 
          label="Evaluaciones" 
          value={totalResultados} 
          trend="+28" 
          trendUp={true} 
          color="purple"
        />
        <KPICard 
          icon={<TrendingUp size={24} />} 
          label="Promedio Global" 
          value={`${promedioGlobal || 0}%`} 
          trend="-2%" 
          trendUp={false} 
          color="teal"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
        
        {/* Exam Levels Chart (Visual representation) */}
        <div className="lg:col-span-1 bg-card rounded-3xl border border-card-border p-6 shadow-sm overflow-hidden relative group">
           <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
              <BarChart3 size={120} />
           </div>
           <h3 className="text-xl font-bold text-foreground mb-6 flex items-center gap-2">
             <Sparkles className="text-blue-500" size={20} /> Niveles de Lectura
           </h3>
           <div className="space-y-6">
              <LevelProgress label="Nivel Literal" value={exLiteral} total={totalExamenes} color="bg-emerald-500" icon={<Eye size={16}/>}/>
              <LevelProgress label="Nivel Inferencial" value={exInferencial} total={totalExamenes} color="bg-blue-500" icon={<Brain size={16}/>}/>
              <LevelProgress label="Nivel Crítico" value={exCritico} total={totalExamenes} color="bg-purple-500" icon={<Sparkles size={16}/>}/>
           </div>
           <div className="mt-8 pt-6 border-t border-card-border flex justify-between items-center">
              <p className="text-xs font-bold text-muted uppercase tracking-wider">Total de Baterías</p>
              <span className="text-2xl font-black text-foreground">{totalExamenes}</span>
           </div>
        </div>

        {/* Recent Activity */}
        <div className="lg:col-span-2 bg-card rounded-3xl border border-card-border p-6 shadow-sm">
           <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-foreground flex items-center gap-2">
                <Activity className="text-indigo-500" size={20} /> Evaluaciones Recientes
              </h3>
              <Link href="/admin/estadisticas" className="text-xs font-bold text-blue-600 hover:underline">Ver todas &rarr;</Link>
           </div>
           
           <div className="space-y-1">
              {!ultimasEvaluaciones || ultimasEvaluaciones.length === 0 ? (
                <div className="py-12 text-center text-muted-light font-medium">Buscando nuevas evaluaciones...</div>
              ) : (
                ultimasEvaluaciones.map((res: any) => (
                  <div key={res.id} className="flex items-center gap-4 p-3 hover:bg-card-hover rounded-2xl transition group">
                     <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-black text-sm shadow-sm ${
                       res.puntaje >= 60 ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30' : 'bg-orange-50 text-orange-600 dark:bg-orange-900/30'
                     }`}>
                       {res.puntaje}
                     </div>
                     <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-foreground truncate">{res.usuarios?.nombre || 'Estudiante'}</p>
                        <p className="text-[11px] text-muted-light font-medium truncate flex items-center gap-1.5 uppercase tracking-wide">
                          {res.examenes?.titulo || 'Examen'} 
                          <span className="inline-block w-1 h-1 rounded-full bg-slate-300"></span>
                          <span className="text-blue-500">{res.examenes?.fase_lectura}</span>
                        </p>
                     </div>
                     <div className="text-right shrink-0">
                        <p className="text-[10px] font-bold text-muted uppercase tracking-widest mb-0.5">Fecha</p>
                        <p className="text-xs font-bold text-foreground opacity-60">
                          {new Date(res.fecha).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}
                        </p>
                     </div>
                  </div>
                ))
              )}
           </div>
        </div>

      </div>

      {/* Quick Actions Footer Card */}
      <div className="bg-gradient-to-br from-slate-900 to-indigo-950 rounded-3xl p-8 text-white relative overflow-hidden shadow-2xl shadow-indigo-500/20">
         <div className="absolute top-0 right-0 p-12 opacity-10 blur-2xl bg-blue-400 rounded-full w-64 h-64 -mr-32 -mt-32 transition-all group-hover:blur-3xl group-hover:opacity-20 animate-pulse"></div>
         <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
            <div className="max-w-xl">
               <h3 className="text-2xl font-black mb-3">Gestión de Usuarios Activa</h3>
               <p className="text-indigo-100/70 leading-relaxed font-medium">
                 Actualmente hay <span className="text-emerald-400 font-bold">{profesCount} profesores</span> ayudando a expandir la base de preguntas. Revisa la sección de usuarios para activar nuevas cuentas de docentes.
               </p>
            </div>
            <Link href="/admin/usuarios" className="inline-flex items-center gap-2 bg-white text-slate-900 px-6 py-4 rounded-2xl font-black text-sm uppercase tracking-wide hover:bg-indigo-50 hover:scale-105 active:scale-95 transition-all shadow-xl">
               <GraduationCap size={20} />
               Administrar Personal
            </Link>
         </div>
      </div>

    </div>
  )
}

function KPICard({ icon, label, value, trend, trendUp, color }: any) {
  const colors: any = {
    blue: 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 border-blue-100 dark:border-blue-800',
    indigo: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400 border-indigo-100 dark:border-indigo-800',
    purple: 'bg-purple-50 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400 border-purple-100 dark:border-purple-800',
    teal: 'bg-teal-50 text-teal-600 dark:bg-teal-900/30 dark:text-teal-400 border-teal-100 dark:border-teal-800',
  }
  return (
    <div className="bg-card rounded-3xl p-6 border border-card-border shadow-sm flex flex-col justify-between h-40 hover:shadow-lg transition-shadow group">
       <div className="flex justify-between items-start">
          <div className={`p-4 rounded-2xl ${colors[color]} shadow-sm group-hover:scale-110 transition-transform`}>
            {icon}
          </div>
          <div className={`flex items-center gap-1 text-[10px] font-black px-2 py-1 rounded-full tracking-wider ${
            trendUp ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'
          }`}>
             {trendUp ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />}
             {trend}
          </div>
       </div>
       <div>
          <p className="text-[10px] font-black text-muted uppercase tracking-[0.2em] mb-1">{label}</p>
          <p className="text-3xl font-black text-foreground">{value}</p>
       </div>
    </div>
  )
}

function LevelProgress({ label, value, total, color, icon }: any) {
  const pct = total > 0 ? (value / total) * 100 : 0
  return (
    <div className="space-y-2">
       <div className="flex justify-between items-center text-xs font-bold uppercase tracking-widest text-muted">
          <div className="flex items-center gap-2">
             <div className={`p-1.5 rounded-lg ${color} text-white`}>{icon}</div>
             <span>{label}</span>
          </div>
          <span className="text-foreground">{value}</span>
       </div>
       <div className="w-full bg-input-bg rounded-full h-2.5 overflow-hidden border border-card-border">
          <div className={`${color} h-full transition-all duration-1000 shadow-[0_0_10px_rgba(0,0,0,0.1)]`} style={{ width: `${pct}%` }}></div>
       </div>
    </div>
  )
}
