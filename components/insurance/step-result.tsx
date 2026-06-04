"use client"

import { useState } from "react"

const ICONS: { kw: string[]; label: string; bg: string }[] = [
  { kw: ["실손", "의료"], label: "의료", bg: "bg-green-50 text-green-700" },
  { kw: ["생명", "종신"], label: "생명", bg: "bg-blue-50 text-blue-700" },
  { kw: ["자동차"], label: "자동차", bg: "bg-yellow-50 text-yellow-700" },
  { kw: ["화재", "주택"], label: "화재", bg: "bg-red-50 text-red-700" },
  { kw: ["암"], label: "암", bg: "bg-purple-50 text-purple-700" },
]

function getIcon(name = "") {
  return ICONS.find(g => g.kw.some(k => name.includes(k))) ?? { label: "보험", bg: "bg-muted text-muted-foreground" }
}

function won(n: unknown) {
  const x = parseInt(String(n ?? 0).replace(/[^0-9]/g, ""))
  return isNaN(x) ? "-" : x.toLocaleString("ko-KR")
}

interface Contract {
  resInsuranceName?: string
  resProductName?: string
  resCompanyNm?: string
  resManager?: string
  commEndDate?: string
  resAccountEndDate?: string
  resPremium?: unknown
  resContractStatus?: string
}

interface Props {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any
  onReset: () => void
  onLogout?: () => void
  userName?: string
}

export function StepResult({ data, onReset, onLogout, userName }: Props) {
  const [tab, setTab] = useState<"active" | "inactive">("active")
  const [showRaw, setShowRaw] = useState(false)

  const flat: Contract[] = data?.resFlatRateContractList ?? []
  const actual: Contract[] = data?.resActualLossContractList ?? []
  const all: Contract[] = [...flat, ...actual]
  const active = all.filter(c => c.resContractStatus === "정상")
  const inactive = all.filter(c => c.resContractStatus !== "정상")
  const shown = tab === "active" ? active : inactive

  const totalPremium = active.reduce((s, c) => {
    const p = parseInt(String(c.resPremium ?? 0).replace(/[^0-9]/g, ""))
    return s + (isNaN(p) ? 0 : p)
  }, 0)

  return (
    <div className="animate-slide-up">
      {/* Summary */}
      <div className="mb-4 border border-border bg-card p-6">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-[10px] font-semibold uppercase tracking-[2px] text-muted-foreground">조회 완료</p>
          {userName && (
            <span className="text-xs text-muted-foreground">
              {userName}님
            </span>
          )}
        </div>
        <h2 className="mb-5 font-serif text-2xl font-bold text-foreground">내 보험 현황</h2>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-muted/50 p-4">
            <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">총 가입 건수</p>
            <p className="font-serif text-3xl font-bold tabular-nums text-foreground">{active.length}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">건</p>
          </div>
          <div className="bg-muted/50 p-4">
            <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">월 납입 합계</p>
            <p className="font-serif text-3xl font-bold tabular-nums text-foreground">{totalPremium ? won(totalPremium) : "-"}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">원/월</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-3 flex gap-2">
        {(["active", "inactive"] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 text-xs font-semibold transition-colors ${tab === t ? "border-2 border-foreground bg-foreground text-background" : "border border-border bg-transparent text-muted-foreground hover:border-foreground hover:text-foreground"}`}>
            {t === "active" ? `정상 계약 (${active.length})` : `실효/해지 (${inactive.length})`}
          </button>
        ))}
      </div>

      {/* Contract list */}
      <div className="border border-border bg-card">
        {shown.length === 0 ? (
          <div className="py-12 text-center text-sm text-muted-foreground">
            {tab === "active" ? "정상 계약이 없습니다." : "실효/해지된 계약이 없습니다."}
          </div>
        ) : (
          shown.map((c, i) => {
            const name = (c.resInsuranceName || c.resProductName || "보험 상품").replace(/\+/g, " ")
            const { label, bg } = getIcon(name)
            const company = c.resCompanyNm || c.resManager || ""
            const expire = c.commEndDate || c.resAccountEndDate || ""
            const premium = won(c.resPremium)
            const status = c.resContractStatus || ""
            const statusColor = status === "정상" ? "text-green-600" : status === "실효" ? "text-red-600" : "text-muted-foreground"

            const analyzeHref = `/analyze?product=${encodeURIComponent(name)}${company ? `&company=${encodeURIComponent(company)}` : ""}`

            return (
              <div key={i} className="border-b border-border last:border-b-0">
                <div className="flex items-center gap-4 p-4 pb-2">
                  <div className={`flex h-11 w-11 flex-shrink-0 items-center justify-center text-[10px] font-bold uppercase tracking-wider ${bg}`}>
                    {label}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-foreground">{name}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {company && <span>{company} · </span>}
                      <span className={`font-semibold ${statusColor}`}>{status}</span>
                      {expire && <span> · 만기 {expire.slice(0,4)}.{expire.slice(4,6)}.{expire.slice(6,8)}</span>}
                    </p>
                  </div>
                  <div className="flex-shrink-0 text-right">
                    <p className="text-sm font-bold tabular-nums text-foreground">{premium !== "-" ? premium : "-"}</p>
                    <p className="text-[10px] text-muted-foreground">원/월</p>
                  </div>
                </div>
                <div className="flex justify-end px-4 pb-3">
                  <a
                    href={analyzeHref}
                    className="text-[11px] font-semibold text-primary transition-colors hover:underline"
                  >
                    이 약관 취약점 분석하기 →
                  </a>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Raw JSON toggle */}
      <div className="mt-4 border border-border bg-card">
        <button onClick={() => setShowRaw(v => !v)}
          className="flex w-full items-center justify-between px-4 py-3 text-xs font-semibold text-muted-foreground hover:text-foreground">
          <span>원본 응답 데이터 보기</span>
          <span>{showRaw ? "▲" : "▼"}</span>
        </button>
        {showRaw && (
          <pre className="max-h-64 overflow-auto border-t border-border bg-muted/50 p-4 text-[10px] leading-relaxed text-muted-foreground">
            {JSON.stringify(data, null, 2)}
          </pre>
        )}
      </div>

      <div className="mt-3 flex gap-2">
        <button onClick={onReset}
          className="flex-1 border border-border bg-transparent py-3 text-sm text-muted-foreground transition-colors hover:border-foreground hover:text-foreground">
          다시 조회
        </button>
        {onLogout && (
          <button onClick={onLogout}
            className="flex-1 border border-destructive/30 bg-transparent py-3 text-sm text-destructive/70 transition-colors hover:border-destructive hover:bg-destructive/10 hover:text-destructive">
            로그아웃
          </button>
        )}
      </div>
    </div>
  )
}
