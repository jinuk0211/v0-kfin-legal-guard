"use client"

import { useRouter } from "next/navigation"
import { Header } from "@/components/header"
import { CardExplorer } from "@/components/cards/card-explorer"

const STATS = [
  { value: "CC-01~05", label: "취약점 분류" },
  { value: "TILA", label: "근거 법령" },
  { value: "CourtListener", label: "판례 검증" },
]

export default function CardsPage() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-background">
      <Header currentView="landing" onNavigate={() => router.push("/")} />

      {/* Hero */}
      <div className="relative overflow-hidden border-b-2 border-foreground">
        <div className="mx-auto grid max-w-7xl grid-cols-1 lg:grid-cols-2">
          <div className="flex flex-col justify-center px-6 py-14 sm:px-12 lg:py-20">
            <p className="mb-4 text-[10px] uppercase tracking-[3px] text-muted-foreground">
              FINLEGAL-HARNESS · T2 · US CREDIT CARDS
            </p>
            <h1 className="mb-4 text-balance font-serif text-4xl font-bold leading-tight text-foreground sm:text-5xl lg:text-6xl">
              미국 신용카드
              <br />
              <span className="text-primary">약관 취약점 분석</span>
            </h1>
            <p className="mb-6 text-sm leading-relaxed text-muted-foreground">
              CFPB 신용카드 약관에서 벌칙 APR·최소결제 함정·일방적 약관변경·의무 중재 등 소비자 불리
              조항을 탐지하고, TILA 법령과 CourtListener 판례로 검증합니다.
            </p>
            <div className="flex flex-wrap gap-2">
              {["TILA / Reg Z", "Credit CARD Act", "CourtListener 판례", "개인화 위험"].map((b) => (
                <span
                  key={b}
                  className="border border-foreground/20 bg-background px-3 py-1.5 text-[10px] uppercase tracking-wider text-foreground"
                >
                  {b}
                </span>
              ))}
            </div>
          </div>

          {/* Generated hero illustration (gpt-image-2) */}
          <div className="relative hidden border-l-2 border-foreground lg:flex lg:flex-col">
            <div className="relative flex-1 overflow-hidden bg-muted/20">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/cards-hero.png"
                alt="신용카드 약관을 검토하는 돋보기와 저울 일러스트"
                className="h-full w-full object-cover object-center"
              />
            </div>
            <div className="grid grid-cols-3 border-t-2 border-foreground">
              {STATS.map((s) => (
                <div key={s.label} className="border-r border-foreground/10 px-4 py-5 last:border-r-0">
                  <div className="font-serif text-lg font-bold text-foreground">{s.value}</div>
                  <p className="mt-1 text-[10px] uppercase tracking-wider text-muted-foreground">
                    {s.label}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <CardExplorer />
    </div>
  )
}
