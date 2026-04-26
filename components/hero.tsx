"use client"

import { VULNERABILITY_TAXONOMY } from "@/lib/schemas"

interface HeroProps {
  onStartAnalysis: () => void
}

export function Hero({ onStartAnalysis }: HeroProps) {
  return (
    <div className="animate-fade-in">
      {/* Hero Section */}
      <div className="relative overflow-hidden border-b-2 border-foreground">
        <div className="mx-auto grid max-w-7xl grid-cols-1 lg:grid-cols-2">
          {/* Left content */}
          <div className="flex flex-col justify-center px-6 py-16 sm:px-12 lg:py-24">
            <p className="mb-4 text-[10px] uppercase tracking-[3px] text-muted-foreground">
              KFINLEGAL-HARNESS v2.0
            </p>
            <h1 className="mb-6 text-balance font-serif text-5xl font-bold leading-tight text-foreground sm:text-6xl lg:text-7xl">
              KFin
              <br />
              <span className="text-primary">Legal</span>
            </h1>
            <p className="mb-2 text-[11px] uppercase tracking-[2px] text-muted-foreground">
              AI LEGAL GUARD
            </p>
            <p className="mb-8 max-w-md text-pretty text-sm leading-relaxed text-muted-foreground">
              GAN-LOOP VULNERABILITY DETECTION
              <br />
              KOREAN FINANCIAL CONTRACT ANALYSIS
              <br />
              ICAIL 2026 - SINGAPORE
            </p>

            <div className="mb-8 border-t-2 border-foreground pt-6">
              <h2 className="mb-2 font-serif text-xl font-bold text-foreground">
                자동화된 취약점 탐지 - 판례 기반 검증 - 심각도 분류
              </h2>
              <p className="text-xs text-muted-foreground">
                Automated Vulnerability Detection - Korean Financial Contracts
              </p>
            </div>

            <button
              onClick={onStartAnalysis}
              className="w-fit border-2 border-foreground bg-transparent px-8 py-3 text-xs font-medium uppercase tracking-[2px] text-foreground transition-colors hover:border-primary hover:bg-primary hover:text-primary-foreground"
            >
              분석 시작하기
            </button>
          </div>

          {/* Right - Diagonal banner accent */}
          <div className="relative hidden lg:block">
            <div className="absolute inset-0 flex items-center justify-center bg-muted/50">
              <div className="absolute -right-32 top-0 h-full w-[300px] skew-x-[-15deg] bg-primary" />
              <div className="relative z-10 p-8 text-center">
                <p className="mb-4 font-serif text-5xl font-bold text-foreground">
                  판
                  <br />결<br />문
                </p>
                <p className="text-xs uppercase tracking-[2px] text-muted-foreground">
                  The Verdict
                  <br />
                  Cartography
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Taxonomy Section */}
      <div className="mx-auto max-w-7xl px-6 py-12 sm:px-12">
        <div className="mb-6 flex items-center gap-3">
          <span className="bg-primary px-3 py-1 text-[10px] font-medium uppercase tracking-wider text-primary-foreground">
            INS - LOAN TAXONOMY
          </span>
        </div>

        <div className="grid gap-8 md:grid-cols-2">
          {/* Insurance vulnerabilities */}
          <div>
            {VULNERABILITY_TAXONOMY.insurance.map((item) => (
              <div
                key={item.id}
                className="flex items-start gap-4 border-b border-border py-4"
              >
                <span className="text-xs font-bold text-primary">{item.id}</span>
                <span className="text-sm text-foreground">{item.name}</span>
              </div>
            ))}
          </div>

          {/* Loan vulnerabilities */}
          <div>
            {VULNERABILITY_TAXONOMY.loan.map((item) => (
              <div
                key={item.id}
                className="flex items-start gap-4 border-b border-border py-4"
              >
                <span className="text-xs font-bold text-primary">{item.id}</span>
                <span className="text-sm text-foreground">{item.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-12 border-t border-border pt-6 text-[10px] uppercase tracking-[2px] text-muted-foreground">
          KFinLegal-Harness - AI for Legal Reasoning - ICAIL 2026 - Singapore
        </div>
      </div>
    </div>
  )
}
