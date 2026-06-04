"use client"

import { useRouter } from "next/navigation"
import { Header } from "@/components/header"
import { LoanExplorer } from "@/components/loans/loan-explorer"

const STATS = [
  { value: "LOAN-01~05", label: "취약점 분류" },
  { value: "SEC EDGAR", label: "원문 출처" },
  { value: "실시간 분석", label: "Claude 호출" },
]

export default function LoansPage() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-background">
      <Header currentView="landing" onNavigate={() => router.push("/")} />

      {/* Hero — full-bleed gpt-image-2 background with a cream/ink scrim.
          Falls back to bg-background when /loans-hero.png is absent. */}
      <div className="relative overflow-hidden border-b-2 border-foreground bg-background">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/loans-hero.png"
          alt=""
          aria-hidden="true"
          className="absolute inset-0 h-full w-full object-cover object-center"
        />
        {/* Scrim for legibility */}
        <div className="absolute inset-0 bg-background/85" />
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/70 to-transparent" />

        <div className="relative mx-auto max-w-7xl px-6 py-16 sm:px-12 lg:py-24">
          <div className="max-w-2xl">
            <p className="mb-4 text-[10px] uppercase tracking-[3px] text-muted-foreground">
              FINLEGAL-HARNESS · T3 · US LOAN AGREEMENTS
            </p>
            <h1 className="mb-4 text-balance font-serif text-4xl font-bold leading-tight text-foreground sm:text-5xl lg:text-6xl">
              미국 대출 계약서
              <br />
              <span className="text-primary">차주 불리 조항 분석</span>
            </h1>
            <p className="mb-6 text-sm leading-relaxed text-muted-foreground">
              SEC EDGAR 공시 대출·신용계약서에서 가속조항·MAC·중도상환 위약금·교차채무불이행·후순위 등
              차주에게 불리한 조항을 탐지하고 심각도를 분류합니다.
            </p>
            <div className="mb-8 flex flex-wrap gap-2">
              {["Acceleration", "MAC", "Prepayment", "Cross-default", "Subordination"].map((b) => (
                <span
                  key={b}
                  className="border border-foreground/20 bg-background/70 px-3 py-1.5 text-[10px] uppercase tracking-wider text-foreground"
                >
                  {b}
                </span>
              ))}
            </div>

            <div className="grid max-w-md grid-cols-3 border-2 border-foreground bg-background">
              {STATS.map((s) => (
                <div key={s.label} className="border-r border-foreground/10 px-4 py-4 last:border-r-0">
                  <div className="font-serif text-base font-bold text-foreground">{s.value}</div>
                  <p className="mt-1 text-[10px] uppercase tracking-wider text-muted-foreground">
                    {s.label}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <LoanExplorer />
    </div>
  )
}
