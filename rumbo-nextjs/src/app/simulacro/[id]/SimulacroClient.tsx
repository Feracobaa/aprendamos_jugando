'use client'

import { useState, useEffect } from 'react'
import { Clock, ChevronRight, ChevronLeft, CheckCircle2, Loader2, Sparkles, AlertTriangle } from 'lucide-react'
import { submitSimulacro, registrarEventoSospechosoSimulacro } from './actions'

type Pregunta = {
  id: number
  enunciado: string
  opcion_a: string
  opcion_b: string
  opcion_c: string
  opcion_d: string
}

type SimulacroClientProps = {
  simulacroId: number
  tiempoLimiteMinutos: number
  preguntas: Pregunta[]
}

export default function SimulacroClient({ simulacroId, tiempoLimiteMinutos, preguntas }: SimulacroClientProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [respuestas, setRespuestas] = useState<Record<number, string>>({})
  const [timeLeft, setTimeLeft] = useState(Math.round(tiempoLimiteMinutos * 60))
  const [isFinished, setIsFinished] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [calificacion, setCalificacion] = useState<{puntaje: number, total: number} | null>(null)
  const [trampaDetectada, setTrampaDetectada] = useState(false)

  // Motor Anti-trampas
  useEffect(() => {
    if (isFinished || trampaDetectada) return

    const handleVisibilityChange = async () => {
      if (document.hidden) {
        setTrampaDetectada(true)
        setIsFinished(true)
        setIsSubmitting(true)
        await registrarEventoSospechosoSimulacro(simulacroId, 'Tab_Switch_Simulacro')
        setIsSubmitting(false)
      }
    }

    const handleBlur = async () => {
      setTrampaDetectada(true)
      setIsFinished(true)
      setIsSubmitting(true)
      await registrarEventoSospechosoSimulacro(simulacroId, 'Window_Blur_Simulacro')
      setIsSubmitting(false)
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('blur', handleBlur)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('blur', handleBlur)
    }
  }, [simulacroId, isFinished, trampaDetectada])

  // Temporizador
  useEffect(() => {
    if (timeLeft <= 0 || isFinished) {
      if (timeLeft <= 0 && !isFinished) manejarEnvio()
      return
    }
    const timer = setInterval(() => setTimeLeft((t) => t - 1), 1000)
    return () => clearInterval(timer)
  }, [timeLeft, isFinished])

  const pregunataActual = preguntas[currentIndex]
  const mins = Math.floor(timeLeft / 60)
  const secs = timeLeft % 60

  const presionarOpcion = (letra: string) => {
    setRespuestas({ ...respuestas, [pregunataActual.id]: letra })
  }

  const manejarEnvio = async () => {
    setIsFinished(true)
    setIsSubmitting(true)

    try {
      const res = await submitSimulacro(simulacroId, respuestas)
      if (res.success) {
        setCalificacion({ puntaje: res.puntaje!, total: res.total! })
      }
    } catch (e) {
      console.error(e)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (preguntas.length === 0) {
    return <div className="p-10 text-center flex flex-col items-center text-muted">
       <Sparkles size={48} className="text-orange-300 mb-4" />
       No hay preguntas disponibles para este simulacro en este momento.
    </div>
  }

  if (trampaDetectada) {
    return (
       <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4">
        <div className="bg-card p-8 sm:p-10 rounded-3xl shadow-2xl max-w-lg w-full text-center space-y-4 relative overflow-hidden border border-card-border">
          <div className="absolute top-0 left-0 right-0 h-4 bg-red-500"></div>
          <AlertTriangle size={64} className="text-red-500 mx-auto drop-shadow-lg sm:w-20 sm:h-20" />
          <h2 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">Violación de Seguridad</h2>
          <p className="text-muted font-medium text-sm sm:text-base">Se detectó que abandonaste la pestaña o la ventana perdió el foco. El simulacro ha sido anulado inmediatamente por comportamiento anómalo.</p>
          <button 
            onClick={() => window.location.href = '/dashboard/simulacros'}
            className="mt-6 px-8 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold transition w-full dark:bg-slate-700 dark:hover:bg-slate-600"
          >
            Volver a Zona de Simulacros
          </button>
        </div>
      </div>
    )
  }

  if (isFinished) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <div className="bg-card p-8 sm:p-10 rounded-2xl shadow-xl max-w-lg w-full text-center space-y-4 border border-orange-200 dark:border-orange-800 relative overflow-hidden">
          <div className="absolute right-0 top-0 w-32 h-32 bg-orange-500/10 blur-[40px] rounded-full pointer-events-none"></div>

          <div className="flex justify-center mb-6 relative z-10">
            {isSubmitting ? (
              <Loader2 size={64} className="text-orange-500 animate-spin" />
            ) : (
              <div className="bg-orange-50 text-orange-500 p-4 rounded-full dark:bg-orange-900/30"><Sparkles size={48} /></div>
            )}
          </div>
          
          <h2 className="text-2xl sm:text-3xl font-black text-foreground relative z-10 tracking-tight">
            {isSubmitting ? 'Procesando Resultados...' : '¡Simulacro Completado!'}
          </h2>
          
          <div className="text-muted font-medium relative z-10 bg-badge-bg border border-badge-border p-4 rounded-xl leading-relaxed text-sm sm:text-base">
            {isSubmitting 
              ? 'Por favor espera. Estamos auditando tus respuestas...'
              : calificacion 
                ? (
                  <div>
                    Has obtenido <strong className="text-emerald-600 text-lg dark:text-emerald-400">{calificacion.puntaje}</strong> respuestas correctas de <strong>{calificacion.total}</strong> en este entrenamiento.
                  </div>
                )
                : 'Tus respuestas han sido enviadas para su evaluación.'
            }
          </div>

          <button 
            onClick={() => window.location.href = '/dashboard/simulacros'}
            disabled={isSubmitting}
            className="mt-6 px-6 py-3 bg-orange-500 hover:bg-orange-600 shadow-md shadow-orange-500/30 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-xl font-black transition w-full relative z-10 flex items-center justify-center gap-2"
          >
            Ver Historial de Entrenamientos
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex flex-col font-sans">
      {/* Header fijo */}
      <header className="bg-card border-b border-orange-200 dark:border-orange-800 sticky top-0 z-10 px-4 sm:px-6 py-3 sm:py-4 flex flex-col sm:flex-row gap-3 sm:gap-4 justify-between items-center shadow-sm">
        <h1 className="font-bold text-lg sm:text-xl text-foreground flex items-center gap-2">
           <Sparkles className="text-orange-500" size={20} /> Entrenamiento
        </h1>
        <div className="flex items-center gap-3 bg-orange-50 dark:bg-orange-900/20 px-4 py-2 rounded-lg border border-orange-200 dark:border-orange-800">
          <Clock className={timeLeft < 60 ? 'text-red-500 animate-pulse' : 'text-orange-600 dark:text-orange-400'} size={20} />
          <span className={`font-mono font-black text-lg ${timeLeft < 60 ? 'text-red-600' : 'text-orange-700 dark:text-orange-300'}`}>
            {String(mins).padStart(2, '0')}:{String(secs).padStart(2, '0')}
          </span>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-4 md:p-8 flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-500">
        
        {/* Progress Bar */}
        <div className="mb-6 sm:mb-8">
          <div className="flex justify-between text-sm text-muted font-bold mb-2 uppercase tracking-tight">
            <span>Pregunta {currentIndex + 1} de {preguntas.length}</span>
            <span>{Math.round(((currentIndex + 1) / preguntas.length) * 100)}%</span>
          </div>
          <div className="w-full bg-badge-bg rounded-full h-3">
            <div 
              className="bg-gradient-to-r from-orange-400 to-orange-500 h-3 rounded-full transition-all duration-300" 
              style={{ width: `${((currentIndex + 1) / preguntas.length) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Question Card */}
        <div className="bg-card rounded-3xl shadow-sm border border-card-border p-5 sm:p-6 md:p-10 flex-1">
          <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-foreground mb-6 sm:mb-8 leading-snug">
            {pregunataActual.enunciado}
          </h2>

          <div className="grid grid-cols-1 gap-3 sm:gap-4">
            {[
              { id: 'A', text: pregunataActual.opcion_a },
              { id: 'B', text: pregunataActual.opcion_b },
              { id: 'C', text: pregunataActual.opcion_c },
              { id: 'D', text: pregunataActual.opcion_d },
            ].map((opcion) => {
              const selected = respuestas[pregunataActual.id] === opcion.id
              return (
                <button
                  key={opcion.id}
                  onClick={() => presionarOpcion(opcion.id)}
                  className={`flex items-start gap-3 sm:gap-4 p-4 sm:p-5 rounded-2xl border-2 text-left transition-all
                    ${selected 
                      ? 'border-orange-500 bg-orange-50 text-orange-900 shadow-sm shadow-orange-500/10 scale-[1.01] dark:bg-orange-900/20 dark:text-orange-200' 
                      : 'border-card-border bg-badge-bg hover:border-muted-light hover:bg-card-hover text-foreground'
                    }`}
                >
                  <div className={`w-9 h-9 sm:w-10 sm:h-10 shrink-0 flex items-center justify-center rounded-xl font-black text-sm
                    ${selected ? 'bg-orange-500 text-white' : 'bg-card-hover text-muted'}`}>
                    {opcion.id}
                  </div>
                  <span className="text-sm sm:text-base font-bold mt-1 sm:mt-1.5 leading-relaxed shrink">
                    {opcion.text}
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Footer Navigation */}
        <div className="mt-4 sm:mt-6 flex justify-between items-center bg-card p-3 sm:p-4 rounded-2xl border border-card-border shadow-sm">
          <button
            onClick={() => setCurrentIndex(i => Math.max(0, i - 1))}
            disabled={currentIndex === 0}
            className="flex items-center gap-1 sm:gap-2 px-4 sm:px-6 py-3 rounded-xl font-bold text-muted bg-badge-bg hover:bg-card-hover disabled:opacity-50 transition text-sm"
          >
            <ChevronLeft size={20} />
            <span className="hidden sm:inline">Anterior</span>
          </button>
          
          {currentIndex === preguntas.length - 1 ? (
             <button
              onClick={manejarEnvio}
              className="flex items-center gap-2 px-6 sm:px-8 py-3 rounded-xl font-black text-white bg-slate-900 hover:bg-slate-800 shadow-lg shadow-black/20 hover:-translate-y-0.5 transition-all dark:bg-slate-700 dark:hover:bg-slate-600 text-sm sm:text-base"
             >
               Finalizar <CheckCircle2 size={20} />
             </button>
          ) : (
            <button
              onClick={() => setCurrentIndex(i => Math.min(preguntas.length - 1, i + 1))}
              className="flex items-center gap-1 sm:gap-2 px-4 sm:px-6 py-3 rounded-xl font-bold text-white bg-slate-900 hover:bg-slate-800 shadow-md transition dark:bg-slate-700 dark:hover:bg-slate-600 text-sm sm:text-base"
            >
              <span className="hidden sm:inline">Siguiente</span>
              <ChevronRight size={20} />
            </button>
          )}
        </div>
      </main>
    </div>
  )
}
