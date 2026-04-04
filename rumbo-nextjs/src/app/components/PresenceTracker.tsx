'use client'

import { useEffect, useRef } from 'react'
import { updatePresence } from '../acciones_globales'

export default function PresenceTracker() {
  const isTracking = useRef(false)

  useEffect(() => {
    // Evitar que el StrictMode doble la configuración inicial
    if (isTracking.current) return
    isTracking.current = true

    // Ejecutar inmediatamente al montar
    updatePresence()

    // Ejecutar cada 60 segundos
    const interval = setInterval(() => {
      updatePresence()
    }, 60000)

    return () => clearInterval(interval)
  }, [])

  return null
}
