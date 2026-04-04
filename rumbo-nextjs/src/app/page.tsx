import Link from 'next/link'
import { Sparkles, ArrowRight } from 'lucide-react'

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden text-white" 
         style={{ background: "linear-gradient(135deg, #001F3F 0%, #003D7A 100%)"}}>
         
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-teal-400/20 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-600/30 blur-[150px] rounded-full pointer-events-none" />

      <main className="relative z-10 w-full max-w-4xl text-center flex flex-col items-center animate-in fade-in slide-in-from-bottom-8 duration-1000">
        <div className="bg-white/10 text-teal-300 font-medium px-4 py-2 rounded-full backdrop-blur-md mb-8 inline-flex items-center gap-2 border border-white/10 shadow-xl">
          <Sparkles size={16} /> Welcome to the new era
        </div>
        
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 leading-tight drop-shadow-xl">
          Plataforma <br/>
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-300 to-blue-400">
            Aprendamos Jugando
          </span>
        </h1>
        
        <p className="text-xl md:text-2xl text-slate-300 mb-12 max-w-2xl drop-shadow-md">
          El sistema interactivo para dominar la Lectura Crítica en todos sus niveles.
        </p>
        
        <Link 
          href="/login"
          className="group flex items-center gap-3 bg-gradient-to-r from-teal-500 to-blue-600 hover:from-teal-400 hover:to-blue-500 text-white rounded-2xl px-8 py-4 font-bold text-lg transition-all shadow-2xl hover:shadow-teal-500/30 hover:scale-105"
        >
          Iniciar Sesión
          <ArrowRight size={22} className="group-hover:translate-x-1 transition-transform" />
        </Link>
      </main>
    </div>
  )
}
