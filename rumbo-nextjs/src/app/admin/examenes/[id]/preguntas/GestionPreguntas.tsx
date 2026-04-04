'use client'

import { useState, useTransition } from 'react'
import { createClient } from '@/utils/supabase/client'
import { addPregunta, editarPregunta, deletePregunta } from './acciones'
import { 
  ImageIcon, Save, Loader2, Target, Pencil, Trash2, 
  X, CheckCircle2, AlertCircle, HelpCircle, LayoutList
} from 'lucide-react'

type Pregunta = {
  id: number
  enunciado: string
  opcion_a: string
  opcion_b: string
  opcion_c: string
  opcion_d: string
  respuesta_correcta: string
  imagen: string | null
}

export default function GestionPreguntas({ examId, initialPreguntas }: { examId: number, initialPreguntas: Pregunta[] }) {
  const [preguntas, setPreguntas] = useState<Pregunta[]>(initialPreguntas)
  const [editando, setEditando] = useState<Pregunta | null>(null)
  const [loading, setLoading] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [mensaje, setMensaje] = useState<{ tipo: 'ok' | 'error'; texto: string } | null>(null)
  
  const supabase = createClient()
  
  const resetForm = (form: HTMLFormElement) => {
    form.reset()
    setEditando(null)
  }

  const handleEditClick = (p: Pregunta) => {
    setEditando(p)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleDelete = async (id: number) => {
    if (!confirm('¿Estás seguro de eliminar esta pregunta? Esta acción no se puede deshacer.')) return
    
    startTransition(async () => {
      const res = await deletePregunta(id, examId)
      if (res.success) {
        setPreguntas(prev => prev.filter(p => p.id !== id))
        setMensaje({ tipo: 'ok', texto: 'Pregunta eliminada correctamente.' })
      } else {
        setMensaje({ tipo: 'error', texto: res.error || 'Error al eliminar.' })
      }
    })
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    const file = formData.get('imagen') as File | null
    let imagenUrl: string | null = editando?.imagen || null

    try {
      // Subida de imagen si hay archivo nuevo
      if (file && file.size > 0) {
        const fileExt = file.name.split('.').pop()
        const fileName = `${Math.random()}.${fileExt}`
        const { error: uploadError } = await supabase.storage
          .from('imagenes_preguntas')
          .upload(fileName, file)
        
        if (uploadError) throw uploadError

        const { data: { publicUrl } } = supabase.storage
          .from('imagenes_preguntas')
          .getPublicUrl(fileName)
          
        imagenUrl = publicUrl
      }

      const preguntaData = {
        enunciado: formData.get('enunciado') as string,
        opcion_a: formData.get('opcion_a') as string,
        opcion_b: formData.get('opcion_b') as string,
        opcion_c: formData.get('opcion_c') as string,
        opcion_d: formData.get('opcion_d') as string,
        respuesta_correcta: formData.get('respuesta_correcta') as string,
        imagen: imagenUrl
      }

      let res
      if (editando) {
        res = await editarPregunta(editando.id, examId, preguntaData)
      } else {
        res = await addPregunta(examId, preguntaData)
      }

      if (res.success) {
        setMensaje({ tipo: 'ok', texto: editando ? 'Pregunta actualizada.' : 'Pregunta guardada.' })
        // Refetch or update local state (for simplicity, we can reload or find a better way)
        // Here we just reload or show success and reset.
        // In a real app we'd fetch the updated list or the new item.
        // For now, let's just trigger a revalidation (done in server action) and clear.
        window.location.reload() 
      } else {
        setMensaje({ tipo: 'error', texto: res.error || 'Error al guardar.' })
      }

    } catch (err: any) {
      setMensaje({ tipo: 'error', texto: err.message })
    } finally {
      setLoading(false)
    }
  }

  if (mensaje) {
     setTimeout(() => setMensaje(null), 4000)
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      
      {/* Formulario (Pegado al top para fácil acceso) */}
      <div className="lg:col-span-5 sticky top-6">
        <div className="bg-card rounded-3xl border border-card-border p-6 sm:p-8 shadow-xl">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-black text-foreground flex items-center gap-2">
              <Target className={editando ? "text-amber-500" : "text-teal-500"} /> 
              {editando ? 'Editando Reactivo' : 'Nuevo Reactivo'}
            </h3>
            {editando && (
              <button 
                onClick={() => setEditando(null)} 
                className="text-muted hover:text-foreground transition p-1 bg-badge-bg rounded-lg"
              >
                <X size={18} />
              </button>
            )}
          </div>

          {mensaje && (
            <div className={`mb-6 p-4 rounded-2xl border text-xs font-bold animate-in fade-in slide-in-from-top-2 duration-300 ${
              mensaje.tipo === 'ok' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-red-50 border-red-200 text-red-700'
            }`}>
              {mensaje.texto}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-black text-muted-light uppercase tracking-widest ml-1">Enunciado Analítico</label>
              <textarea
                className="w-full bg-input-bg border border-input-border rounded-2xl px-4 py-4 text-foreground placeholder-muted-light focus:outline-none focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500 min-h-[140px] transition-all text-sm font-medium"
                name="enunciado"
                defaultValue={editando?.enunciado || ''}
                placeholder="Plantea un problema de comprensión lectora..."
                required
              />
            </div>

            <div className="space-y-2">
               <label className="text-xs font-black text-muted-light uppercase tracking-widest ml-1 flex items-center gap-2">
                  <ImageIcon size={14} /> Apoyo Visual (JPG/PNG)
               </label>
               <div className="relative group">
                  <input
                    type="file"
                    name="imagen"
                    accept="image/*"
                    className="w-full text-[10px] text-muted-light file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-[10px] file:font-black file:uppercase file:bg-slate-100 dark:file:bg-slate-800 file:text-slate-600 dark:file:text-slate-300 hover:file:bg-slate-200 cursor-pointer border border-input-border rounded-2xl bg-badge-bg transition-all p-1"
                  />
                  {editando?.imagen && (
                    <p className="mt-2 text-[10px] text-teal-600 font-bold flex items-center gap-1 leading-none">
                      <CheckCircle2 size={10} /> Ya tiene una imagen guardada. Adjunta una nueva para reemplazarla.
                    </p>
                  )}
               </div>
            </div>

            <div className="space-y-4 pt-2">
               <label className="text-xs font-black text-muted-light uppercase tracking-widest ml-1">Opciones de Respuesta</label>
               <div className="grid grid-cols-1 gap-3">
                {['A', 'B', 'C', 'D'].map(l => (
                    <div key={l} className="flex bg-badge-bg border border-card-border rounded-2xl overflow-hidden focus-within:ring-2 focus-within:ring-teal-500/20 transition-all">
                      <div className="bg-slate-100 dark:bg-slate-800 border-r border-card-border w-12 flex items-center justify-center font-black text-muted shrink-0 text-sm">
                        {l}
                      </div>
                      <input
                        type="text"
                        name={`opcion_${l.toLowerCase()}`}
                        defaultValue={(editando as any)?.[`opcion_${l.toLowerCase()}`] || ''}
                        className="w-full px-4 py-3 bg-transparent focus:outline-none text-foreground text-sm font-medium"
                        placeholder={`Opción ${l}...`}
                        required
                      />
                    </div>
                ))}
               </div>
            </div>

            <div className="bg-slate-50 dark:bg-slate-900/40 p-5 rounded-2xl border border-card-border border-dashed">
               <label className="text-[10px] font-black text-muted uppercase tracking-widest mb-3 block">Validación del Ítem</label>
               <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <select 
                      name="respuesta_correcta" 
                      defaultValue={editando?.respuesta_correcta || 'A'}
                      className="w-full bg-white dark:bg-slate-800 border border-card-border rounded-xl px-4 py-3 text-foreground font-black text-sm outline-none focus:ring-2 focus:ring-teal-500 transition shadow-sm"
                    >
                      <option value="A">RESPUESTA A</option>
                      <option value="B">RESPUESTA B</option>
                      <option value="C">RESPUESTA C</option>
                      <option value="D">RESPUESTA D</option>
                    </select>
                  </div>
               </div>
            </div>

            <button 
              type="submit" 
              disabled={loading || isPending}
              className={`w-full flex items-center justify-center gap-2 py-4 rounded-2xl font-black text-sm uppercase tracking-widest text-white shadow-xl transition-all active:scale-[0.98] ${
                editando 
                ? "bg-gradient-to-r from-amber-500 to-orange-600 hover:shadow-orange-500/20" 
                : "bg-gradient-to-r from-teal-600 to-emerald-600 hover:shadow-teal-500/20"
              }`}
            >
              {loading || isPending ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
              {editando ? 'Actualizar Cambios' : 'Guardar Pregunta'}
            </button>
          </form>
        </div>
      </div>

      {/* Lista de Preguntas */}
      <div className="lg:col-span-7 space-y-6">
        <h3 className="text-xl font-black text-foreground flex items-center gap-2 px-2">
          <LayoutList className="text-blue-500" /> Banco de Ítems ({preguntas.length})
        </h3>
        
        {preguntas.length === 0 ? (
          <div className="p-12 text-center bg-badge-bg rounded-3xl border-2 border-dashed border-card-border">
             <HelpCircle className="mx-auto text-muted-light mb-4" size={48} />
             <p className="font-bold text-muted text-lg">No hay preguntas todavía.</p>
             <p className="text-muted-light text-sm mt-1">Usa el formulario para empezar a poblar este examen.</p>
          </div>
        ) : (
          preguntas.map((p, idx) => (
            <div key={p.id} className="bg-card rounded-3xl border border-card-border overflow-hidden shadow-sm hover:shadow-md transition-all group">
               <div className="p-6 sm:p-8 space-y-6">
                  {/* Header de la Pregunta */}
                  <div className="flex justify-between items-start gap-4">
                     <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-black text-slate-500 border border-card-border shadow-inner">
                          {idx + 1}
                        </div>
                        {p.imagen && (
                          <div className="px-3 py-1 bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 rounded-lg text-[9px] font-black uppercase tracking-tighter flex items-center gap-1.5 border border-blue-100 dark:border-blue-800">
                             <ImageIcon size={12} /> Multimedia
                          </div>
                        )}
                     </div>
                     <div className="flex gap-2">
                        <button 
                          onClick={() => handleEditClick(p)}
                          className="p-2.5 bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-300 rounded-xl hover:bg-blue-100 transition shadow-sm border border-blue-100 dark:border-blue-800"
                        >
                          <Pencil size={16} />
                        </button>
                        <button 
                          onClick={() => handleDelete(p.id)}
                          className="p-2.5 bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-300 rounded-xl hover:bg-red-100 transition shadow-sm border border-red-100 dark:border-red-800"
                        >
                          <Trash2 size={16} />
                        </button>
                     </div>
                  </div>

                  {/* Cuerpo */}
                  <div className="space-y-6">
                     <p className="text-lg font-bold text-foreground leading-relaxed">
                        {p.enunciado}
                     </p>
                     
                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {[
                          { l: 'A', text: p.opcion_a },
                          { l: 'B', text: p.opcion_b },
                          { l: 'C', text: p.opcion_c },
                          { l: 'D', text: p.opcion_d }
                        ].map(opt => (
                          <div 
                            key={opt.l}
                            className={`p-4 rounded-2xl border transition-all text-sm font-medium ${
                              p.respuesta_correcta === opt.l 
                              ? "bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-900/20 dark:border-emerald-800 dark:text-emerald-300 shadow-sm ring-1 ring-emerald-500/20" 
                              : "bg-badge-bg border-card-border text-muted-light opacity-60"
                            }`}
                          >
                            <span className="font-black mr-2">{opt.l}.</span> {opt.text}
                          </div>
                        ))}
                     </div>
                  </div>
               </div>
               
               {/* Footer con info de importancia */}
               <div className="px-8 py-3 bg-table-header-bg border-t border-card-border flex justify-between items-center">
                  <div className="flex items-center gap-1.5 grayscale group-hover:grayscale-0 transition-all">
                     <AlertCircle size={12} className="text-amber-500" />
                     <span className="text-[10px] font-black uppercase text-muted tracking-widest">Revisar consistencia pedagógica</span>
                  </div>
                  <span className="text-[11px] font-black text-emerald-500 uppercase">Correcta: {p.respuesta_correcta}</span>
               </div>
            </div>
          ))
        )}
      </div>

    </div>
  )
}
