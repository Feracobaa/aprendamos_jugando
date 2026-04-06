import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { LayoutDashboard, FileText, BarChart3, LogOut, ShieldCheck, UserCircle } from 'lucide-react'
import SidebarShell from '../components/SidebarShell'

export const metadata = {
  title: 'Panel Docente | Aprendamos Jugando',
}

export default async function ProfesorLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: perfil } = await supabase
    .from('usuarios')
    .select('id, nombre, role')
    .eq('email', user.email)
    .single()

  if (!perfil || (perfil.role !== 'profesor' && perfil.role !== 'admin')) {
    redirect('/dashboard')
  }

  const sidebarContent = (
    <>
      <div className="h-16 flex items-center px-6 border-b border-white/10 shrink-0">
        <ShieldCheck className="text-teal-400 mr-3" size={24} />
        <h1 className="font-bold text-lg text-white tracking-wide">Portal Docente</h1>
      </div>

      <nav className="flex-1 px-4 py-6 flex flex-col gap-2 overflow-y-auto">
        <p className="px-2 text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Principal</p>
        <Link href="/profesor" className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-white/10 hover:text-white transition">
          <LayoutDashboard size={18} /> Resumen
        </Link>
        <Link href="/profesor/examenes" className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-white/10 hover:text-white transition group relative">
          <FileText size={18} /> Exámenes
          <div className="absolute right-2 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-teal-400">
             &rarr;
          </div>
        </Link>

        <p className="px-2 text-xs font-bold uppercase tracking-wider text-slate-500 mt-6 mb-2">Análisis</p>
        <Link href="/profesor/estadisticas" className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-white/10 hover:text-white transition">
          <BarChart3 size={18} /> Estadísticas Globales
        </Link>

        <p className="px-2 text-xs font-bold uppercase tracking-wider text-slate-500 mt-6 mb-2">Vigilancia</p>
        <Link href="/profesor/live" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-red-300 hover:bg-red-500/10 hover:text-red-200 transition">
           <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div> Panel En Vivo
        </Link>
      </nav>

      <div className="p-4 border-t border-white/10 shrink-0">
        <div className="flex items-center gap-3 mb-4 px-2">
          <div className="w-8 h-8 rounded-full bg-teal-500 flex items-center justify-center text-white font-bold text-sm">
            {perfil.nombre.charAt(0)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">{perfil.nombre}</p>
            <p className="text-xs text-slate-500 capitalize">{perfil.role}</p>
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <Link href="/perfil" className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 hover:text-white transition text-sm font-medium">
            <UserCircle size={16} /> Mi Perfil
          </Link>
          <form action="/auth/signout" method="post">
            <button className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-white/5 hover:bg-red-500/20 hover:text-red-300 transition text-sm font-medium">
              <LogOut size={16} /> Cerrar Sesión
            </button>
          </form>
        </div>
      </div>
    </>
  )

  return (
    <SidebarShell sidebar={sidebarContent} headerLabel="Profesor › Workspace">
      {children}
    </SidebarShell>
  )
}
