'use client'

import { useState, useTransition } from 'react'
import { editarUsuario, eliminarUsuario, resetPasswordAdmin } from './acciones'
import Link from 'next/link'
import {
  Users, Plus, Pencil, Trash2, Save, X, Loader2, Search,
  ShieldCheck, GraduationCap, BookOpen, Filter, CheckCircle, XCircle, KeyRound
} from 'lucide-react'

type Usuario = {
  id: number
  nombre: string
  email: string
  role: string
  created_at: string
  foto_perfil: string | null
  estado: string
  last_seen?: string | null
}

const isUserOnline = (lastSeenText?: string | null) => {
  if (!lastSeenText) return false;
  const lastSeen = new Date(lastSeenText).getTime();
  const now = new Date().getTime();
  const MathDiff = (now - lastSeen) / 1000 / 60;
  return MathDiff <= 2;
}

const ROLE_CONFIG: Record<string, { label: string; color: string; bg: string; border: string; darkBg: string; darkColor: string; darkBorder: string; icon: React.ReactNode }> = {
  admin: {
    label: 'Administrador',
    color: 'text-red-700',
    bg: 'bg-red-50',
    border: 'border-red-200',
    darkBg: 'dark:bg-red-900/20',
    darkColor: 'dark:text-red-300',
    darkBorder: 'dark:border-red-800',
    icon: <ShieldCheck size={14} />,
  },
  profesor: {
    label: 'Profesor',
    color: 'text-amber-700',
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    darkBg: 'dark:bg-amber-900/20',
    darkColor: 'dark:text-amber-300',
    darkBorder: 'dark:border-amber-800',
    icon: <BookOpen size={14} />,
  },
  estudiante: {
    label: 'Estudiante',
    color: 'text-teal-700',
    bg: 'bg-teal-50',
    border: 'border-teal-200',
    darkBg: 'dark:bg-teal-900/20',
    darkColor: 'dark:text-teal-300',
    darkBorder: 'dark:border-teal-800',
    icon: <GraduationCap size={14} />,
  },
}

const ESTADO_CONFIG: Record<string, { label: string; color: string; bg: string; border: string; icon: React.ReactNode }> = {
  activo: {
    label: 'Activo',
    color: 'text-emerald-700 dark:text-emerald-300',
    bg: 'bg-emerald-50 dark:bg-emerald-900/20',
    border: 'border-emerald-200 dark:border-emerald-800',
    icon: <CheckCircle size={12} />,
  },
  inactivo: {
    label: 'Inactivo',
    color: 'text-slate-600 dark:text-slate-400',
    bg: 'bg-slate-50 dark:bg-slate-800/40',
    border: 'border-slate-200 dark:border-slate-700',
    icon: <XCircle size={12} />,
  },
}

