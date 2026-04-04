'use client'

import { useState, useTransition } from 'react'
import { crearUsuarioAdmin } from '../acciones'
import { useRouter } from 'next/navigation'
import { UserPlus, ArrowLeft, Loader2, ShieldCheck, BookOpen, GraduationCap, Eye, EyeOff } from 'lucide-react'
import Link from 'next/link'

export default function NuevoUsuarioPage() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [mensaje, setMensaje] = useState<{ tipo: 'ok' | 'error'; texto: string } | null>(null)
  const [rolSeleccionado, setRolSeleccionado] = useState('estudiante')
  const [showPassword, setShowPassword] = useState(false)

  async function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const res = await crearUsuarioAdmin(formData)
      if (res?.error) {
        setMensaje({ tipo: 'error', texto: res.error })
      } else {
        setMensaje({ tipo: 'ok', texto: '¡Usuario creado exitosamente!' })
        setTimeout(() => router.push('/admin/usuarios'), 1500)
      }
    })
  }

  const roles = [
    {
      value: 'estudiante',
      label: 'Estudiante',
      desc: 'Puede dar exámenes y ver sus resultados.',
      icon: <GraduationCap size={20} />,
      gradient: 'from-teal-500 to-emerald-600',
      ring: 'ring-teal-400',
      bg: 'bg-teal-50 dark:bg-teal-900/20',
      border: 'border-teal-200 dark:border-teal-800',
    },
    {
      value: 'profesor',
      label: 'Profesor',
      desc: 'Puede crear exámenes y ver estadísticas.',
      icon: <BookOpen size={20} />,
      gradient: 'from-amber-500 to-orange-600',
      ring: 'ring-amber-400',
      bg: 'bg-amber-50 dark:bg-amber-900/20',
      border: 'border-amber-200 dark:border-amber-800',
    },
    {
      value: 'admin',
      label: 'Administrador',
      desc: 'Control total de la plataforma.',
      icon: <ShieldCheck size={20} />,
      gradient: 'from-red-500 to-rose-600',
      ring: 'ring-red-400',
      bg: 'bg-red-50 dark:bg-red-900/20',
      border: 'border-red-200 dark:border-red-800',
    },
  ]

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-2xl py-4 sm:py-0">
      {/* Breadcrumb */}
      <Link
        href="/admin/usuarios"
        className="inline-flex items-center gap-2 text-muted hover:text-foreground transition font-medium text-sm mb-6"
      >
        <ArrowLeft size={18} />
        Volver a Usuarios
      </Link>

      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <div className="p-3 bg-gradient-to-tr from-blue-500 to-cyan-600 rounded-2xl text-white shadow-lg">
          <UserPlus size={28} />
        </div>
        <div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground">Nuevo Usuario</h2>
          <p className="text-muted mt-0.5">Registra un nuevo integrante en la plataforma.</p>
        </div>
      </div>

      {/* Mensaje */}
      {mensaje && (
        <div className={`mb-6 p-4 rounded-xl border text-sm font-medium animate-in fade-in slide-in-from-top-4 duration-300 ${
          mensaje.tipo === 'ok'
            ? 'bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-900/20 dark:border-emerald-800 dark:text-emerald-400'
            : 'bg-red-50 border-red-200 text-red-700 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400'
        }`}>
          {mensaje.texto}
        </div>
      )}

      {/* Formulario */}
      <form action={handleSubmit} className="bg-card rounded-2xl border border-card-border shadow-sm overflow-hidden">
        <div className="p-5 sm:p-6 md:p-8 space-y-6">

          {/* Nombre */}
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-foreground">Nombre Completo</label>
            <input
              name="nombre"
              placeholder="Ej: María García López"
              required
              className="w-full bg-input-bg border border-input-border rounded-xl px-4 py-3 text-foreground placeholder-muted-light focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition"
            />
          </div>

          {/* Correo */}
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-foreground">Correo Electrónico</label>
            <input
              name="email"
              type="email"
              placeholder="maria@universidad.edu.co"
              required
              className="w-full bg-input-bg border border-input-border rounded-xl px-4 py-3 text-foreground placeholder-muted-light focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition"
            />
          </div>

          {/* Contraseña */}
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-foreground">Contraseña</label>
            <div className="relative">
              <input
                name="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Mínimo 6 caracteres"
                required
                minLength={6}
                className="w-full bg-input-bg border border-input-border rounded-xl px-4 py-3 pr-12 text-foreground placeholder-muted-light focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-foreground transition p-1"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Selector de Rol */}
          <div className="space-y-3">
            <label className="text-sm font-semibold text-foreground">Rol del Usuario</label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {roles.map(r => (
                <label
                  key={r.value}
                  className={`cursor-pointer rounded-xl border-2 p-4 transition-all ${
                    rolSeleccionado === r.value
                      ? `${r.border} ${r.bg} ring-2 ${r.ring} shadow-sm`
                      : 'border-card-border hover:border-muted-light bg-card'
                  }`}
                >
                  <input
                    type="radio"
                    name="role"
                    value={r.value}
                    checked={rolSeleccionado === r.value}
                    onChange={() => setRolSeleccionado(r.value)}
                    className="sr-only"
                  />
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-tr ${r.gradient} text-white flex items-center justify-center mb-3 shadow-md`}>
                    {r.icon}
                  </div>
                  <p className="font-bold text-foreground text-sm">{r.label}</p>
                  <p className="text-xs text-muted-light mt-0.5 leading-relaxed">{r.desc}</p>
                </label>
              ))}
            </div>
          </div>


        </div>

        {/* Footer del formulario */}
        <div className="bg-card-hover border-t border-card-border px-5 sm:px-6 md:px-8 py-4 flex flex-col sm:flex-row justify-end gap-3">
          <Link
            href="/admin/usuarios"
            className="px-5 py-2.5 bg-card border border-card-border hover:bg-badge-bg text-muted hover:text-foreground rounded-xl font-medium transition text-sm text-center"
          >
            Cancelar
          </Link>
          <button
            type="submit"
            disabled={isPending}
            className="flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 disabled:opacity-50 text-white rounded-xl px-6 py-2.5 font-semibold transition-all shadow-lg hover:shadow-blue-500/25 text-sm"
          >
            {isPending ? <Loader2 size={18} className="animate-spin" /> : <UserPlus size={18} />}
            Crear Usuario
          </button>
        </div>
      </form>
    </div>
  )
}
