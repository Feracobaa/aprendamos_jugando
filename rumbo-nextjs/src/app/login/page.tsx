import { login } from './actions'
import Link from 'next/link'
import { LucideGraduationCap, LogIn, UserPlus } from 'lucide-react'

export const metadata = {
  title: 'Iniciar Sesión | Aprendamos Jugando',
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ message: string }>
}) {
  const Params = await searchParams;
  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden text-white" 
         style={{ background: "linear-gradient(135deg, #003D7A 0%, #001F3F 100%)"}}>
         
      <div className="absolute top-10 left-10 w-96 h-96 bg-teal-400/20 blur-[100px] rounded-full pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-blue-600/30 blur-[120px] rounded-full pointer-events-none" />

      <main className="relative z-10 w-full max-w-md">
        <div className="bg-white/5 border border-white/10 shadow-2xl rounded-3xl p-8 backdrop-blur-xl animate-in fade-in slide-in-from-bottom-8 duration-700">
          <div className="flex flex-col items-center mb-8 text-center space-y-2">
            <div className="p-3 bg-gradient-to-tr from-teal-400 to-blue-600 rounded-2xl mb-2">
              <LucideGraduationCap size={32} className="text-white" />
            </div>
            <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-teal-300 to-blue-400">
              Aprendamos Jugando
            </h1>
            <p className="text-slate-300 text-sm">
              Inicia sesión y mejora tu nivel
            </p>
          </div>

          <form className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300 ml-1">
                Correo Electrónico
              </label>
              <input
                className="w-full bg-slate-900/50 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent transition"
                name="email"
                placeholder="tu@universidad.edu.co"
                required
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300 ml-1">
                Contraseña
              </label>
              <input
                className="w-full bg-slate-900/50 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent transition"
                type="password"
                name="password"
                placeholder="••••••••"
                required
              />
            </div>

            <button
              formAction={login}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-teal-500 to-blue-600 hover:from-teal-400 hover:to-blue-500 text-white rounded-xl py-3 font-semibold transition-all shadow-lg hover:shadow-teal-500/25 mt-8"
            >
              <LogIn size={20} />
              Ingresar al Hub
            </button>

            {Params?.message && (
              <p className="mt-4 p-4 bg-red-500/10 border border-red-500/50 text-red-300 text-center text-sm rounded-xl">
                {Params.message}
              </p>
            )}
          </form>

          {/* Enlace a Registro */}
          <div className="mt-6 flex items-center justify-center gap-2 text-sm text-slate-400">
            <span>¿No tienes cuenta?</span>
            <Link
              href="/registro"
              className="text-teal-400 hover:text-teal-300 font-semibold transition flex items-center gap-1"
            >
              <UserPlus size={14} />
              Regístrate aquí
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}
