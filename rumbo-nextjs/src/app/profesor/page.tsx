import { createClient } from '@/utils/supabase/server'
import { 
  Users, FileText, Activity, TrendingUp, 
  BookOpen, Brain, Eye, Clock,
  ArrowUpRight, ArrowDownRight, Sparkles,
  Plus
} from 'lucide-react'
import Link from 'next/link'

export const metadata = { title: 'Panel Docente — Aprendamos Jugando' }

export default async function ProfesorHome() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: perfil } = await supabase.from('usuarios').select('id, nombre').eq('email', user.email).single()
  if (!perfil) return null

  // --- Real Data Fetching (Filtered by teacher) ---
  const { data: allExamenes } = await supabase.from('examenes').select('fase_lectura').eq('admin_id', perfil.id)
  const totalExamenes = allExamenes?.length || 0
  const exLiteral = allExamenes?.filter(e => e.fase_lectura === 'literal').length || 0
  const exInferencial = allExamenes?.filter(e => e.fase_lectura === 'inferencial').length || 0
  const exCritico = allExamenes?.filter(e => e.fase_lectura === 'critico').length || 0

  const { count: totalEstudiantes } = await supabase.from('usuarios').select('*', { count: 'exact', head: true }).eq('role', 'estudiante')

  // Get results for THIS teacher's exams
  const { data: myExams } = await supabase.from('examenes').select('id').eq('admin_id', perfil.id)
  const myExamIds = myExams?.map(e => e.id) || []
  
  let totalResultados = 0
  let promedioGlobal = 0
  let ultimasEvaluaciones: any[] = []

  if (myExamIds.length > 0) {
    const { data: myResults } = await supabase
      .from('resultados')
      .select('puntaje, fecha, usuarios!resultados_estudiante_id_fkey(nombre), examenes!resultados_examen_id_fkey(titulo, fase_lectura)')
      .in('examen_id', myExamIds)
      .order('fecha', { ascending: false })

    if (myResults) {
      totalResultados = myResults.length
      promedioGlobal = totalResultados > 0 
        ? Math.round(myResults.reduce((acc, r) => acc + (r.puntaje || 0), 0) / totalResultados) 
        : 0
      ultimasEvaluaciones = myResults.slice(0, 5)
    }
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
        <div>
          <h2 className="text-3xl sm:text-4xl font-black text-foreground tracking-tight">
            Hola, <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-600 to-emerald-600">{perfil.nombre.split(' ')[0]}</span> 👋
          </h2>
          <p className="text-muted-light mt-2 font-medium text-lg">
            Revisa el impacto de tus evaluaciones en <span className="font-bold text-foreground">Lectura Crítica</span>.
          </p>
        </div>
        <Link href="/profesor/examenes/nuevo" className="flex items-center gap-2 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white rounded-2xl px-6 py-4 font-black transition-all shadow-xl hover:shadow-teal-500/25">
           <Plus size={20} />
           Nuevo Examen
        </Link>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        <KPICard 
          icon={<FileText size={24} />} 
          label="Tus Exámenes" 
          value={totalExamenes} 
          trend="+1" 
          trendUp={true} 
          color="teal"
        />
        <KPICard 
          icon={<Users size={24} />} 
          label="Estudiantes" 
          value={totalEstudiantes || 0} 
          trend="+5%" 
          trendUp={true} 
          color="blue"
        />
        <KPICard 
          icon={<Activity size={24} />} 
          label="Evaluaciones" 
          value={totalResultados} 
          trend="+12" 
          trendUp={true} 
          color="emerald"
        />
        <KPICard 
          icon={<TrendingUp size={24} />} 
          label="Puntaje Promedio" 
          value={`${promedioGlobal || 0}%`} 
          trend="+3%" 
          trendUp={true} 
          color="amber"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
        
        {/* Progress by level */}
        <div className="lg:col-span-1 bg-card rounded-3xl border border-card-border p-6 shadow-sm overflow-hidden relative group">
           <h3 className="text-xl font-bold text-foreground mb-6 flex items-center gap-2">
             <BookOpen className="text-teal-500" size={20} /> Tus Desafíos
           </h3>
           <div className="space-y-6">
              <LevelProgress label="Nivel Literal" value={exLiteral} total={totalExamenes} color="bg-emerald-500" icon={<Eye size={16}/>}/>
              <LevelProgress label="Nivel Inferencial" value={exInferencial} total={totalExamenes} color="bg-blue-500" icon={<Brain size={16}/>}/>
              <LevelProgress label="Nivel Crítico" value={exCritico} total={totalExamenes} color="bg-purple-500" icon={<Sparkles size={16}/>}/>
           </div>
           <div className="mt-8 pt-6 border-t border-card-border">
              <p className="text-xs font-bold text-muted uppercase tracking-wider mb-2 text-center italic">
                Sigue creando retos para tus alumnos.
              </p>
           </div>
        </div>

        {/* Recent Results */}
        <div className="lg:col-span-2 bg-card rounded-3xl border border-card-border p-6 shadow-sm">
           <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-foreground flex items-center gap-2">
                <Activity className="text-emerald-500" size={20} /> Mi Actividad Reciente
              </h3>
              <Link href="/profesor/estadisticas" className="text-xs font-bold text-teal-600 hover:underline">Ver métricas &rarr;</Link>
           </div>
           
           <div className="space-y-1">
              {!ultimasEvaluaciones || ultimasEvaluaciones.length === 0 ? (
                <div className="py-12 text-center text-muted-light font-medium italic">
                   No hay resultados recientes para tus exámenes todavía.
                </div>
              ) : (
                ultimasEvaluaciones.map((res: any, index: number) => (
                  <div key={`${res.id}-${index}`} className="flex items-center gap-4 p-3 hover:bg-card-hover rounded-2xl transition group">
                     <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-black text-sm shadow-sm ${
                       res.puntaje >= 50 ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30' : (res.puntaje >= 30 ? 'bg-orange-50 text-orange-600 dark:bg-orange-900/30' : 'bg-red-50 text-red-600 dark:bg-red-900/30')
                     }`}>
                       {res.puntaje}%
                     </div>
                     <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-foreground truncate">{res.usuarios?.nombre || 'Estudiante'}</p>
                        <p className="text-[11px] text-muted-light font-medium truncate flex items-center gap-1.5 uppercase tracking-wide">
                          {res.examenes?.titulo || 'Examen'} 
                          <span className="inline-block w-1 h-1 rounded-full bg-slate-300"></span>
                          <span className="text-teal-500 font-bold">{res.examenes?.fase_lectura}</span>
                        </p>
                     </div>
                     <div className="text-right shrink-0">
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

    </div>
  )
}

function KPICard({ icon, label, value, trend, trendUp, color }: any) {
  const colors: any = {
    teal: 'bg-teal-50 text-teal-600 dark:bg-teal-900/30 dark:text-teal-400 border-teal-100 dark:border-teal-800',
    blue: 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 border-blue-100 dark:border-blue-800',
    emerald: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-100 dark:border-emerald-800',
    amber: 'bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400 border-amber-100 dark:border-amber-800',
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
