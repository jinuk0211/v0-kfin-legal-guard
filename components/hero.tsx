"use client"

import { VULNERABILITY_TAXONOMY } from "@/lib/schemas"

const STATS = [
  { value: "612", label: "학습 판례", unit: "건" },
  { value: "2.1", label: "평균 분석", unit: "초" },
  { value: "300", label: "분쟁사례", unit: "개" },
  { value: "99.2", label: "탐지 정확도", unit: "%" },
]

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
            <p className="mb-6 text-[11px] uppercase tracking-[2px] text-muted-foreground">
              AI LEGAL GUARD
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

          {/* Right - Diagonal banner with stats */}
          <div className="relative hidden lg:block">
            <div className="absolute inset-0 bg-muted/30">
              <div className="absolute -right-32 top-0 h-full w-[300px] skew-x-[-15deg] bg-primary" />
              
              {/* Stats overlay */}
              <div className="relative z-10 flex h-full flex-col justify-center px-12 py-16">
                <div className="grid grid-cols-2 gap-6">
                  {STATS.map((stat, index) => (
                    <div
                      key={stat.label}
                      className="animate-slide-up border-l-2 border-foreground/20 pl-4"
                      style={{ animationDelay: `${index * 100}ms` }}
                    >
                      <div className="flex items-baseline gap-1">
                        <span className="font-serif text-3xl font-bold tabular-nums text-foreground">
                          {stat.value}
                        </span>
                        <span className="text-sm text-muted-foreground">{stat.unit}</span>
                      </div>
                      <p className="mt-1 text-[10px] uppercase tracking-wider text-muted-foreground">
                        {stat.label}
                      </p>
                    </div>
                  ))}
                </div>
                
                {/* Feature badges */}
                <div className="mt-10 flex flex-wrap gap-2">
                  <span className="border border-foreground/20 bg-background/80 px-3 py-1.5 text-[10px] uppercase tracking-wider text-foreground">
                    Claude AI 기반
                  </span>
                  <span className="border border-foreground/20 bg-background/80 px-3 py-1.5 text-[10px] uppercase tracking-wider text-foreground">
                    실시간 분석
                  </span>
                  <span className="border border-foreground/20 bg-background/80 px-3 py-1.5 text-[10px] uppercase tracking-wider text-foreground">
                    증거 기반
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Taxonomy Section */}
      <div className="mx-auto max-w-7xl px-6 py-16 sm:px-12">
        <div className="mb-8 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <span className="bg-primary px-3 py-1.5 text-[10px] font-medium uppercase tracking-wider text-primary-foreground">
              취약점 분류 체계
            </span>
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
              Vulnerability Taxonomy
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            보험 5개 유형 + 대출 3개 유형의 약관 취약점을 탐지합니다
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-2">
          {/* Insurance vulnerabilities */}
          <div className="border border-border">
            <div className="border-b border-border bg-muted/50 px-4 py-3">
              <span className="text-[10px] font-medium uppercase tracking-wider text-foreground">
                보험 약관 취약점
              </span>
            </div>
            {VULNERABILITY_TAXONOMY.insurance.map((item, index) => (
              <div
                key={item.id}
                className="group flex items-start gap-4 border-b border-border px-4 py-4 transition-colors last:border-b-0 hover:bg-muted/30"
              >
                <span className="flex h-6 w-14 flex-shrink-0 items-center justify-center bg-primary/10 text-[10px] font-bold text-primary">
                  {item.id}
                </span>
                <div className="flex-1">
                  <span className="text-sm font-medium text-foreground">{item.name}</span>
                  <p className="mt-0.5 text-xs text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100">
                    {index === 0 && "보장 범위가 명확하지 않은 조항"}
                    {index === 1 && "고지의무 위반 시 면책 범위 과다"}
                    {index === 2 && "대기기간 조건이 불리한 경우"}
                    {index === 3 && "해지권 행사 조건 불균형"}
                    {index === 4 && "해약환급금 산정 방식 불리"}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Loan vulnerabilities */}
          <div className="border border-border">
            <div className="border-b border-border bg-muted/50 px-4 py-3">
              <span className="text-[10px] font-medium uppercase tracking-wider text-foreground">
                대출 약관 취약점
              </span>
            </div>
            {VULNERABILITY_TAXONOMY.loan.map((item, index) => (
              <div
                key={item.id}
                className="group flex items-start gap-4 border-b border-border px-4 py-4 transition-colors last:border-b-0 hover:bg-muted/30"
              >
                <span className="flex h-6 w-16 flex-shrink-0 items-center justify-center bg-primary/10 text-[10px] font-bold text-primary">
                  {item.id}
                </span>
                <div className="flex-1">
                  <span className="text-sm font-medium text-foreground">{item.name}</span>
                  <p className="mt-0.5 text-xs text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100">
                    {index === 0 && "변동금리 위험 고지 미흡"}
                    {index === 1 && "조기상환 수수료 조건 불투명"}
                    {index === 2 && "담보권 실행 요건 과도"}
                  </p>
                </div>
              </div>
            ))}
            
            {/* CTA in loan section */}
            <div className="bg-muted/30 px-4 py-5">
              <p className="mb-3 text-xs text-muted-foreground">
                약관에서 위 유형의 취약점을 AI가 자동으로 탐지합니다
              </p>
              <button
                onClick={onStartAnalysis}
                className="text-xs font-medium text-primary hover:underline"
              >
                지금 분석 시작하기 →
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-16 flex flex-col items-center gap-4 border-t border-border pt-8 sm:flex-row sm:justify-between">
          <p className="text-[10px] uppercase tracking-[2px] text-muted-foreground">
            KFinLegal-Harness - AI for Legal Reasoning
          </p>
          <div className="flex items-center gap-4 text-[10px] text-muted-foreground">
            <span>한국어 지원</span>
            <span className="h-3 w-px bg-border" />
            <span>Claude AI</span>
            <span className="h-3 w-px bg-border" />
            <span>무료 사용</span>
          </div>
        </div>
      </div>
    </div>
  )
}
