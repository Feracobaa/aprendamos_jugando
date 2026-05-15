'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import { Sparkles, ArrowRight, UserRound, KeyRound, Loader2, BookOpen } from 'lucide-react'
import { joinPlatform } from './actions/join-platform'

export default function Home() {
  const [state, action, isPending] = useActionState(joinPlatform, null)

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden font-sans text-slate-900 bg-slate-50">
         
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-teal-400/20 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-600/10 blur-[150px] rounded-full pointer-events-none" />

      <main className="relative z-10 w-full max-w-md text-center flex flex-col items-center animate-in fade-in slide-in-from-bottom-8 duration-1000">
        
        <div className="bg-gradient-to-tr from-teal-400 to-blue-600 p-4 rounded-2xl text-white shadow-xl mb-8 transform -rotate-6 hover:rotate-0 transition-transform duration-300">
          <BookOpen size={48} strokeWidth={1.5} />
        </div>
        
        <h1 className="text-4xl sm:text-5xl font-black tracking-tight mb-2 leading-tight">
          Aprendamos <br/>
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-500 to-blue-600">
            Jugando
          </span>
        </h1>
        
        <p className="text-lg text-slate-500 mb-8 max-w-sm font-medium">
          Ingresa tu código y prepárate para jugar y aprender.
        </p>

        <form action={action} className="w-full bg-white p-8 rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 relative">
           
           {state?.error && (
             <div className="mb-6 p-4 bg-rose-50 border border-rose-200 text-rose-600 text-sm font-bold rounded-xl animate-in fade-in zoom-in-95">
               {state.error}
             </div>
           )}

           <div className="space-y-5 text-left mb-8">
             <div>
               <label htmlFor="codigo" className="block text-sm font-bold text-slate-700 mb-1 ml-1">
                 Código de Clase
               </label>
               <div className="relative">
                 <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                   <KeyRound size={20} />
                 </div>
                 <input 
                   type="text" 
                   id="codigo"
                   name="codigo" 
                   placeholder="Ej. RUMBO2026"
                   className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-lg font-bold text-slate-800 placeholder:text-slate-400 placeholder:font-normal focus:bg-white focus:outline-none focus:ring-4 focus:ring-teal-500/20 focus:border-teal-500 transition-all uppercase"
                   required 
                   disabled={isPending}
                 />
               </div>
             </div>

             <div>
               <label htmlFor="nombre" className="block text-sm font-bold text-slate-700 mb-1 ml-1">
                 Nombre Completo
               </label>
               <div className="relative">
                 <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                   <UserRound size={20} />
                 </div>
                 <input 
                   type="text" 
                   id="nombre"
                   name="nombre" 
                   placeholder="Tu nombre y apellido"
                   className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-lg font-bold text-slate-800 placeholder:text-slate-400 placeholder:font-normal focus:bg-white focus:outline-none focus:ring-4 focus:ring-teal-500/20 focus:border-teal-500 transition-all"
                   required 
                   disabled={isPending}
                 />
               </div>
             </div>
           </div>
          
           <button 
             type="submit" 
             disabled={isPending}
             className="w-full group flex items-center justify-center gap-3 bg-slate-900 hover:bg-teal-600 text-white rounded-2xl px-8 py-4 font-bold text-lg transition-all shadow-lg hover:shadow-teal-500/30 active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
           >
             {isPending ? (
               <>
                 <Loader2 size={24} className="animate-spin" /> Conectando...
               </>
             ) : (
               <>
                 <Sparkles size={20} className="text-teal-400 group-hover:text-white transition-colors" /> 
                 Entrar a la Plataforma 
                 <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
               </>
             )}
           </button>
        </form>

        <div className="mt-8">
          <Link href="/login" className="text-sm font-bold text-slate-400 hover:text-slate-600 transition-colors">
            ¿Eres Profesor? Inicia sesión aquí
          </Link>
        </div>
      </main>
    </div>
  )
}
