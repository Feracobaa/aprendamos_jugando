import { createClient } from '@/utils/supabase/server'
import { registrarEstudiante } from './acciones'
import Link from 'next/link'
import { GraduationCap, UserPlus, ArrowLeft, CheckCircle2, AlertCircle } from 'lucide-react'

export const metadata = {
  title: 'Crear Cuenta | Aprendamos Jugando',
  description: 'Regístrate como estudiante en la plataforma Aprendamos Jugando.',
}

export default async function RegistroPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; ok?: string }>
}) {
  const params = await searchParams

  // Eliminamos la carga de facultades
  // const supabase = await createClient()

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden text-white"
      style={{ background: 'linear-gradient(135deg, #003D7A 0%, #001F3F 100%)' }}
    >
      {/* Glow decorativo */}
      <div className="absolute top-10 right-10 w-96 h-96 bg-emerald-400/20 blur-[100px] rounded-full pointer-events-none" />
      <div className="absolute bottom-10 left-10 w-96 h-96 bg-blue-600/30 blur-[120px] rounded-full pointer-events-none" />

      <main className="relative z-10 w-full max-w-lg">
        <div className="bg-white/5 border border-white/10 shadow-2xl rounded-3xl p-8 backdrop-blur-xl animate-in fade-in slide-in-from-bottom-8 duration-700">

          {/* Logo y título */}
          <div className="flex flex-col items-center mb-8 text-center space-y-2">
            <div className="p-3 bg-gradient-to-tr from-emerald-400 to-teal-600 rounded-2xl mb-2 shadow-lg">
              <GraduationCap size={32} className="text-white" />
            </div>
            <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-300 to-teal-400">
              Crear Cuenta de Estudiante
            </h1>
            <p className="text-slate-300 text-sm">
              Regístrate para acceder a tus exámenes y resultados.
            </p>
          </div>

          {/* Mensaje de éxito */}
          {params?.ok && (
            <div className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-center text-sm rounded-xl flex items-center gap-3 animate-in fade-in duration-300">
              <CheckCircle2 size={20} className="shrink-0" />
              <span>{params.ok}</span>
            </div>
          )}

          {/* Mensaje de error */}
          {params?.error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 text-red-300 text-center text-sm rounded-xl flex items-center gap-3 animate-in fade-in duration-300">
              <AlertCircle size={20} className="shrink-0" />
              <span>{params.error}</span>
            </div>
          )}

          <form className="space-y-5">
            {/* Nombre */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-300 ml-1">Nombre Completo</label>
              <input
                className="w-full bg-slate-900/50 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent transition"
                name="nombre"
                placeholder="Juan Pérez López"
                required
              />
            </div>

            {/* Correo */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-300 ml-1">Correo Electrónico</label>
              <input
                className="w-full bg-slate-900/50 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent transition"
                name="email"
                type="email"
                placeholder="tu@universidad.edu.co"
                required
              />
            </div>

            {/* Eliminado selector de Facultad */}

            {/* Contraseña */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-300 ml-1">Contraseña</label>
              <input
                className="w-full bg-slate-900/50 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent transition"
                type="password"
                name="password"
                placeholder="Mínimo 6 caracteres"
                required
                minLength={6}
              />
            </div>

            {/* Confirmar Contraseña */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-300 ml-1">Confirmar Contraseña</label>
              <input
                className="w-full bg-slate-900/50 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent transition"
                type="password"
                name="confirmar_password"
                placeholder="Repite tu contraseña"
                required
                minLength={6}
              />
            </div>

            {/* Submit */}
            <button
              formAction={registrarEstudiante}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white rounded-xl py-3 font-semibold transition-all shadow-lg hover:shadow-emerald-500/25 mt-2"
            >
              <UserPlus size={20} />
              Crear Mi Cuenta
            </button>
          </form>

          {/* Enlace a Login */}
          <div className="mt-6 flex items-center justify-center gap-2 text-sm text-slate-400">
            <span>¿Ya tienes una cuenta?</span>
            <Link
              href="/login"
              className="text-emerald-400 hover:text-emerald-300 font-semibold transition flex items-center gap-1"
            >
              <ArrowLeft size={14} />
              Iniciar Sesión
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}
