import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { LogOut, UserRound, UserCircle, Sparkles, AlertCircle, CheckCircle2, ChevronRight, BookOpen } from 'lucide-react'
import Link from 'next/link'
import ThemeToggle from '../components/ThemeToggle'

export const metadata = {
  title: 'Mi Hub | Aprendamos Jugando',
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ fase?: string }>
}) {
  const supabase = await createClient()
  const resolvedParams = await searchParams
  const fase = resolvedParams?.fase

  // 1. Obtener sesión segurizada (Auth)
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // 2. Extraer rol y perfil desde la tabla pública `usuarios`
  const { data: perfil } = await supabase
    .from('usuarios')
    .select('id, nombre, role')
    .eq('email', user.email)
    .single()

  if (!perfil) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="bg-card border border-red-200 dark:border-red-800 rounded-2xl shadow-lg p-8 max-w-md w-full text-center space-y-6">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto">
            <AlertCircle size={32} className="text-red-500" />
          </div>
          <h2 className="text-xl font-extrabold text-foreground">Cuenta no encontrada</h2>
          <p className="text-muted text-sm leading-relaxed">
            Tu sesión de autenticación existe, pero tu perfil fue eliminado de la plataforma por un administrador.
            Por favor, cierra sesión y contacta al administrador si crees que es un error.
          </p>
          <form action="/auth/signout" method="post">
            <button className="w-full bg-red-600 hover:bg-red-700 text-white rounded-xl py-3 font-bold transition-colors shadow-md flex items-center justify-center gap-2">
              <LogOut size={18} /> Cerrar Sesión
            </button>
          </form>
        </div>
      </div>
    )
  }

  // SI ES ADMIN O PROFESOR LO MANDAMOS A SU PANEL INMEDIATAMENTE
  if (perfil.role === 'admin') {
    redirect('/admin')
  }
  if (perfil.role === 'profesor') {
    redirect('/profesor')
  }

  // CONTINUAMOS SOLO SI ES ESTUDIANTE

  // 3. Buscar resultados previos del estudiante
  const { data: misResultados } = await supabase
    .from('resultados')
    .select('examen_id, puntaje')
    .eq('estudiante_id', perfil.id)

  const examenesHechosIds = misResultados?.map(r => r.examen_id) || []

  // 4. Buscar exámenes disponibles que no haya hecho
  let queryExamenesPendientes = supabase.from('examenes').select('id, titulo, tiempo_limite, fase_lectura')
  
  if (examenesHechosIds.length > 0) {
    queryExamenesPendientes = queryExamenesPendientes.not('id', 'in', `(${examenesHechosIds.join(',')})`)
  }

  if (fase) {
    queryExamenesPendientes = queryExamenesPendientes.eq('fase_lectura', fase)
  }

  const { data: examenesPendientes } = await queryExamenesPendientes

  return (
    <div className="min-h-screen bg-background text-foreground font-sans">
      {/* Navbar Superior */}
      <nav className="bg-card border-b border-card-border px-4 sm:px-6 py-3 sm:py-4 flex justify-between items-center shadow-sm sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-tr from-teal-400 to-blue-600 p-2 rounded-lg text-white shadow-md">
            <BookOpen size={24} />
          </div>
          <h1 className="font-extrabold text-xl sm:text-2xl text-transparent bg-clip-text bg-gradient-to-r from-teal-600 to-blue-800 hidden sm:block">
            Aprendamos Jugando
          </h1>
        </div>
        
        <div className="flex items-center gap-2 sm:gap-4">
          <div className="flex items-center gap-2 text-sm text-muted font-medium bg-badge-bg px-3 py-1.5 rounded-full border border-badge-border">
            <UserRound size={16} className="text-blue-500" />
            <span className="hidden md:inline">{perfil.nombre}</span>
            <span className="text-teal-700 bg-teal-100 px-2 py-0.5 rounded-full text-xs ml-1 font-bold">Estudiante</span>
          </div>
          
          <ThemeToggle />
          
          <Link href="/perfil" className="text-muted hover:bg-card-hover hover:text-blue-500 p-2 rounded-full transition-all flex items-center justify-center" title="Mi Perfil">
            <UserCircle size={20} />
          </Link>

          <form action="/auth/signout" method="post">
            <button className="text-muted hover:bg-red-50 hover:text-red-500 p-2 rounded-full transition-all flex items-center justify-center">
              <LogOut size={20} />
            </button>
          </form>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="max-w-6xl mx-auto p-4 md:p-8">
        <header className="mb-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-foreground tracking-tight">
            Hola, {perfil.nombre.split(' ')[0]} 👋
          </h2>
          
          {/* Panel Explicativo */}
          <div className="mt-6 bg-gradient-to-r from-teal-50 to-blue-50 border border-teal-200 rounded-2xl p-6 dark:from-teal-900/10 dark:to-blue-900/10 dark:border-teal-800/50 shadow-sm">
             <h3 className="text-xl font-bold text-teal-800 dark:text-teal-400 mb-2 flex items-center gap-2">
               ¿Qué es la Lectura Crítica?
             </h3>
             <p className="text-teal-900 dark:text-teal-300/80 text-sm sm:text-base leading-relaxed">
               La lectura crítica es la capacidad de analizar, interpretar y evaluar un texto más allá de su significado literal. 
               Se divide en <strong>3 fases progresivas</strong> que miden tu comprensión profunda. ¡Selecciona una fase para comenzar!
             </p>
          </div>
        </header>

        {/* Fases Navigator */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
           <Link href="/dashboard?fase=literal" className={`p-6 rounded-2xl shadow-sm border transition-all cursor-pointer group ${fase === 'literal' ? 'border-teal-500 bg-teal-500/5 dark:bg-teal-500/10 shadow-md transform -translate-y-1' : 'border-card-border bg-card hover:border-teal-300 hover:bg-teal-50/50'}`}>
             <div className="flex items-center justify-between mb-2">
               <h4 className={`font-bold text-lg ${fase === 'literal' ? 'text-teal-600 dark:text-teal-400' : 'text-foreground group-hover:text-teal-600 transition-colors'}`}>Nivel 1: Literal</h4>
             </div>
             <p className="text-sm text-muted">Comprender lo explícito y recuperar los datos básicos y detalles del texto.</p>
           </Link>
           
           <Link href="/dashboard?fase=inferencial" className={`p-6 rounded-2xl shadow-sm border transition-all cursor-pointer group ${fase === 'inferencial' ? 'border-teal-500 bg-teal-500/5 dark:bg-teal-500/10 shadow-md transform -translate-y-1' : 'border-card-border bg-card hover:border-teal-300 hover:bg-teal-50/50'}`}>
             <div className="flex items-center justify-between mb-2">
               <h4 className={`font-bold text-lg ${fase === 'inferencial' ? 'text-teal-600 dark:text-teal-400' : 'text-foreground group-hover:text-teal-600 transition-colors'}`}>Nivel 2: Inferencial</h4>
             </div>
             <p className="text-sm text-muted">Deducir lo implícito, leer entre líneas y lograr sacar tus propias conclusiones.</p>
           </Link>
           
           <Link href="/dashboard?fase=critico" className={`p-6 rounded-2xl shadow-sm border transition-all cursor-pointer group ${fase === 'critico' ? 'border-teal-500 bg-teal-500/5 dark:bg-teal-500/10 shadow-md transform -translate-y-1' : 'border-card-border bg-card hover:border-teal-300 hover:bg-teal-50/50'}`}>
             <div className="flex items-center justify-between mb-2">
               <h4 className={`font-bold text-lg ${fase === 'critico' ? 'text-teal-600 dark:text-teal-400' : 'text-foreground group-hover:text-teal-600 transition-colors'}`}>Nivel 3: Crítico</h4>
             </div>
             <p className="text-sm text-muted">Aprender a evaluar el texto integralmente para argumentar tu posición.</p>
           </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          
          {/* Columna Izquierda: Acción Principal (Exámenes) */}
          <div className="lg:col-span-2 space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-700">
            
            <section>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold flex items-center gap-2 text-foreground">
                  <AlertCircle className="text-teal-500" size={24} /> 
                  {fase ? `Evaluaciones: ${fase.charAt(0).toUpperCase() + fase.slice(1)}` : 'Todas las Evaluaciones Pendientes'}
                </h3>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {!examenesPendientes || examenesPendientes.length === 0 ? (
                  <div className="col-span-1 sm:col-span-2 border-2 border-dashed border-card-border rounded-2xl p-8 text-center text-muted bg-card">
                    <CheckCircle2 size={40} className="mx-auto text-muted-light mb-3" />
                    <p className="font-medium">
                      {fase ? '¡No tienes exámenes pendientes en esta fase!' : '¡Estás al día con todas las fases!'}
                    </p>
                    <p className="text-sm mt-1">Selecciona otra fase en la parte superior para continuar aprendiendo.</p>
                  </div>
                ) : (
                  examenesPendientes.map((ex) => (
                    <div key={ex.id} className="bg-card p-6 rounded-2xl shadow-sm border border-card-border hover:shadow-md hover:border-teal-200 transition-all group flex flex-col justify-between">
                      <div>
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-bold text-lg text-foreground leading-tight group-hover:text-teal-600 transition-colors">{ex.titulo}</h4>
                          <span className="bg-blue-50 text-blue-600 px-2.5 py-1 text-xs font-bold rounded-lg border border-blue-100 whitespace-nowrap dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800">
                            {ex.tiempo_limite} min
                          </span>
                        </div>
                        {ex.fase_lectura && (
                          <span className="inline-block mt-2 text-xs font-semibold px-2 py-1 bg-slate-100 text-slate-600 rounded-md dark:bg-slate-800 dark:text-slate-300 uppercase tracking-wide">
                            {ex.fase_lectura}
                          </span>
                        )}
                      </div>
                      
                      <Link 
                        href={`/exam/${ex.id}`}
                        className="mt-6 w-full flex items-center justify-center gap-2 bg-slate-900 hover:bg-teal-600 text-white rounded-xl py-2.5 font-semibold transition-all shadow-sm dark:bg-slate-700 dark:hover:bg-teal-600"
                      >
                        Iniciar Prueba <ChevronRight size={18} />
                      </Link>
                    </div>
                  ))
                )}
              </div>
            </section>

          </div>

          {/* Columna Derecha: Widgets Secundarios */}
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-8 duration-1000">
            
            <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl shadow-lg p-6 text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 blur-2xl rounded-full translate-x-10 -translate-y-10 pointer-events-none"></div>
              <h3 className="font-bold text-lg mb-2 relative z-10">Mis Resultados</h3>
              <p className="text-indigo-100 text-sm mb-6 relative z-10">
                Has completado {misResultados?.length || 0} evaluaciones en total.
              </p>
              <Link href="/dashboard/resultados" className="inline-flex items-center gap-2 bg-white/20 hover:bg-white/30 border border-white/20 backdrop-blur-md px-5 py-2.5 rounded-xl font-medium transition-all w-full justify-center relative z-10">
                Ver Boletín Histórico
              </Link>
            </div>

            <Link href="/dashboard/simulacros" className="bg-card rounded-2xl shadow-sm border border-card-border p-6 flex items-start gap-4 cursor-pointer hover:shadow-md transition block group hidden">
               {/* Hidden if we don't need simulacros, but keep code for future usage. Prompt didn't mention simulacros. Let's show it anyway since it was there and prompt said just "Exámenes". Actually, the prompt says "La sección de "Exámenes" debe quedar enfocada únicamente...", Simulacros could still exist or we can hide it. I'll hide it to reduce confusion. */}
            </Link>

          </div>
        </div>
      </main>
    </div>
  )
}
