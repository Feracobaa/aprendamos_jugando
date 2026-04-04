import { createClient } from '@/utils/supabase/server'
import Link from 'next/link'
import { deleteExam } from './acciones'
import { Trash2, Edit3, Plus, FileQuestion, CheckCircle2, BookOpen, Eye, Brain, Sparkles } from 'lucide-react'

export const metadata = { title: 'Exámenes — Lectura Crítica | Aprendamos Jugando' }

const FASE_CONFIG: Record<string, { label: string; icon: React.ReactNode; gradient: string; color: string; bg: string; border: string; darkBg: string; darkColor: string; darkBorder: string }> = {
  literal: { label: 'Nivel Literal', icon: <Eye size={18} />, gradient: 'from-emerald-500 to-green-600', color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200', darkBg: 'dark:bg-emerald-900/20', darkColor: 'dark:text-emerald-300', darkBorder: 'dark:border-emerald-800' },
  inferencial: { label: 'Nivel Inferencial', icon: <Brain size={18} />, gradient: 'from-blue-500 to-indigo-600', color: 'text-blue-700', bg: 'bg-blue-50', border: 'border-blue-200', darkBg: 'dark:bg-blue-900/20', darkColor: 'dark:text-blue-300', darkBorder: 'dark:border-blue-800' },
  critico: { label: 'Nivel Crítico', icon: <Sparkles size={18} />, gradient: 'from-purple-500 to-fuchsia-600', color: 'text-purple-700', bg: 'bg-purple-50', border: 'border-purple-200', darkBg: 'dark:bg-purple-900/20', darkColor: 'dark:text-purple-300', darkBorder: 'dark:border-purple-800' },
}

export default async function ExamenesProfesorPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: perfil } = await supabase.from('usuarios').select('id').eq('email', user.email).single()

  const { data: examenes } = await supabase
    .from('examenes')
    .select(`
      id, titulo, tiempo_limite, descripcion, created_at, fase_lectura,
      preguntas ( count ),
      resultados ( count )
    `)
    .eq('admin_id', perfil?.id)
    .order('created_at', { ascending: false })

  const fases = ['literal', 'inferencial', 'critico'] as const

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-tr from-teal-500 to-emerald-600 rounded-xl text-white shadow-lg">
              <BookOpen size={24} />
            </div>
            Mis Exámenes — Lectura Crítica
          </h2>
          <p className="text-muted mt-1 ml-0 sm:ml-14 text-sm sm:text-base">Crea, edita y gestiona tus exámenes por nivel.</p>
        </div>

        <Link href="/profesor/examenes/nuevo" className="inline-flex items-center gap-2 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white rounded-xl px-5 py-3 font-semibold transition-all shadow-lg hover:shadow-teal-500/25 w-full sm:w-auto justify-center">
          <Plus size={20} />
          Crear Examen
        </Link>
      </div>

      {/* Contadores */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {fases.map(fase => {
          const cfg = FASE_CONFIG[fase]
          const count = examenes?.filter(e => e.fase_lectura === fase).length || 0
          return (
            <div key={fase} className={`${cfg.bg} ${cfg.border} ${cfg.darkBg} ${cfg.darkBorder} border rounded-xl p-4 flex items-center gap-3`}>
              <div className={`p-2.5 rounded-xl bg-gradient-to-tr ${cfg.gradient} text-white shadow-md`}>{cfg.icon}</div>
              <div>
                <p className="text-2xl font-black text-foreground">{count}</p>
                <p className={`text-xs font-bold uppercase tracking-wider ${cfg.color} ${cfg.darkColor}`}>{cfg.label}</p>
              </div>
            </div>
          )
        })}
      </div>

      {/* Secciones por Nivel */}
      {fases.map(fase => {
        const cfg = FASE_CONFIG[fase]
        const exsFase = examenes?.filter(e => e.fase_lectura === fase) || []

        return (
          <div key={fase} className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <div className={`p-2 rounded-lg bg-gradient-to-tr ${cfg.gradient} text-white shadow-sm`}>{cfg.icon}</div>
              <h3 className="text-lg font-extrabold text-foreground">{cfg.label}</h3>
              <span className={`ml-auto text-xs font-bold px-2.5 py-1 rounded-full ${cfg.bg} ${cfg.color} ${cfg.border} border ${cfg.darkBg} ${cfg.darkColor} ${cfg.darkBorder}`}>
                {exsFase.length} examen{exsFase.length !== 1 ? 'es' : ''}
              </span>
            </div>

            <div className="bg-card rounded-2xl border border-card-border shadow-sm overflow-hidden">
              {exsFase.length === 0 ? (
                <div className="p-8 text-center text-muted">
                  <FileQuestion size={36} className="mx-auto text-muted-light mb-2" />
                  <p className="font-medium text-sm">No tienes exámenes en este nivel.</p>
                  <Link href="/profesor/examenes/nuevo" className={`inline-flex items-center gap-1 mt-3 text-xs font-bold ${cfg.color} ${cfg.darkColor} hover:underline`}>
                    <Plus size={14} /> Crear uno
                  </Link>
                </div>
              ) : (
                <>
                  {/* Desktop */}
                  <div className="hidden sm:block overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-table-header-bg text-muted text-xs uppercase tracking-wider font-bold">
                          <th className="px-6 py-3 border-b border-card-border">Título</th>
                          <th className="px-6 py-3 border-b border-card-border text-center">Tiempo</th>
                          <th className="px-6 py-3 border-b border-card-border text-center">Preguntas</th>
                          <th className="px-6 py-3 border-b border-card-border text-center">Presentados</th>
                          <th className="px-6 py-3 border-b border-card-border text-right">Acciones</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-card-border text-sm font-medium">
                        {exsFase.map(ex => (
                          <tr key={ex.id} className="hover:bg-card-hover transition-colors group">
                            <td className="px-6 py-4">
                              <p className="text-base text-foreground font-bold mb-0.5">{ex.titulo}</p>
                              <p className="text-xs text-muted-light truncate max-w-xs">{ex.descripcion || 'Sin descripción'}</p>
                            </td>
                            <td className="px-6 py-4 text-center">
                              <span className="bg-blue-50 text-blue-600 px-2.5 py-1 rounded-lg text-xs font-bold dark:bg-blue-900/30 dark:text-blue-300">{ex.tiempo_limite} min</span>
                            </td>
                            <td className="px-6 py-4 text-center font-bold text-foreground">{ex.preguntas?.[0]?.count || 0}</td>
                            <td className="px-6 py-4 text-center font-bold text-foreground">{ex.resultados?.[0]?.count || 0}</td>
                            <td className="px-6 py-4 text-right">
                              <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Link href={`/profesor/examenes/${ex.id}/preguntas`} className="p-2 text-indigo-500 hover:bg-indigo-50 rounded-lg transition dark:hover:bg-indigo-900/30" title="Editar Preguntas">
                                  <Edit3 size={18} />
                                </Link>
                                <form action={async () => { 'use server'; await deleteExam(ex.id) }}>
                                  <button className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition dark:hover:bg-red-900/30" title="Eliminar">
                                    <Trash2 size={18} />
                                  </button>
                                </form>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile */}
                  <div className="sm:hidden divide-y divide-card-border">
                    {exsFase.map(ex => (
                      <div key={ex.id} className="p-4 space-y-3">
                        <p className="font-bold text-foreground">{ex.titulo}</p>
                        <div className="flex items-center gap-3 text-xs">
                          <span className="bg-blue-50 text-blue-600 px-2 py-0.5 rounded-lg font-bold dark:bg-blue-900/30 dark:text-blue-300">{ex.tiempo_limite} min</span>
                          <span className="text-muted"><FileQuestion size={13} className="inline"/> {ex.preguntas?.[0]?.count || 0} preg.</span>
                          <span className="text-muted"><CheckCircle2 size={13} className="inline"/> {ex.resultados?.[0]?.count || 0} res.</span>
                        </div>
                        <div className="flex gap-2">
                          <Link href={`/profesor/examenes/${ex.id}/preguntas`} className="flex-1 text-center py-2 bg-indigo-50 text-indigo-600 rounded-lg text-sm font-semibold dark:bg-indigo-900/30 dark:text-indigo-300">Editar</Link>
                          <form action={async () => { 'use server'; await deleteExam(ex.id) }} className="flex-1">
                            <button className="w-full py-2 bg-red-50 text-red-600 rounded-lg text-sm font-semibold dark:bg-red-900/30 dark:text-red-300">Eliminar</button>
                          </form>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
