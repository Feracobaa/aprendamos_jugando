'use client'

import { useState, useTransition } from 'react'
import { createClient } from '@/utils/supabase/client'
import { actualizarPerfil, cambiarPassword } from './acciones'
import Link from 'next/link'
import {
  User, ArrowLeft, Save, Loader2, Lock, Mail,
  ShieldCheck, BookOpen, GraduationCap, KeyRound, Eye, EyeOff, Calendar, AlertCircle, Info
} from 'lucide-react'
import ThemeToggle from '../components/ThemeToggle'

type Perfil = {
  id: number
  nombre: string
  email: string
  role: string
  foto_perfil: string | null
  estado?: string
  created_at?: string
}

const ROLE_LABELS: Record<string, { label: string; icon: React.ReactNode; gradient: string }> = {
  admin: { label: 'Administrador', icon: <ShieldCheck size={18} />, gradient: 'from-red-500 to-rose-600' },
  profesor: { label: 'Profesor', icon: <BookOpen size={18} />, gradient: 'from-amber-500 to-orange-600' },
  estudiante: { label: 'Estudiante', icon: <GraduationCap size={18} />, gradient: 'from-teal-500 to-emerald-600' },
}

export default function PerfilClient({ perfilInicial }: { perfilInicial: Perfil }) {
  const [perfil, setPerfil] = useState<Perfil>(perfilInicial)
  const [isPending, startTransition] = useTransition()
  const [mensaje, setMensaje] = useState<{ tipo: 'ok' | 'error' | 'info'; texto: string } | null>(null)
  const [showPassSection, setShowPassSection] = useState(false)
  const [showPass, setShowPass] = useState(false)

  const rolCfg = ROLE_LABELS[perfil.role] || ROLE_LABELS.estudiante
  const backUrl = perfil.role === 'admin' || perfil.role === 'profesor' ? '/admin' : '/dashboard'

  async function handleActualizarPerfil(formData: FormData) {
    startTransition(async () => {
      setMensaje(null)
      const res = await actualizarPerfil(formData)
      if (res?.error) {
        setMensaje({ tipo: 'error', texto: res.error })
      } else {
        const nuevoEmail = formData.get('email') as string
        if (nuevoEmail !== perfil.email) {
           setMensaje({ tipo: 'info', texto: 'Perfil actualizado. Si tienes confirmación de correo requerida, revisa tu bandeja de entrada.' })
        } else {
           setMensaje({ tipo: 'ok', texto: '¡Perfil actualizado correctamente!' })
        }
        
        // Refetch to get updated data
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          const { data } = await supabase
            .from('usuarios')
            .select('id, nombre, email, role, foto_perfil, estado, created_at')
            .eq('email', user.email)
            .single()
          if (data) setPerfil(data)
        }
      }
      setTimeout(() => setMensaje(null), 6000)
    })
  }

  async function handleCambiarPassword(formData: FormData) {
    startTransition(async () => {
      setMensaje(null)
      const res = await cambiarPassword(formData)
      if (res?.error) {
        setMensaje({ tipo: 'error', texto: res.error })
      } else {
        setMensaje({ tipo: 'ok', texto: '¡Contraseña actualizada exitosamente!' })
        setShowPassSection(false)
      }
      setTimeout(() => setMensaje(null), 4000)
    })
  }

  const formatoFecha = perfil.created_at ? new Date(perfil.created_at).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' }) : 'No disponible'

  return (
    <div className="min-h-screen bg-background font-sans">
      <nav className="bg-card border-b border-card-border px-4 sm:px-6 py-3 sm:py-4 flex justify-between items-center shadow-sm sticky top-0 z-20">
        <Link href={backUrl} className="flex items-center gap-2 text-muted hover:text-foreground transition font-medium text-sm">
          <ArrowLeft size={18} />
          <span className="hidden sm:inline">{perfil.role === 'admin' || perfil.role === 'profesor' ? 'Volver al Panel' : 'Volver al Hub'}</span>
        </Link>
        <span className="font-bold text-foreground">Mi Perfil</span>
        <ThemeToggle />
      </nav>

      <main className="max-w-2xl mx-auto p-4 md:p-8 animate-in fade-in slide-in-from-bottom-6 duration-700">
        
        {mensaje && (
          <div className={`mb-6 p-4 rounded-xl border text-sm font-medium animate-in fade-in slide-in-from-top-4 duration-300 flex gap-2 items-start ${
            mensaje.tipo === 'ok'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-900/20 dark:border-emerald-800 dark:text-emerald-300'
              : mensaje.tipo === 'info' 
              ? 'bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-300'
              : 'bg-red-50 border-red-200 text-red-700 dark:bg-red-900/20 dark:border-red-800 dark:text-red-300'
          }`}>
            <AlertCircle size={18} className="mt-0.5 shrink-0" />
            <span>{mensaje.texto}</span>
          </div>
        )}

        <div className="bg-card rounded-3xl border border-card-border shadow-sm overflow-hidden mb-6">
          <div className={`h-24 sm:h-28 bg-gradient-to-r ${rolCfg.gradient} relative`}>
            <div className="absolute inset-0 bg-black/10" />
            <div className="absolute top-4 right-4 flex items-center gap-2 bg-white/20 backdrop-blur-md text-white px-3 py-1.5 rounded-full text-xs font-bold border border-white/20">
              {rolCfg.icon}
              {rolCfg.label}
            </div>
            {(perfil.estado || 'activo') === 'activo' ? (
               <div className="absolute top-4 left-4 flex items-center gap-2 bg-emerald-500/20 backdrop-blur-md text-emerald-50 px-3 py-1.5 rounded-full text-[10px] font-black uppercase border border-emerald-400/30">
                 Cuenta Activa
               </div>
            ) : (
               <div className="absolute top-4 left-4 flex items-center gap-2 bg-slate-500/20 backdrop-blur-md text-slate-50 px-3 py-1.5 rounded-full text-[10px] font-black uppercase border border-slate-400/30">
                 Cuenta Inactiva
               </div>
            )}
          </div>

          <div className="px-6 sm:px-8 pb-6 sm:pb-8 -mt-12 relative z-10">
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-card border-4 border-card shadow-xl flex items-center justify-center text-2xl sm:text-3xl font-black text-muted bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-600 mb-4">
              {perfil.nombre.charAt(0).toUpperCase()}
            </div>

            <h2 className="text-xl sm:text-2xl font-extrabold text-foreground">{perfil.nombre}</h2>

            <div className="flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-5 mt-4">
              <div className="flex items-center gap-2 text-sm text-muted font-medium bg-badge-bg px-3 py-1.5 rounded-lg border border-card-border">
                <Mail size={16} className="text-blue-500" />
                <span className="truncate">{perfil.email}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted font-medium bg-badge-bg px-3 py-1.5 rounded-lg border border-card-border">
                <Calendar size={16} className="text-indigo-500" />
                <span className="truncate">Registrado: {formatoFecha}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-card rounded-2xl border border-card-border shadow-sm p-5 sm:p-6 md:p-8 mb-6">
          <h3 className="text-lg font-bold text-foreground flex items-center gap-2 mb-5">
            <User size={20} className="text-blue-500" />
            Datos Personales
          </h3>
          <form action={handleActualizarPerfil} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-muted">Nombre Completo</label>
              <input
                name="nombre"
                defaultValue={perfil.nombre}
                required
                className="w-full bg-input-bg border border-input-border rounded-xl px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition text-sm font-medium"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-muted">Correo Electrónico</label>
              <input
                name="email"
                type="email"
                defaultValue={perfil.email}
                required
                className="w-full bg-input-bg border border-input-border rounded-xl px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition text-sm font-medium"
              />
              <p className="text-xs text-muted mt-1 opacity-80 flex items-center gap-1">
                <Info size={12} /> Modificar el correo podría requerir confirmación y cerrará sesiones previas.
              </p>
            </div>
            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={isPending}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl px-5 py-2.5 font-semibold transition text-sm shadow-md active:scale-95"
              >
                {isPending ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                Guardar Cambios
              </button>
            </div>
          </form>
        </div>

        <div className="bg-card rounded-2xl border border-card-border shadow-sm p-5 sm:p-6 md:p-8 mb-6">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
              <KeyRound size={20} className="text-amber-500" />
              Seguridad
            </h3>
            <button
              onClick={() => setShowPassSection(!showPassSection)}
              className="text-sm text-blue-600 hover:text-blue-700 font-semibold transition dark:text-blue-400 dark:hover:text-blue-300"
            >
              {showPassSection ? 'Cancelar' : 'Cambiar Contraseña'}
            </button>
          </div>

          {showPassSection ? (
            <form action={handleCambiarPassword} className="space-y-4 animate-in fade-in slide-in-from-top-4 duration-300">
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-muted">Nueva Contraseña</label>
                <div className="relative">
                  <input
                    name="nueva_password"
                    type={showPass ? 'text' : 'password'}
                    placeholder="Mínimo 6 caracteres"
                    required
                    minLength={6}
                    className="w-full bg-input-bg border border-input-border rounded-xl px-4 py-3 pr-12 text-foreground placeholder-muted-light focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent transition"
                  />
                  <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-light hover:text-muted transition p-1">
                    {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-muted">Confirmar Contraseña</label>
                <input
                  name="confirmar_password"
                  type="password"
                  placeholder="Repite la nueva contraseña"
                  required
                  minLength={6}
                  className="w-full bg-input-bg border border-input-border rounded-xl px-4 py-3 text-foreground placeholder-muted-light focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent transition"
                />
              </div>
              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={isPending}
                  className="flex items-center gap-2 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white rounded-xl px-5 py-2.5 font-semibold transition text-sm shadow-md active:scale-95"
                >
                  {isPending ? <Loader2 size={16} className="animate-spin" /> : <Lock size={16} />}
                  Actualizar Contraseña
                </button>
              </div>
            </form>
          ) : (
            <p className="text-sm text-muted">
              Tu contraseña está protegida y cifrada en el sistema. Haz clic en "Cambiar Contraseña" para establecer una nueva.
            </p>
          )}
        </div>

        {/* Sección Informativa: Aprendamos Jugando */}
        <div className="bg-gradient-to-br from-teal-50 to-blue-50 dark:from-teal-900/10 dark:to-blue-900/10 rounded-2xl border border-teal-200 dark:border-teal-800/40 p-6 sm:p-8">
           <h3 className="text-lg font-black text-teal-800 dark:text-teal-400 mb-3 flex items-center gap-2">
             <BookOpen size={20} />
             Sobre "Aprendamos Jugando"
           </h3>
           <p className="text-teal-900 dark:text-teal-300 text-sm leading-relaxed font-medium mb-5">
             Esta plataforma está diseñada para fortalecer tus habilidades de <strong>Lectura Crítica</strong> mediante una ruta estructurada de aprendizaje. El proceso evalúa y desarrolla tres niveles fundamentales de comprensión lectora:
           </p>

           <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white/60 dark:bg-slate-800/40 backdrop-blur-md rounded-xl p-4 border border-teal-100 dark:border-teal-800/30">
                 <h4 className="font-bold text-teal-700 dark:text-teal-300 mb-1 text-sm border-b border-teal-200/50 dark:border-teal-800/50 pb-1">1. Literal</h4>
                 <p className="text-xs text-muted-light font-medium mt-2 leading-relaxed">
                   Comprende la información explícita del texto, detalles, datos y la idea principal directa.
                 </p>
              </div>
              <div className="bg-white/60 dark:bg-slate-800/40 backdrop-blur-md rounded-xl p-4 border border-teal-100 dark:border-teal-800/30">
                 <h4 className="font-bold text-teal-700 dark:text-teal-300 mb-1 text-sm border-b border-teal-200/50 dark:border-teal-800/50 pb-1">2. Inferencial</h4>
                 <p className="text-xs text-muted-light font-medium mt-2 leading-relaxed">
                   Interpreta el significado oculto, deduce conclusiones y lee entre líneas.
                 </p>
              </div>
              <div className="bg-white/60 dark:bg-slate-800/40 backdrop-blur-md rounded-xl p-4 border border-teal-100 dark:border-teal-800/30">
                 <h4 className="font-bold text-teal-700 dark:text-teal-300 mb-1 text-sm border-b border-teal-200/50 dark:border-teal-800/50 pb-1">3. Crítico</h4>
                 <p className="text-xs text-muted-light font-medium mt-2 leading-relaxed">
                   Analiza, evalúa y argumenta una postura basada en los recursos y el tono del autor.
                 </p>
              </div>
           </div>
        </div>

      </main>
    </div>
  )
}
