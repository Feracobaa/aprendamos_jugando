import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import GestionPreguntas from './GestionPreguntas'

export const metadata = { title: 'Compositor de Evaluación | Admin' }

export default async function PreguntasEditorPage({ params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const resolveParams = await params;
  const examId = parseInt(resolveParams.id)

  const { data: examen, error: examError } = await supabase
    .from('examenes')
    .select('titulo, fase_lectura')
    .eq('id', examId)
    .single()

  if (examError || !examen) redirect('/admin/examenes')

  const { data: preguntas } = await supabase
    .from('preguntas')
    .select('*')
    .eq('examen_id', examId)
    .order('created_at', { ascending: true })

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-5xl mx-auto py-4 px-4 sm:px-6">
      
      <Link href="/admin/examenes" className="flex items-center gap-2 text-muted hover:text-foreground transition font-medium mb-6">
        <ArrowLeft size={18} /> Volver a los Exámenes
      </Link>

      <div className="bg-slate-900 rounded-3xl p-6 sm:p-10 shadow-2xl text-white mb-10 relative overflow-hidden">
         <div className="absolute right-0 top-0 w-64 h-64 bg-teal-500/10 blur-[100px] rounded-full"></div>
         <div className="relative z-10">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-teal-500/20 text-teal-300 border border-teal-500/30 rounded-full text-[10px] font-black uppercase tracking-widest mb-3">
              Fase: {examen.fase_lectura}
            </span>
            <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black leading-tight">
               {examen.titulo}
            </h1>
            <p className="mt-4 text-slate-400 font-medium text-sm sm:text-base max-w-2xl">
              Diseña tus ítems analíticos para evaluar el desempeño en este nivel de lectura.
            </p>
         </div>
      </div>

      <GestionPreguntas examId={examId} initialPreguntas={preguntas || []} />

    </div>
  )
}
