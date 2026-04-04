'use client'

import { createExam } from '../acciones'
import { ArrowLeft, Save, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { useState, useTransition } from 'react'

export default function CrearExamenPage() {
  const [isPending, startTransition] = useTransition()
  const [mensaje, setMensaje] = useState<{ tipo: 'error'; texto: string } | null>(null)

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setMensaje(null)
    const formData = new FormData(e.currentTarget)
    
    startTransition(async () => {
      const res = await createExam(formData)
      if (res?.error) {
        setMensaje({ tipo: 'error', texto: res.error })
      }
      // If success, createExam will automatically redirect us.
    })
  }

  return (
    <div className="max-w-3xl mx-auto py-4 sm:py-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      <Link href="/admin/examenes" className="flex items-center gap-2 text-muted hover:text-foreground transition font-medium mb-8">
        <ArrowLeft size={18} />
        Volver a Exámenes
      </Link>

      <div className="bg-card rounded-3xl p-5 sm:p-8 border border-card-border shadow-sm">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground mb-2">Crear Examen de Lectura Crítica</h2>
        <p className="text-muted mb-8">
          Inicia configurando la metada del examen. Podrás añadirle preguntas específicas en el siguiente paso.
        </p>

        {mensaje && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl font-bold text-sm">
            {mensaje.texto}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-bold text-muted ml-1 uppercase tracking-wide">
              Título de la Evaluación
            </label>
            <input
              className="w-full bg-input-bg border border-input-border rounded-xl px-4 py-3 text-foreground placeholder-muted-light focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition"
              name="titulo"
              placeholder="Ej: Comprensión de textos narrativos"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-muted ml-1 uppercase tracking-wide">
              Instrucciones / Descripción (Opcional)
            </label>
            <textarea
              className="w-full bg-input-bg border border-input-border rounded-xl px-4 py-3 text-foreground placeholder-muted-light focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition"
              name="descripcion"
              rows={4}
              placeholder="Ej: Lee cuidadosamente cada texto antes de responder. Cada pregunta tiene una sola respuesta correcta."
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-muted ml-1 uppercase tracking-wide">
                 Tiempo Límite (Minutos)
              </label>
              <input
                className="w-full bg-input-bg border border-input-border rounded-xl px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-teal-500 transition font-mono text-xl"
                name="tiempo_limite"
                type="number"
                min="1"
                max="300"
                defaultValue="60"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-muted ml-1 uppercase tracking-wide">
                Fase de Lectura Crítica
              </label>
              <select
                name="fase_lectura"
                className="w-full bg-input-bg border border-input-border rounded-xl px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-teal-500 transition appearance-none cursor-pointer"
                required
              >
                <option value="" className="bg-card">Selecciona una fase...</option>
                <option value="literal" className="bg-card">Nivel Literal</option>
                <option value="inferencial" className="bg-card">Nivel Inferencial</option>
                <option value="critico" className="bg-card">Nivel Crítico</option>
              </select>
            </div>
          </div>

          <hr className="border-card-border my-8" />

          <div className="flex flex-col sm:flex-row justify-end gap-3">
             <Link href="/admin/examenes" className="px-6 py-3 rounded-xl font-bold bg-badge-bg text-muted hover:bg-card-hover transition text-center">
               Cancelar
             </Link>
             <button disabled={isPending} type="submit" className="flex items-center justify-center gap-2 px-8 py-3 rounded-xl font-bold bg-teal-600 hover:bg-teal-700 disabled:bg-slate-400 text-white shadow-md hover:shadow-lg transition">
               {isPending ? <Loader2 size={20} className="animate-spin" /> : <Save size={20} />}
               Guardar y Agregar Preguntas
             </button>
          </div>
        </form>
      </div>

    </div>
  )
}
