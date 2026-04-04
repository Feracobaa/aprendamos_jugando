'use client'

import { useState, useEffect } from 'react'
import { Clock, ChevronRight, ChevronLeft, CheckCircle2, Loader2, XCircle } from 'lucide-react'
import { submitExam } from './actions'

const ACIERTOS = [
  "¡Excelente trabajo! Tu esfuerzo está dando frutos.",
  "¡Vas por muy buen camino! Sigue así.",
  "¡Respuesta perfecta! Tienes un gran dominio del tema.",
  "¡Brillante! Has captado la idea principal a la perfección."
]

const DESACIERTOS = [
  "¡Casi lo tienes! Revisa el concepto y vuelve a intentarlo.",
  "Buen intento. Aprovecha este momento para repasar este punto clave.",
  "¡No te rindas! Cada fallo es un paso más hacia el aprendizaje."
]

type Pregunta = {
  id: number
  enunciado: string
  opcion_a: string
  opcion_b: string
  opcion_c: string
  opcion_d: string
  respuesta_correcta: string
}

type ExamClientProps = {
  examId: number
  titulo: string
  tiempoLimiteMinutos: number
  preguntas: Pregunta[]
}

export default function ExamClient({ examId, titulo, tiempoLimiteMinutos, preguntas }: ExamClientProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [respuestas, setRespuestas] = useState<Record<number, string>>({})
  
  // Initialize timer with exact value first to avoid hydration mismatch
  const [timeLeft, setTimeLeft] = useState(tiempoLimiteMinutos * 60)
  const [isFinished, setIsFinished] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [calificacion, setCalificacion] = useState<{puntaje: number, total: number} | null>(null)
  const [feedback, setFeedback] = useState<{ tipo: 'acierto' | 'desacierto', mensaje: string } | null>(null)

  // Hydrate timer from sessionStorage on mount
  useEffect(() => {
    const savedTime = sessionStorage.getItem(`exam_timer_${examId}`)
    if (savedTime) {
      // Parse the saved time from session storage
      const parsedTime = parseInt(savedTime, 10)
      
      // Safety check: only use saved time if it's not totally depleted 
      // or excessively large (maybe from an old session)
      if (!isNaN(parsedTime) && parsedTime > 0 && parsedTime <= tiempoLimiteMinutos * 60) {
        setTimeLeft(parsedTime)
      }
    }
  }, [examId, tiempoLimiteMinutos])

  useEffect(() => {
    if (timeLeft <= 0 || isFinished) {
      if (timeLeft <= 0 && !isFinished) manejarEnvio()
      return
    }
    const timer = setInterval(() => {
      setTimeLeft((t) => {
        const newTime = t - 1
        // Store the time every second to persist through refresh
        sessionStorage.setItem(`exam_timer_${examId}`, newTime.toString())
        return newTime
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [timeLeft, isFinished])

  const pregunataActual = preguntas[currentIndex]
  const mins = Math.floor(timeLeft / 60)
  const secs = timeLeft % 60

  const presionarOpcion = (letra: string) => {
    setRespuestas({ ...respuestas, [pregunataActual.id]: letra })
  }

  const handleTransition = (isFinal: boolean) => {
    const ans = respuestas[pregunataActual.id]
    // Consider empty string as mismatch
    const esCorrecta = ans === pregunataActual.respuesta_correcta
    const tipo = esCorrecta ? 'acierto' : 'desacierto'
    
    const mensajes = esCorrecta ? ACIERTOS : DESACIERTOS
    const mensajeAzar = mensajes[Math.floor(Math.random() * mensajes.length)]
    
    setFeedback({ tipo, mensaje: mensajeAzar })
    
    setTimeout(() => {
      setFeedback(null)
      if (isFinal) {
        manejarEnvio()
      } else {
        setCurrentIndex(i => Math.min(preguntas.length - 1, i + 1))
      }
    }, 2000)
  }

  const manejarEnvio = async () => {
    setIsFinished(true)
    setIsSubmitting(true)

    try {
      const res = await submitExam(examId, respuestas)
      if (res.success && res.resultadoId) {
        window.location.href = `/exam/${examId}/resultado?res=${res.resultadoId}`
      } else {
        // En caso de error inesperado enviarlo al dashboard
        window.location.href = '/dashboard'
      }
      // Cleanup timer from storage once done
      sessionStorage.removeItem(`exam_timer_${examId}`)
    } catch (e) {
      console.error(e)
      window.location.href = '/dashboard'
    } finally {
      setIsSubmitting(false)
    }
  }

  if (preguntas.length === 0) {
    return <div className="p-10 text-center text-muted">Este examen no tiene preguntas aún.</div>
  }

  if (isFinished) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <div className="bg-card p-8 sm:p-10 rounded-2xl shadow-xl max-w-lg w-full text-center space-y-4 border border-card-border">
          <div className="flex justify-center mb-6">
            {isSubmitting ? (
              <Loader2 size={64} className="text-teal-500 animate-spin" />
            ) : (
              <CheckCircle2 size={64} className="text-teal-500" />
            )}
          </div>
          
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground">
            {isSubmitting ? 'Evaluando...' : '¡Examen Completado!'}
          </h2>
          
          <p className="text-muted font-medium">
            {isSubmitting 
              ? 'Por favor espera mientras nuestro sistema evalúa tus respuestas de forma segura.'
              : calificacion 
                ? `Has obtenido ${calificacion.puntaje} respuestas correctas de ${calificacion.total}.`
                : 'Tus respuestas han sido enviadas para su evaluación.'
            }
          </p>

          <button 
            onClick={() => window.location.href = '/dashboard'}
            disabled={isSubmitting}
            className="mt-6 px-6 py-3 bg-teal-600 hover:bg-teal-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-xl font-medium transition w-full"
          >
            Volver al Hub
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex flex-col font-sans">
      {/* Header fijo */}
      <header className="bg-card border-b border-card-border sticky top-0 z-10 px-4 sm:px-6 py-3 sm:py-4 flex flex-col sm:flex-row gap-3 sm:gap-4 justify-between items-center shadow-sm">
        <h1 className="font-bold text-lg sm:text-xl text-foreground text-center sm:text-left">{titulo}</h1>
        <div className="flex items-center gap-3 bg-badge-bg px-4 py-2 rounded-lg border border-badge-border">
          <Clock className={timeLeft < 60 ? 'text-red-500 animate-pulse' : 'text-muted'} size={20} />
          <span className={`font-mono font-semibold text-lg ${timeLeft < 60 ? 'text-red-600' : 'text-foreground'}`}>
            {String(mins).padStart(2, '0')}:{String(secs).padStart(2, '0')}
          </span>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-4 md:p-8 flex flex-col relative overflow-hidden">
        
        {/* Feedback Overlay */}
        {feedback && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-background/60 backdrop-blur-[2px] rounded-2xl sm:rounded-3xl animate-in fade-in duration-300">
            <div className={`flex flex-col items-center justify-center p-6 sm:p-8 text-center rounded-3xl shadow-2xl transform transition-transform duration-300 scale-100 animate-in zoom-in-95 mx-4
              ${feedback.tipo === 'acierto' 
                ? 'bg-gradient-to-br from-emerald-400 to-emerald-600 text-white' 
                : 'bg-gradient-to-br from-orange-400 to-red-500 text-white'}`}
            >
              {feedback.tipo === 'acierto' ? (
                <CheckCircle2 size={64} className="mb-4 drop-shadow-md animate-bounce" />
              ) : (
                <XCircle size={64} className="mb-4 drop-shadow-md" />
              )}
              <h3 className="text-xl sm:text-2xl font-black mb-2">{feedback.tipo === 'acierto' ? '¡Acierto!' : 'Desacierto'}</h3>
              <p className="text-base sm:text-lg font-medium opacity-90 max-w-[280px] sm:max-w-xs">{feedback.mensaje}</p>
            </div>
          </div>
        )}

        {/* Progress Bar */}
        <div className="mb-6 sm:mb-8">
          <div className="flex justify-between text-sm text-muted font-medium mb-2">
            <span>Pregunta {currentIndex + 1} de {preguntas.length}</span>
            <span>{Math.round(((currentIndex + 1) / preguntas.length) * 100)}%</span>
          </div>
          <div className="w-full bg-badge-bg rounded-full h-2.5">
            <div 
              className="bg-teal-500 h-2.5 rounded-full transition-all duration-300" 
              style={{ width: `${((currentIndex + 1) / preguntas.length) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Question Card */}
        <div className="bg-card rounded-2xl shadow-sm border border-card-border p-5 sm:p-6 md:p-10 flex-1">
          <h2 className="text-lg sm:text-xl md:text-2xl font-semibold text-foreground mb-6 sm:mb-8 leading-snug">
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
                  className={`flex items-start gap-3 sm:gap-4 p-4 sm:p-5 rounded-xl border-2 text-left transition-all
                    ${selected 
                      ? 'border-teal-500 bg-teal-50 text-teal-900 shadow-sm dark:bg-teal-900/20 dark:text-teal-200' 
                      : 'border-card-border bg-badge-bg hover:border-muted-light hover:bg-card-hover text-foreground'
                    }`}
                >
                  <div className={`w-8 h-8 flex-shrink-0 flex items-center justify-center rounded-lg font-bold text-sm
                    ${selected ? 'bg-teal-500 text-white' : 'bg-card-hover text-muted'}`}>
                    {opcion.id}
                  </div>
                  <span className="text-sm sm:text-base font-medium mt-0.5 leading-relaxed">
                    {opcion.text}
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Footer Navigation */}
        <div className="mt-4 sm:mt-6 flex justify-between items-center gap-3">
          <button
            onClick={() => setCurrentIndex(i => Math.max(0, i - 1))}
            disabled={currentIndex === 0}
            className="flex items-center gap-1 sm:gap-2 px-4 sm:px-6 py-3 rounded-xl font-medium text-muted bg-card border border-card-border shadow-sm hover:bg-card-hover disabled:opacity-50 transition text-sm sm:text-base"
          >
            <ChevronLeft size={20} />
            <span className="hidden sm:inline">Anterior</span>
          </button>
          
          {currentIndex === preguntas.length - 1 ? (
             <button
              onClick={() => handleTransition(true)}
              disabled={!!feedback}
              className="flex items-center gap-2 px-6 sm:px-8 py-3 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-md transition text-sm sm:text-base disabled:opacity-50"
             >
               Finalizar <CheckCircle2 size={20} />
             </button>
          ) : (
            <button
              onClick={() => handleTransition(false)}
              disabled={!!feedback}
              className="flex items-center gap-1 sm:gap-2 px-4 sm:px-6 py-3 rounded-xl font-medium text-white bg-slate-800 hover:bg-slate-900 shadow-sm transition dark:bg-slate-700 dark:hover:bg-slate-600 text-sm sm:text-base disabled:opacity-50"
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
