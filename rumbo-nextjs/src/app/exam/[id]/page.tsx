import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import ExamClient from './ExamClient'

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  return { title: `Examen | Rumbo al Saber` }
}

export default async function ExamPage({ params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const resolveParams = await params;
  const examId = parseInt(resolveParams.id)

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Fetch examen info
  const { data: examen, error: examError } = await supabase
    .from('examenes')
    .select('id, titulo, tiempo_limite')
    .eq('id', examId)
    .single()

  if (examError || !examen) {
    return <div className="p-10 p-center">Examen no encontrado o protegido.</div>
  }

  // Fetch preguntas correspondientes a este examen
  // Seleccionamos solo los campos permitidos e inseguros para el cliente
  const { data: preguntas, error: qsError } = await supabase
    .from('preguntas')
    .select('id, enunciado, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta')
    .eq('examen_id', examId)

  if (qsError || !preguntas) {
    return <div className="p-10 p-center">Error al cargar preguntas.</div>
  }

  return (
    <ExamClient 
      examId={examen.id} 
      titulo={examen.titulo} 
      tiempoLimiteMinutos={examen.tiempo_limite || 60} 
      preguntas={preguntas} 
    />
  )
}
