'use client'

import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { addPregunta } from './acciones'
import { ImageIcon, Save, Loader2, Target } from 'lucide-react'

export default function GestionPreguntas({ examId }: { examId: number }) {
  const [loading, setLoading] = useState(false)
  const supabase = createClient()
  
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    const file = formData.get('imagen') as File | null
    let imagen: string | null = null

    try {
      // Si hay archivo e intentamos subirlo a 'imagenes_preguntas'
      if (file && file.size > 0) {
        const fileExt = file.name.split('.').pop()
        const fileName = `${Math.random()}.${fileExt}`
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('imagenes_preguntas')
          .upload(fileName, file)
        
        if (uploadError) throw uploadError

        // Obtener url pública
        const { data: { publicUrl } } = supabase.storage
          .from('imagenes_preguntas')
          .getPublicUrl(fileName)
          
        imagen = publicUrl
      }

      // Guardar todo en DB
      const res = await addPregunta(examId, {
        enunciado: formData.get('enunciado') as string,
        opcion_a: formData.get('opcion_a') as string,
        opcion_b: formData.get('opcion_b') as string,
        opcion_c: formData.get('opcion_c') as string,
        opcion_d: formData.get('opcion_d') as string,
        respuesta_correcta: formData.get('respuesta_correcta') as string,
        imagen
      })

      if (res.success) {
        // Reset the form manually
        ;(e.target as HTMLFormElement).reset()
      } else {
        alert("Error al guardar la pregunta: " + res.error)
      }

    } catch (err: any) {
      alert("Error en subida o guardado: " + err.message)
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-card rounded-3xl p-6 md:p-8 border border-card-border shadow-sm mt-8">
      <h3 className="text-2xl font-bold text-foreground mb-6 flex items-center gap-2">
        <Target className="text-teal-500" /> Añadir Nueva Pregunta
      </h3>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <label className="text-sm font-bold text-muted ml-1 uppercase tracking-wide">
            Enunciado Principal
          </label>
          <textarea
            className="w-full bg-input-bg border border-input-border rounded-xl px-4 py-3 text-foreground placeholder-muted-light focus:outline-none focus:ring-2 focus:ring-teal-500 min-h-[100px] transition"
            name="enunciado"
            placeholder="Escribe la pregunta analítica aquí..."
            required
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-bold text-muted ml-1 uppercase tracking-wide flex items-center gap-2">
            <ImageIcon size={16} /> Adjuntar Imagen (Opcional)
          </label>
           <input
            type="file"
            name="imagen"
            accept="image/*"
            className="w-full text-sm text-muted file:mr-4 file:py-3 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-teal-50 file:text-teal-700 hover:file:bg-teal-100 dark:file:bg-teal-900/30 dark:file:text-teal-400 dark:hover:file:bg-teal-900/50 cursor-pointer border border-input-border rounded-xl bg-input-bg transition"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {['A', 'B', 'C', 'D'].map(l => (
            <div key={l} className="space-y-2">
              <label className="text-xs font-bold text-muted-light ml-1">Opción {l}</label>
              <div className="flex bg-input-bg border border-input-border rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-teal-500 transition">
                <div className="bg-badge-bg border-r border-input-border px-3 sm:px-4 flex items-center justify-center font-bold text-muted shrink-0">
                  {l}
                </div>
                <input
                  type="text"
                  name={`opcion_${l.toLowerCase()}`}
                  className="w-full min-w-0 px-3 py-2 bg-transparent focus:outline-none text-foreground"
                  required
                />
              </div>
            </div>
          ))}
        </div>

        <hr className="border-card-border my-4" />

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-blue-50/50 p-4 rounded-xl border border-blue-100 dark:bg-blue-900/10 dark:border-blue-900/30">
           <div className="w-full sm:w-auto space-y-2">
             <label className="text-sm font-bold text-foreground ml-1">Respuesta Correcta</label>
             <select name="respuesta_correcta" className="w-full sm:w-48 bg-input-bg border border-input-border rounded-lg px-4 py-2 text-foreground font-bold focus:outline-none focus:ring-2 focus:ring-blue-500 transition">
               <option value="A">Opción A</option>
               <option value="B">Opción B</option>
               <option value="C">Opción C</option>
               <option value="D">Opción D</option>
             </select>
           </div>
           
           <div className="w-full sm:w-auto space-y-2">
             <label className="text-sm font-bold text-foreground ml-1">Puntuación</label>
             <input type="number" name="puntuacion" defaultValue={1} min={1} className="w-full sm:w-32 bg-input-bg border border-input-border rounded-lg px-4 py-2 font-mono text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500 transition" />
           </div>
        </div>

        <div className="flex justify-end pt-4">
           <button 
            type="submit" 
            disabled={loading}
            className="w-full sm:w-auto flex justify-center items-center gap-2 px-8 py-4 rounded-xl font-bold bg-teal-600 hover:bg-teal-700 text-white disabled:bg-slate-300 disabled:cursor-not-allowed shadow-md hover:shadow-lg transition-all"
           >
             {loading ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
             Agregar a la Batería
           </button>
        </div>
      </form>
    </div>
  )
}
