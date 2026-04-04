import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, CheckCircle2, BarChart3, AlertCircle } from 'lucide-react'

export const metadata = {
  title: 'Mis Resultados | Rumbo al Saber',
}

export default async function ResultadosPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: perfil } = await supabase.from('usuarios').select('id, nombre').eq('email', user.email).single()
  if (!perfil) redirect('/login')

  const { data: resultados } = await supabase
    .from('resultados')
    .select(`
      id, puntaje, fecha, 
      examenes ( titulo )
    `)
    .eq('estudiante_id', perfil.id)
    .order('fecha', { ascending: false })

  return (
    <div className="min-h-screen bg-background text-foreground font-sans">
      
      {/* Navbar Simple */}
      <nav className="bg-card border-b border-card-border px-4 sm:px-6 py-3 sm:py-4 flex justify-between items-center shadow-sm">
        <Link href="/dashboard" className="flex items-center gap-2 text-muted hover:text-foreground transition font-medium text-sm">
          <ArrowLeft size={20} />
          <span className="hidden sm:inline">Volver al Hub</span>
        </Link>
        <span className="font-bold text-foreground">Boletín Académico</span>
        <div className="w-8"></div>
      </nav>

      <main className="max-w-4xl mx-auto p-4 md:p-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
        <header className="mb-8 sm:mb-10 text-center">
          <div className="w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-tr from-purple-500 to-indigo-600 rounded-2xl mx-auto mb-4 flex items-center justify-center text-white shadow-lg">
            <BarChart3 size={28} />
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
            Historial de Evaluaciones
          </h2>
          <p className="text-muted mt-2 text-sm sm:text-base">
            Revisa tus puntajes históricos obtenidos en todos tus exámenes pasados.
          </p>
        </header>

        <section className="bg-card rounded-3xl shadow-sm border border-card-border overflow-hidden">
          
          <div className="p-4 sm:p-6 md:p-8 bg-table-header-bg border-b border-card-border flex flex-col sm:flex-row justify-between items-center gap-3 sm:gap-4">
             <div className="flex items-center gap-3">
               <AlertCircle className="text-indigo-500" size={24} />
               <h3 className="font-bold text-lg sm:text-xl text-foreground">Registro Global</h3>
             </div>
             <div className="bg-indigo-100 text-indigo-700 px-4 py-1.5 rounded-full text-sm font-bold dark:bg-indigo-900/30 dark:text-indigo-300">
               {resultados?.length || 0} Evaluaciones
             </div>
          </div>

          <div className="divide-y divide-card-border">
            {!resultados || resultados.length === 0 ? (
              <div className="p-10 text-center text-muted">
                Aún no has completado ningún examen.
              </div>
            ) : (
              resultados.map((res: any) => (
                <div key={res.id} className="p-4 sm:p-6 md:p-8 flex flex-col sm:flex-row gap-4 sm:gap-6 justify-between items-center hover:bg-card-hover transition-colors">
                  <div className="flex-1 w-full text-center sm:text-left">
                    <h4 className="font-bold text-base sm:text-lg text-foreground mb-1">{res.examenes?.titulo || 'Examen desconocido'}</h4>
                    <p className="text-muted-light text-sm font-medium">
                      Realizado el: {new Date(res.fecha).toLocaleString()}
                    </p>
                  </div>

                  <div className={`flex flex-col flex-shrink-0 items-center justify-center px-6 py-3 sm:py-4 rounded-2xl min-w-[120px] sm:min-w-[140px] border ${res.puntaje >= 50 ? 'bg-emerald-50 border-emerald-100 dark:bg-emerald-900/20 dark:border-emerald-800' : (res.puntaje >= 30 ? 'bg-orange-50 border-orange-100 dark:bg-orange-900/20 dark:border-orange-800' : 'bg-red-50 border-red-100 dark:bg-red-900/20 dark:border-red-800')}`}>
                    <span className={`text-xs sm:text-sm font-bold mb-1 flex items-center gap-1 uppercase tracking-wider ${res.puntaje >= 50 ? 'text-emerald-600 dark:text-emerald-400' : (res.puntaje >= 30 ? 'text-orange-600 dark:text-orange-400' : 'text-red-600 dark:text-red-400')}`}>
                      <CheckCircle2 size={14} /> Nota
                    </span>
                    <span className={`text-3xl sm:text-4xl font-black ${res.puntaje >= 50 ? 'text-emerald-700 dark:text-emerald-300' : (res.puntaje >= 30 ? 'text-orange-700 dark:text-orange-300' : 'text-red-700 dark:text-red-300')}`}>
                      {res.puntaje}%
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

      </main>
    </div>
  )
}
