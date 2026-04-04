'use client'

import { useState } from 'react'
import { Menu, X } from 'lucide-react'
import ThemeToggle from './ThemeToggle'

type SidebarShellProps = {
  sidebar: React.ReactNode
  headerLabel: string
  children: React.ReactNode
}

export default function SidebarShell({ sidebar, headerLabel, children }: SidebarShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="flex min-h-screen bg-background font-sans">
      
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed lg:sticky top-0 left-0 z-40 h-screen w-64
          bg-slate-900 text-slate-300 flex flex-col shadow-2xl
          transform transition-transform duration-300 ease-in-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0
        `}
      >
        {/* Close button for mobile */}
        <button
          onClick={() => setSidebarOpen(false)}
          className="absolute top-4 right-4 p-1.5 rounded-lg bg-white/10 text-white lg:hidden hover:bg-white/20 transition"
        >
          <X size={18} />
        </button>

        {/* Sidebar content passed from layout */}
        <div className="flex flex-col h-full overflow-y-auto" onClick={() => setSidebarOpen(false)}>
          {sidebar}
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-h-screen lg:h-screen lg:overflow-y-auto bg-background">
        <header className="h-14 lg:h-16 bg-card border-b border-card-border flex items-center justify-between px-4 lg:px-8 shrink-0 sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 rounded-lg bg-badge-bg border border-badge-border text-muted hover:text-foreground hover:bg-card-hover transition lg:hidden"
              aria-label="Abrir menú"
            >
              <Menu size={20} />
            </button>
            <span className="text-muted font-medium text-sm lg:text-base">{headerLabel}</span>
          </div>
          <ThemeToggle />
        </header>
        <div className="p-4 lg:p-8 flex-1">
          {children}
        </div>
      </main>
    </div>
  )
}
