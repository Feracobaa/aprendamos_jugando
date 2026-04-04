import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Sparkles, PlayCircle, History, AlertTriangle } from 'lucide-react'
import { startSimulacro } from './actions'

export const metadata = { title: 'Centro de Simulacros | Aprendamos Jugando' }

export default async function SimulacrosDashboardPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: perfil } = await supabase
    .from('usuarios')
    .select('id, nombre')
    .eq('email', user.email)
    .single()

  if (!perfil) return null

  const { data: misSimulacros } = await supabase
    .from('simulacros')
    .select('id, inicio, fin, estado, simulacro_resultados(puntaje_total, respuestas_correctas)')
    .eq('estudiante_id', perfil.id)
    .order('created_at', { ascending: false })

  return (
    <div className="min-h-screen bg-background text-foreground font-sans">
      {/* Navbar */}
      <nav className="bg-card border-b border-card-border px-4 sm:px-6 py-3 sm:py-4 flex items-center gap-3 sm:gap-4 shadow-sm sticky top-0 z-20">
        <Link href="/dashboard" className="text-muted hover:bg-card-hover p-2 rounded-lg transition text-sm font-bold flex items-center gap-2">
           <ArrowLeft size={16} /> <span className="hidden sm:inline">Volver al Hub</span>
        </Link>
        <div className="h-6 w-px bg-card-border"></div>
        <h1 className="font-extrabold text-base sm:text-lg text-foreground flex items-center gap-2">
          <Sparkles className="text-orange-500" size={20} /> Zona de Entrenamiento
        </h1>
      </nav>

      <main className="max-w-5xl mx-auto p-4 md:p-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="bg-gradient-to-br from-orange-400 to-red-500 rounded-2xl sm:rounded-3xl p-6 sm:p-8 shadow-xl text-white mb-8 sm:mb-10 border border-orange-300 relative overflow-hidden flex flex-col md:flex-row justify-between items-center gap-6">
           <div className="absolute right-0 top-0 w-64 h-64 bg-white/10 blur-[80px] rounded-full pointer-events-none"></div>
           <div className="relative z-10 max-w-xl text-center md:text-left">
             <h2 className="text-2xl sm:text-3xl font-black mb-3 text-white tracking-tight">Simuladores de Examen</h2>
             <p className="text-orange-100 font-medium text-base sm:text-lg leading-relaxed">
               Practica con preguntas aleatorias de Lectura Crítica. Este ambiente está aislado; tus puntajes aquí <strong className="text-white bg-black/20 px-2 py-0.5 rounded">no afectarán</strong> tu promedio oficial. 
             </p>
           </div>
           
           <form action={startSimulacro} className="relative z-10 w-full md:w-auto">
             <button type="submit" className="w-full md:w-auto bg-white text-orange-600 hover:bg-orange-50 hover:scale-105 transition-all shadow-lg rounded-2xl px-6 sm:px-8 py-3 sm:py-4 font-black flex items-center justify-center gap-3 text-base sm:text-lg">
               <PlayCircle size={24} />
               Generar Entrenamiento
             </button>
           </form>
        </div>

        <div className="bg-card rounded-2xl sm:rounded-3xl border border-card-border shadow-sm p-4 sm:p-6 md:p-8">
          <h3 className="text-lg sm:text-xl font-bold text-foreground flex items-center gap-2 mb-6">
            <History className="text-muted-light" size={24} /> Historial de Simulacros
          </h3>

          {!misSimulacros || misSimulacros.length === 0 ? (
            <div className="text-center py-10 bg-badge-bg border-2 border-dashed border-badge-border rounded-2xl text-muted font-medium">
               Aún no has tomado ningún simulacro de prueba. ¡Inténtalo!
            </div>
          ) : (
            <>
              {/* Desktop table */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-table-header-bg text-muted text-xs uppercase tracking-wider font-bold border-b border-card-border">
                      <th className="px-5 py-4">Status / ID</th>
                      <th className="px-5 py-4 text-center">Fecha Inicio</th>
                      <th className="px-5 py-4 text-center">Puntaje Logrado</th>
                      <th className="px-5 py-4 text-right">Detalles</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-card-border text-sm">
                    {misSimulacros.map((sim: any) => (
                      <tr key={sim.id} className="hover:bg-card-hover transition">
                        <td className="px-5 py-4">
                           {sim.estado === 'completado' ? (
                             <span className="bg-emerald-50 text-emerald-600 border border-emerald-100 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider block w-max mb-1 dark:bg-emerald-900/20 dark:text-emerald-300 dark:border-emerald-800">
                               Completado
                             </span>
                           ) : sim.estado === 'terminado' ? (
                             <span className="bg-red-50 text-red-600 border border-red-100 px-3 py-1 rounded-full text-xs font-bold uppercase block w-max mb-1 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800" title="Cerrado por el sistema o trampa">
                               Anulado
                             </span>
                           ) : (
                             <span className="bg-amber-50 text-amber-600 border border-amber-100 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider block w-max mb-1 dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-800">
                               Activo
                             </span>
                           )}
                           <span className="text-muted-light text-xs font-mono ml-1">#{sim.id.toString().padStart(5, '0')}</span>
                        </td>
                        <td className="px-5 py-4 text-center text-muted font-medium">
                          {new Date(sim.inicio || sim.created_at).toLocaleString('es-ES')}
                        </td>
                        <td className="px-5 py-4 text-center font-black">
                          {sim.estado === 'completado' && sim.simulacro_resultados && sim.simulacro_resultados.length > 0 ? (
                            <span className={sim.simulacro_resultados[0].puntaje_total >= 60 ? 'text-emerald-600 dark:text-emerald-400 block text-lg' : 'text-orange-600 dark:text-orange-400 block text-lg'}>
                              {Math.round(sim.simulacro_resultados[0].puntaje_total)}<span className="text-xs font-medium text-muted-light">/100</span>
                            </span>
                          ) : (
                            <span className="text-muted-light">-</span>
                          )}
                        </td>
                        <td className="px-5 py-4 text-right">
                          {sim.estado === 'completado' ? (
                            <Link href={`/dashboard/simulacros/resultado/${sim.id}`} className="inline-flex items-center text-muted hover:text-foreground hover:bg-card-hover px-3 py-1.5 rounded-lg border border-transparent transition font-bold text-xs uppercase cursor-pointer">
                              Ver Ficha
                            </Link>
                          ) : sim.estado === 'activo' ? (
                            <Link href={`/simulacro/${sim.id}`} className="inline-flex items-center text-orange-600 bg-orange-50 hover:bg-orange-100 px-3 py-1.5 rounded-lg border border-orange-200 transition font-bold text-xs uppercase cursor-pointer dark:bg-orange-900/20 dark:text-orange-300 dark:border-orange-800">
                              Retomar
                            </Link>
                          ) : (
                            <span className="text-muted-light text-xs font-medium italic"><AlertTriangle size={14} className="inline mr-1 text-red-400" />Inviable</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile cards */}
              <div className="sm:hidden space-y-3">
                {misSimulacros.map((sim: any) => (
                  <div key={sim.id} className="bg-badge-bg border border-badge-border rounded-xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      {sim.estado === 'completado' ? (
                        <span className="bg-emerald-50 text-emerald-600 border border-emerald-100 px-2.5 py-0.5 rounded-full text-xs font-bold uppercase dark:bg-emerald-900/20 dark:text-emerald-300 dark:border-emerald-800">Completado</span>
                      ) : sim.estado === 'terminado' ? (
                        <span className="bg-red-50 text-red-600 border border-red-100 px-2.5 py-0.5 rounded-full text-xs font-bold uppercase dark:bg-red-900/20 dark:text-red-300 dark:border-red-800">Anulado</span>
                      ) : (
                        <span className="bg-amber-50 text-amber-600 border border-amber-100 px-2.5 py-0.5 rounded-full text-xs font-bold uppercase dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-800">Activo</span>
                      )}
                      <span className="text-muted-light text-xs font-mono">#{sim.id.toString().padStart(5, '0')}</span>
                    </div>
                    <p className="text-xs text-muted">{new Date(sim.inicio || sim.created_at).toLocaleString('es-ES')}</p>
                    <div className="flex items-center justify-between">
                      {sim.estado === 'completado' && sim.simulacro_resultados?.length > 0 ? (
                        <span className={`text-xl font-black ${sim.simulacro_resultados[0].puntaje_total >= 60 ? 'text-emerald-600 dark:text-emerald-400' : 'text-orange-600 dark:text-orange-400'}`}>
                          {Math.round(sim.simulacro_resultados[0].puntaje_total)}/100
                        </span>
                      ) : <span className="text-muted-light">—</span>}
                      {sim.estado === 'completado' ? (
                        <Link href={`/dashboard/simulacros/resultado/${sim.id}`} className="text-xs font-bold text-foreground bg-card-hover px-3 py-1.5 rounded-lg">Ver Ficha</Link>
                      ) : sim.estado === 'activo' ? (
                        <Link href={`/simulacro/${sim.id}`} className="text-xs font-bold text-orange-600 bg-orange-50 px-3 py-1.5 rounded-lg border border-orange-200 dark:bg-orange-900/20 dark:text-orange-300">Retomar</Link>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  )
}