export default function UsuariosClient({ initialUsuarios }: { initialUsuarios: Usuario[] }) {
  const [usuarios, setUsuarios] = useState<Usuario[]>(initialUsuarios)
  const [filtroTexto, setFiltroTexto] = useState('')
  const [filtroRol, setFiltroRol] = useState<string>('todos')
  const [filtroEstado, setFiltroEstado] = useState<string>('todos')
  const [editandoId, setEditandoId] = useState<number | null>(null)
  const [isPending, startTransition] = useTransition()
  const [mensaje, setMensaje] = useState<{ tipo: 'ok' | 'error'; texto: string } | null>(null)

  const usuariosFiltrados = usuarios.filter(u => {
    const matchTexto =
      u.nombre.toLowerCase().includes(filtroTexto.toLowerCase()) ||
      u.email.toLowerCase().includes(filtroTexto.toLowerCase())
    const matchRol = filtroRol === 'todos' || u.role === filtroRol
    const userEstado = isUserOnline(u.last_seen) ? 'activo' : 'inactivo'
    const matchEstado = filtroEstado === 'todos' || userEstado === filtroEstado
    return matchTexto && matchRol && matchEstado
  })

  async function handleEditar(id: number, formData: FormData) {
    startTransition(async () => {
      const res = await editarUsuario(id, formData)
      if (res?.error) {
        setMensaje({ tipo: 'error', texto: res.error })
      } else {
        setMensaje({ tipo: 'ok', texto: 'Usuario actualizado correctamente.' })
        setEditandoId(null)
        // Update local state
        const nombre = formData.get('nombre') as string
        const role = formData.get('role') as string
        setUsuarios(prev => prev.map(u => u.id === id ? { ...u, nombre, role } : u))
      }
    })
  }

  async function handleResetPassword(id: number, nombre: string) {
    const newPass = prompt(`Ingrese la nueva contraseña para el usuario "${nombre}" (mínimo 6 caracteres):`)
    if (!newPass) return
    if (newPass.length < 6) {
      setMensaje({ tipo: 'error', texto: 'La contraseña debe tener al menos 6 caracteres.' })
      return
    }
    
    if (!confirm(`¿Confirmas que deseas forzar el cambio de contraseña para "${nombre}"?`)) return
    
    startTransition(async () => {
      const res = await resetPasswordAdmin(id, newPass)
      if (res?.error) {
        setMensaje({ tipo: 'error', texto: res.error })
      } else {
        setMensaje({ tipo: 'ok', texto: `Contraseña de "${nombre}" actualizada exitosamente.` })
      }
    })
  }

  async function handleEliminar(id: number, nombre: string) {
    if (!confirm(`¿Estás seguro de eliminar al usuario "${nombre}"? Esta acción no se puede deshacer.`)) return
    startTransition(async () => {
      const res = await eliminarUsuario(id)
      if (res?.error) {
        setMensaje({ tipo: 'error', texto: res.error })
      } else {
        setMensaje({ tipo: 'ok', texto: `Usuario "${nombre}" eliminado.` })
        setUsuarios(prev => prev.filter(u => u.id !== id))
      }
    })
  }

  if (mensaje) {
    setTimeout(() => setMensaje(null), 4000)
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-tr from-blue-500 to-cyan-600 rounded-xl text-white shadow-lg">
              <Users size={24} />
            </div>
            Gestión de Usuarios
          </h2>
          <p className="text-muted mt-1 ml-0 sm:ml-14 text-sm sm:text-base">Administra estudiantes, profesores y administradores.</p>
        </div>
        <Link
          href="/admin/usuarios/nuevo"
          className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white rounded-xl px-5 py-2.5 font-semibold transition-all shadow-lg hover:shadow-blue-500/25 w-full sm:w-auto justify-center"
        >
          <Plus size={20} />
          Añadir Usuario
        </Link>
      </div>

      {/* Mensaje */}
      {mensaje && (
        <div className={`mb-6 p-4 rounded-xl border text-sm font-medium animate-in fade-in slide-in-from-top-4 duration-300 ${
          mensaje.tipo === 'ok'
            ? 'bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-900/20 dark:border-emerald-800 dark:text-emerald-300'
            : 'bg-red-50 border-red-200 text-red-700 dark:bg-red-900/20 dark:border-red-800 dark:text-red-300'
        }`}>
          {mensaje.texto}
        </div>
      )}

      {/* Filtros */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="sm:col-span-2 relative">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-light" />
          <input
            type="text"
            value={filtroTexto}
            onChange={e => setFiltroTexto(e.target.value)}
            placeholder="Buscar por nombre o correo..."
            className="w-full bg-card border border-card-border rounded-xl pl-11 pr-4 py-3 text-foreground placeholder-muted-light focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-transparent transition text-sm shadow-sm"
          />
        </div>
        <div className="relative">
          <Filter size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-light" />
          <select
            value={filtroRol}
            onChange={e => setFiltroRol(e.target.value)}
            className="w-full bg-card border border-card-border rounded-xl pl-10 pr-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-transparent transition text-sm shadow-sm appearance-none cursor-pointer"
          >
            <option value="todos">Todos los roles</option>
            <option value="admin">Administradores</option>
            <option value="profesor">Profesores</option>
            <option value="estudiante">Estudiantes</option>
          </select>
        </div>
        <div className="relative">
          <Filter size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-light" />
          <select
            value={filtroEstado}
            onChange={e => setFiltroEstado(e.target.value)}
            className="w-full bg-card border border-card-border rounded-xl pl-10 pr-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-transparent transition text-sm shadow-sm appearance-none cursor-pointer"
          >
            <option value="todos">Todos los estados</option>
            <option value="activo">Activos</option>
            <option value="inactivo">Inactivos</option>
          </select>
        </div>
      </div>

      {/* Estadísticas rápidas */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {(['admin', 'profesor', 'estudiante'] as const).map(role => {
          const cfg = ROLE_CONFIG[role]
          const count = usuarios.filter(u => u.role === role).length
          return (
            <div key={role} className={`${cfg.bg} ${cfg.border} ${cfg.darkBg} ${cfg.darkBorder} border rounded-xl p-4 flex items-center gap-3`}>
              <div className={`${cfg.color} ${cfg.darkColor} p-2 rounded-lg bg-white/70 dark:bg-white/10`}>{cfg.icon}</div>
              <div>
                <p className="text-2xl font-black text-foreground">{count}</p>
                <p className={`text-[10px] sm:text-xs font-bold uppercase tracking-wider ${cfg.color} ${cfg.darkColor}`}>{cfg.label}s</p>
              </div>
            </div>
          )
        })}
        <div className="bg-emerald-50 border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-800 border rounded-xl p-4 flex items-center gap-3">
          <div className="text-emerald-700 dark:text-emerald-300 p-2 rounded-lg bg-white/70 dark:bg-white/10"><CheckCircle size={16}/></div>
          <div>
            <p className="text-2xl font-black text-foreground">{usuarios.filter(u => isUserOnline(u.last_seen)).length}</p>
            <p className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-300">Conectados</p>
          </div>
        </div>
      </div>

      {/* Tabla de usuarios - Desktop */}
      <div className="bg-card rounded-2xl border border-card-border shadow-sm overflow-hidden">
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-table-header-bg border-b border-card-border">
                <th className="px-6 py-4 text-xs font-bold text-muted uppercase tracking-wider">Usuario</th>
                <th className="px-6 py-4 text-xs font-bold text-muted uppercase tracking-wider">Correo</th>
                <th className="px-6 py-4 text-xs font-bold text-muted uppercase tracking-wider text-center">Rol</th>
                <th className="px-6 py-4 text-xs font-bold text-muted uppercase tracking-wider text-center">Estado</th>
                <th className="px-6 py-4 text-xs font-bold text-muted uppercase tracking-wider text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-card-border">
              {usuariosFiltrados.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-16 text-center text-muted">
                    <Users size={40} className="mx-auto mb-3 text-muted-light" />
                    <p className="font-medium">No se encontraron usuarios.</p>
                  </td>
                </tr>
              ) : (
                usuariosFiltrados.map(u => {
                  const cfgRole = ROLE_CONFIG[u.role] || ROLE_CONFIG.estudiante
                  const dynEstado = isUserOnline(u.last_seen) ? 'activo' : 'inactivo'
                  const cfgEstado = ESTADO_CONFIG[dynEstado]
                  return (
                    <tr key={u.id} className="hover:bg-card-hover transition-colors group">
                      {editandoId === u.id ? (
                        <td colSpan={5} className="px-6 py-4 bg-blue-50/30 dark:bg-blue-900/10">
                          <form
                            onSubmit={e => {
                                e.preventDefault()
                                handleEditar(u.id, new FormData(e.currentTarget))
                            }}
                            className="flex flex-wrap md:flex-nowrap items-center gap-3"
                          >
                            <input name="nombre" defaultValue={u.nombre} required className="flex-1 min-w-[200px] bg-input-bg border border-input-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-blue-400" placeholder="Nombre completo" />
                            <select name="role" defaultValue={u.role} className="w-32 bg-input-bg border border-input-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-blue-400">
                              <option value="estudiante">Estudiante</option>
                              <option value="profesor">Profesor</option>
                              <option value="admin">Administrador</option>
                            </select>
                            <div className="flex gap-2 ml-auto">
                              <button type="submit" disabled={isPending} className="flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg px-4 py-2 text-sm font-bold transition disabled:opacity-50 shadow-sm">
                                {isPending ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} Guardar
                              </button>
                              <button type="button" onClick={() => setEditandoId(null)} className="bg-white dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 text-muted border border-card-border rounded-lg px-3 py-2 text-sm transition">
                                <X size={14} />
                              </button>
                            </div>
                          </form>
                        </td>
                      ) : (
                        <>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-500 to-indigo-600 flex items-center justify-center text-white font-black text-sm shrink-0 shadow-md">
                                {u.nombre.charAt(0).toUpperCase()}
                              </div>
                              <span className="font-bold text-foreground text-sm">{u.nombre}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-muted">{u.email}</td>
                          <td className="px-6 py-4">
                             <div className="flex justify-center">
                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider border ${cfgRole.bg} ${cfgRole.color} ${cfgRole.border} ${cfgRole.darkBg} ${cfgRole.darkColor} ${cfgRole.darkBorder}`}>
                                  {cfgRole.icon} {cfgRole.label}
                                </span>
                             </div>
                          </td>
                          <td className="px-6 py-4">
                             <div className="flex justify-center">
                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${cfgEstado.bg} ${cfgEstado.color} ${cfgEstado.border}`}>
                                  {cfgEstado.icon} {cfgEstado.label}
                                </span>
                             </div>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button onClick={() => handleResetPassword(u.id, u.nombre)} className="p-2.5 bg-amber-50 hover:bg-amber-100 text-amber-600 rounded-xl transition dark:bg-amber-900/30 dark:hover:bg-amber-900/50 shadow-sm" title="Cambiar Contraseña">
                                <KeyRound size={16} />
                              </button>
                              <button onClick={() => setEditandoId(u.id)} className="p-2.5 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-xl transition dark:bg-blue-900/30 dark:hover:bg-blue-900/50 shadow-sm" title="Editar">
                                <Pencil size={16} />
                              </button>
                              <button onClick={() => handleEliminar(u.id, u.nombre)} disabled={isPending} className="p-2.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl transition disabled:opacity-50 dark:bg-red-900/30 dark:hover:bg-red-900/50 shadow-sm" title="Eliminar">
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </td>
                        </>
                      )}
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile cards */}
        <div className="md:hidden divide-y divide-card-border">
          {usuariosFiltrados.length === 0 ? (
            <div className="p-8 text-center text-muted">
              <Users size={40} className="mx-auto mb-3 text-muted-light" />
              <p className="font-medium">No se encontraron usuarios.</p>
            </div>
          ) : (
            usuariosFiltrados.map(u => {
              const cfgRole = ROLE_CONFIG[u.role] || ROLE_CONFIG.estudiante
              const dynEstado = isUserOnline(u.last_seen) ? 'activo' : 'inactivo'
              const cfgEstado = ESTADO_CONFIG[dynEstado]
              return (
                <div key={u.id} className="p-4 space-y-4">
                  {editandoId === u.id ? (
                    <form onSubmit={e => { e.preventDefault(); handleEditar(u.id, new FormData(e.currentTarget)) }} className="space-y-3">
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-muted uppercase ml-1">Nombre Completo</label>
                        <input name="nombre" defaultValue={u.nombre} required className="w-full bg-input-bg border border-input-border rounded-xl px-4 py-3 text-sm text-foreground focus:ring-2 focus:ring-blue-400 outline-none" />
                      </div>
                      <div className="grid grid-cols-1 gap-3">
                        <div className="space-y-1">
                          <label className="text-[10px] font-black text-muted uppercase ml-1">Rol</label>
                          <select name="role" defaultValue={u.role} className="w-full bg-input-bg border border-input-border rounded-xl px-3 py-3 text-sm text-foreground outline-none">
                            <option value="estudiante">Estudiante</option>
                            <option value="profesor">Profesor</option>
                            <option value="admin">Admin</option>
                          </select>
                        </div>
                      </div>
                      <div className="flex gap-2 pt-2">
                        <button type="submit" disabled={isPending} className="flex-1 bg-emerald-600 text-white rounded-xl py-3 text-sm font-bold shadow-lg">Guardar Cambios</button>
                        <button type="button" onClick={() => setEditandoId(null)} className="px-4 bg-card border border-card-border text-muted rounded-xl py-3 text-sm font-bold"><X size={18} /></button>
                      </div>
                    </form>
                  ) : (
                    <>
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-500 to-indigo-600 flex items-center justify-center text-white font-black text-lg shrink-0 shadow-lg">
                            {u.nombre.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-foreground text-sm truncate">{u.nombre}</p>
                            <p className="text-xs text-muted truncate">{u.email}</p>
                          </div>
                        </div>
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border shrink-0 ${cfgEstado.bg} ${cfgEstado.color} ${cfgEstado.border}`}>
                          {cfgEstado.label}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider border ${cfgRole.bg} ${cfgRole.color} ${cfgRole.border}`}>
                          {cfgRole.icon} {cfgRole.label}
                        </span>
                        <div className="flex gap-2">
                          <button onClick={() => handleResetPassword(u.id, u.nombre)} className="w-10 h-10 flex items-center justify-center bg-amber-50 text-amber-600 rounded-xl font-bold dark:bg-amber-900/30 dark:text-amber-300 shadow-sm border border-amber-100 dark:border-amber-800" title="Cambiar Contraseña">
                             <KeyRound size={16} />
                          </button>
                          <button onClick={() => setEditandoId(u.id)} className="w-10 h-10 flex items-center justify-center bg-blue-50 text-blue-600 rounded-xl font-bold dark:bg-blue-900/30 dark:text-blue-300 shadow-sm border border-blue-100 dark:border-blue-800">
                             <Pencil size={16} />
                          </button>
                          <button onClick={() => handleEliminar(u.id, u.nombre)} disabled={isPending} className="w-10 h-10 flex items-center justify-center bg-red-50 text-red-600 rounded-xl font-bold dark:bg-red-900/30 dark:text-red-300 shadow-sm border border-red-100 dark:border-red-800">
                             <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )
            })
          )}
        </div>

        <div className="px-6 py-4 bg-table-header-bg border-t border-card-border text-[10px] sm:text-xs font-bold text-muted flex justify-between items-center uppercase tracking-widest">
          <span>{usuariosFiltrados.length} de {usuarios.length} usuario{usuarios.length !== 1 ? 's' : ''} resultantes</span>
        </div>
      </div>
    </div>
  )
}
