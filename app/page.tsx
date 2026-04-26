"use client"

import { useState } from "react"
import { Header } from "@/components/header"
import { Hero } from "@/components/hero"
import { ContractAnalyzer } from "@/components/contract-analyzer"

type View = "landing" | "analyzer"

export default function Home() {
  const [currentView, setCurrentView] = useState<View>("landing")

  return (
    <div className="min-h-screen bg-background">
      <Header currentView={currentView} onNavigate={setCurrentView} />

      {currentView === "landing" ? (
        <Hero onStartAnalysis={() => setCurrentView("analyzer")} />
      ) : (
        <ContractAnalyzer onBack={() => setCurrentView("landing")} />
      )}
    </div>
  )
}
