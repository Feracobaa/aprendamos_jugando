import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Trash2, Image as ImageIcon } from 'lucide-react'
import GestionPreguntas from './GestionPreguntas'
import { deletePregunta } from './acciones'

export const metadata = { title: 'Compositor de Evaluación | Profesor' }

export default async function PreguntasEditorPage({ params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const resolveParams = await params;
  const examId = parseInt(resolveParams.id)

  const { data: examen } = await supabase.from('examenes').select('titulo').eq('id', examId).single()
  if (!examen) redirect('/profesor/examenes')

  const { data: preguntas } = await supabase
    .from('preguntas')
    .select('id, enunciado, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, imagen')
    .eq('examen_id', examId)
    .order('created_at', { ascending: true })

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-5xl mx-auto py-4">
      
      <Link href="/profesor/examenes" className="flex items-center gap-2 text-muted hover:text-foreground transition font-medium mb-6">
        <ArrowLeft size={18} /> Volver a los Exámenes
      </Link>

      <div className="bg-slate-900 rounded-2xl sm:rounded-3xl p-5 sm:p-8 shadow-xl text-white mb-8 relative overflow-hidden">
         <div className="absolute right-0 top-0 w-64 h-64 bg-teal-500/20 blur-[80px] rounded-full"></div>
         <h2 className="text-sm font-bold text-teal-400 uppercase tracking-widest mb-1 relative z-10">Batería de Preguntas</h2>
         <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold leading-tight relative z-10">{examen.titulo}</h1>
      </div>

      <h3 className="text-xl sm:text-2xl font-bold text-foreground mb-6 flex items-center justify-between">
        Incisos Guardados ({preguntas?.length || 0})
      </h3>

      <div className="space-y-4">
        {!preguntas || preguntas.length === 0 ? (
           <div className="text-center p-8 bg-badge-bg rounded-2xl border-2 border-dashed border-card-border text-muted">
             Aún no has agregado preguntas a este esquema. Utiliza el formulario inferior para comenzar.
           </div>
        ) : (
          preguntas.map((p, idx) => (
            <div key={p.id} className="bg-card p-4 sm:p-6 rounded-2xl border border-card-border shadow-sm flex flex-col md:flex-row gap-4 sm:gap-6 relative group">
               
               <div className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 bg-badge-bg flex items-center justify-center rounded-full font-black text-muted text-lg sm:text-xl border-4 border-card shadow-sm absolute -left-2 sm:-left-4 -top-2 sm:-top-4">
                 {idx + 1}
               </div>

               <div className="flex-1 ml-6 sm:ml-6 mt-2 md:mt-0">
                 {p.imagen && (
                   <div className="mb-4 inline-flex items-center gap-2 bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-lg text-xs font-bold border border-indigo-100 dark:bg-indigo-900/30 dark:text-indigo-300 dark:border-indigo-800">
                     <ImageIcon size={14} /> Contiene Imagen Adjunta
                   </div>
                 )}
                 <h4 className="text-base sm:text-lg font-bold text-foreground mb-4">{p.enunciado}</h4>
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm font-medium">
                    <div className={`p-2 rounded-lg border ${p.respuesta_correcta === 'A' ? 'bg-teal-50 border-teal-200 text-teal-800 dark:bg-teal-900/20 dark:border-teal-800 dark:text-teal-300' : 'bg-badge-bg border-card-border text-muted'}`}>A. {p.opcion_a}</div>
                    <div className={`p-2 rounded-lg border ${p.respuesta_correcta === 'B' ? 'bg-teal-50 border-teal-200 text-teal-800 dark:bg-teal-900/20 dark:border-teal-800 dark:text-teal-300' : 'bg-badge-bg border-card-border text-muted'}`}>B. {p.opcion_b}</div>
                    <div className={`p-2 rounded-lg border ${p.respuesta_correcta === 'C' ? 'bg-teal-50 border-teal-200 text-teal-800 dark:bg-teal-900/20 dark:border-teal-800 dark:text-teal-300' : 'bg-badge-bg border-card-border text-muted'}`}>C. {p.opcion_c}</div>
                    <div className={`p-2 rounded-lg border ${p.respuesta_correcta === 'D' ? 'bg-teal-50 border-teal-200 text-teal-800 dark:bg-teal-900/20 dark:border-teal-800 dark:text-teal-300' : 'bg-badge-bg border-card-border text-muted'}`}>D. {p.opcion_d}</div>
                 </div>
               </div>

               <div className="flex-shrink-0 flex items-start justify-end">
                 <form action={async () => {
                   'use server';
                   await deletePregunta(p.id, examId)
                 }}>
                   <button className="text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 p-2 rounded-xl transition" title="Borrar">
                     <Trash2 size={20} />
                   </button>
                 </form>
               </div>
            </div>
          ))
        )}
      </div>

      <GestionPreguntas examId={examId} />

    </div>
  )
}
