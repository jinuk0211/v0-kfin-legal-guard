"use client"

import { cn } from "@/lib/utils"

interface HeaderProps {
  currentView: "landing" | "analyzer"
  onNavigate: (view: "landing" | "analyzer") => void
}

export function Header({ currentView, onNavigate }: HeaderProps) {
  return (
    <header className="sticky top-0 z-50 border-b-2 border-foreground bg-background">
      <div className="mx-auto flex h-[52px] max-w-7xl items-center justify-between px-4 sm:px-8">
        {/* Logo */}
        <button
          onClick={() => onNavigate("landing")}
          className="flex items-baseline gap-2 bg-transparent p-0"
        >
          <span className="font-serif text-xl font-bold text-foreground">
            KFin<span className="text-primary">Legal</span>
          </span>
          <span className="hidden border-l border-border pl-2 text-[8px] uppercase tracking-[2px] text-muted-foreground sm:inline">
            AI Legal Guard
          </span>
        </button>

        {/* Navigation */}
        <nav className="flex">
          <button
            onClick={() => onNavigate("analyzer")}
            className={cn(
              "mb-[-2px] h-[51px] border-b-2 bg-transparent px-4 text-[10px] font-medium uppercase tracking-[1.5px] transition-colors",
              currentView === "analyzer"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:border-primary hover:text-primary"
            )}
          >
            약관 분석
          </button>
        </nav>

        {/* Status indicator */}
        <div className="flex items-center gap-1.5 text-[9px] uppercase tracking-[1.5px] text-muted-foreground">
          <span className="inline-block h-[5px] w-[5px] animate-pulse-dot rounded-full bg-green-600" />
          ONLINE
        </div>
      </div>
    </header>
  )
}
