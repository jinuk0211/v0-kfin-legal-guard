"use client"

import { useEffect, useMemo, useState } from "react"
import type { CardReport } from "@/lib/card-schemas"
import { CARD_PRODUCTS, CARD_PERSONAS } from "@/lib/card-schemas"
import { CardReportView } from "./card-report"

interface Agreement {
  issuer: string
  name: string
  file: string
}

const ANALYSIS_STEPS = [
  "약관 조항 파싱",
  "취약점 탐지 (CC-01~05)",
  "CourtListener 판례 대조",
  "심각도 분류 및 리포트 생성",
]

type State = "input" | "analyzing" | "result"

export function CardExplorer() {
  const [state, setState] = useState<State>("input")
  const [report, setReport] = useState<CardReport | null>(null)
  const [persona, setPersona] = useState<string>("P01")
  const [error, setError] = useState("")
  const [currentStep, setCurrentStep] = useState(0)
  const [pending, setPending] = useState<string>("")

  const [agreements, setAgreements] = useState<Agreement[]>([])
  const [loadingManifest, setLoadingManifest] = useState(true)

  // Bar-select state: issuer → agreement → preview
  const [selectedIssuer, setSelectedIssuer] = useState("")
  const [selectedFile, setSelectedFile] = useState("")
  const [preview, setPreview] = useState("")
  const [loadingPreview, setLoadingPreview] = useState(false)

  useEffect(() => {
    fetch("/2025_Q2_processed/manifest.json")
      .then((r) => (r.ok ? r.json() : { agreements: [] }))
      .then((d) => setAgreements(d.agreements ?? []))
      .catch(() => setAgreements([]))
      .finally(() => setLoadingManifest(false))
  }, [])

  // Group by issuer for the two cascading select bars.
  const byIssuer = useMemo(
    () =>
      agreements.reduce<Record<string, Agreement[]>>((acc, a) => {
        ;(acc[a.issuer] ??= []).push(a)
        return acc
      }, {}),
    [agreements]
  )
  const issuers = Object.keys(byIssuer).sort((a, b) => a.localeCompare(b))
  const agreementsForIssuer = selectedIssuer ? byIssuer[selectedIssuer] ?? [] : []
  const selectedAgreement = agreements.find((a) => a.file === selectedFile) ?? null

  function handleIssuerChange(issuer: string) {
    setSelectedIssuer(issuer)
    setSelectedFile("")
    setPreview("")
    setError("")
  }

  async function handleFileChange(file: string) {
    setSelectedFile(file)
    setPreview("")
    setError("")
    if (!file) return
    setLoadingPreview(true)
    try {
      const text = await fetch(`/2025_Q2_processed/${encodeURIComponent(file)}`).then((r) => {
        if (!r.ok) throw new Error()
        return r.text()
      })
      setPreview(text)
    } catch {
      setError("약관 미리보기를 불러오지 못했습니다")
    } finally {
      setLoadingPreview(false)
    }
  }

  async function runPrecomputed(productLabel: string) {
    setError("")
    setPending(productLabel)
    setState("analyzing")
    setCurrentStep(ANALYSIS_STEPS.length - 1) // precomputed: results are ready
    try {
      const res = await fetch("/api/cards/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ product: productLabel, personaId: persona }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "분석에 실패했습니다")
      setReport(data.report)
      setState("result")
    } catch (err) {
      setError(err instanceof Error ? err.message : "분석 오류")
      setState("input")
    } finally {
      setPending("")
    }
  }

  async function runAnalysis() {
    if (!selectedAgreement) return
    setError("")
    setPending(selectedAgreement.name)
    setState("analyzing")
    setCurrentStep(0)
    const interval = setInterval(
      () => setCurrentStep((p) => Math.min(p + 1, ANALYSIS_STEPS.length - 1)),
      3000
    )
    try {
      const text =
        preview ||
        (await fetch(`/2025_Q2_processed/${encodeURIComponent(selectedAgreement.file)}`).then((r) => {
          if (!r.ok) throw new Error("약관 파일을 불러오지 못했습니다")
          return r.text()
        }))
      const res = await fetch("/api/cards/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contractText: text, product: selectedAgreement.name }),
      })
      clearInterval(interval)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "분석에 실패했습니다")
      setReport(data.report)
      setState("result")
    } catch (err) {
      clearInterval(interval)
      setError(err instanceof Error ? err.message : "분석 오류 (실시간 분석은 API 크레딧이 필요합니다)")
      setState("input")
    } finally {
      setPending("")
    }
  }

  if (state === "result" && report) {
    return (
      <CardReportView
        report={report}
        onReset={() => {
          setState("input")
          setReport(null)
        }}
      />
    )
  }

  if (state === "analyzing") {
    return (
      <div className="animate-slide-up mx-auto flex min-h-[50vh] max-w-2xl flex-col items-center justify-center px-6 py-16">
        <div className="mb-8 h-12 w-12 animate-spin-slow rounded-full border-2 border-muted border-t-primary" />
        <h2 className="mb-2 font-serif text-2xl font-bold text-foreground">분석 중</h2>
        <p className="mb-8 text-sm text-muted-foreground">{pending}</p>
        <div className="w-full max-w-md">
          {ANALYSIS_STEPS.map((step, i) => (
            <div key={step} className="flex items-center gap-3 border-b border-border py-3">
              <div
                className={`flex h-6 w-6 items-center justify-center text-xs font-bold ${
                  i <= currentStep ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                }`}
              >
                {i + 1}
              </div>
              <span className={`text-sm ${i <= currentStep ? "text-foreground" : "text-muted-foreground"}`}>
                {step}
              </span>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="animate-slide-up mx-auto max-w-5xl px-6 py-10 sm:px-12">
      {error && (
        <div className="mb-6 border border-primary bg-primary/10 px-4 py-3 text-sm text-primary">
          {error}
        </div>
      )}

      {/* Section A — precomputed sample reports */}
      <div className="mb-12">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b-2 border-foreground pb-4">
          <div className="flex items-baseline gap-3">
            <span className="font-serif text-2xl font-bold text-foreground">샘플 분석 리포트</span>
            <span className="text-[10px] uppercase tracking-[2px] text-muted-foreground">
              Precomputed · CourtListener-grounded
            </span>
          </div>
          {/* Optional persona toggle (defaults to P01) */}
          <div className="flex gap-1">
            {CARD_PERSONAS.map((p) => (
              <button
                key={p.id}
                onClick={() => setPersona(p.id)}
                title={p.summary}
                className={`px-2.5 py-1 text-[10px] font-semibold transition-colors ${
                  persona === p.id
                    ? "bg-foreground text-background"
                    : "border border-border text-muted-foreground hover:border-foreground hover:text-foreground"
                }`}
              >
                {p.id}
              </button>
            ))}
          </div>
        </div>
        <p className="mb-4 text-xs text-muted-foreground">
          {CARD_PERSONAS.find((p) => p.id === persona)?.summary} 기준 · 실제 하네스(T2)가 생성한 분석 결과입니다.
        </p>
        <div className="grid gap-3 sm:grid-cols-3">
          {CARD_PRODUCTS.map((prod) => (
            <button
              key={prod.key}
              onClick={() => runPrecomputed(prod.label)}
              className="group border border-border bg-card p-4 text-left transition-colors hover:border-primary"
            >
              <div className="mb-2 flex h-8 w-8 items-center justify-center bg-primary/10 text-[10px] font-bold uppercase text-primary">
                CC
              </div>
              <p className="text-sm font-semibold text-foreground group-hover:text-primary">
                {prod.label}
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">{prod.issuer}</p>
              <p className="mt-3 text-[10px] font-medium uppercase tracking-wider text-primary">
                분석 보기 →
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Section B — raw CFPB agreements (bar select → preview → analyze) */}
      <div>
        <div className="mb-4 flex items-baseline gap-3 border-b-2 border-foreground pb-4">
          <span className="font-serif text-2xl font-bold text-foreground">CFPB 약관 둘러보기</span>
          <span className="text-[10px] uppercase tracking-[2px] text-muted-foreground">
            2025 Q2 · {agreements.length}건
          </span>
        </div>
        <p className="mb-4 text-xs text-muted-foreground">
          CFPB 신용카드 약관 데이터베이스의 실제 약관입니다. 발행사와 약관을 선택해 원문을 확인한 뒤
          분석하세요. 분석은 Claude 실시간 호출로 수행됩니다(API 크레딧 필요).
        </p>

        <div className="mx-auto max-w-2xl">
          {/* Agreement picker — bar select */}
          <div className="border border-border">
            <div className="flex items-center justify-between border-b border-border bg-muted/50 px-4 py-3">
              <span className="text-[10px] font-medium uppercase tracking-wider text-foreground">
                약관 선택
              </span>
              <span className="text-[10px] text-muted-foreground">{agreements.length}건</span>
            </div>

            <div className="space-y-4 p-4">
              {loadingManifest ? (
                <div className="py-4 text-center text-sm text-muted-foreground">
                  약관 목록 불러오는 중...
                </div>
              ) : (
                <>
                  {/* Issuer bar */}
                  <div>
                    <label className="mb-1.5 block text-[10px] uppercase tracking-wider text-muted-foreground">
                      발행사
                    </label>
                    <select
                      value={selectedIssuer}
                      onChange={(e) => handleIssuerChange(e.target.value)}
                      className="w-full border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none"
                    >
                      <option value="">발행사를 선택하세요</option>
                      {issuers.map((issuer) => (
                        <option key={issuer} value={issuer}>
                          {issuer} ({byIssuer[issuer].length}건)
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Agreement bar */}
                  <div>
                    <label className="mb-1.5 block text-[10px] uppercase tracking-wider text-muted-foreground">
                      약관
                    </label>
                    <select
                      value={selectedFile}
                      onChange={(e) => handleFileChange(e.target.value)}
                      disabled={!selectedIssuer}
                      className="w-full border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none disabled:opacity-50"
                    >
                      <option value="">
                        {selectedIssuer ? "약관을 선택하세요" : "먼저 발행사를 선택하세요"}
                      </option>
                      {agreementsForIssuer.map((a) => (
                        <option key={a.file} value={a.file}>
                          {a.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Preview */}
          {(loadingPreview || preview) && (
            <div className="mt-5">
              <div className="mb-2 text-[10px] uppercase tracking-wider text-muted-foreground">
                약관 원문 미리보기
              </div>
              {loadingPreview ? (
                <div className="flex h-64 items-center justify-center border border-border bg-background text-sm text-muted-foreground">
                  원문 불러오는 중...
                </div>
              ) : (
                <textarea
                  value={preview}
                  readOnly
                  className="h-64 w-full resize-none border border-border bg-background p-4 text-sm leading-relaxed text-foreground focus:outline-none"
                />
              )}
            </div>
          )}

          {/* Analyze button */}
          <button
            onClick={runAnalysis}
            disabled={!selectedAgreement || loadingPreview || !preview}
            className="mt-5 w-full border-2 border-foreground bg-transparent px-8 py-3 text-xs font-medium uppercase tracking-[2px] text-foreground transition-colors hover:border-primary hover:bg-primary hover:text-primary-foreground disabled:cursor-not-allowed disabled:opacity-50"
          >
            취약점 분석 시작
          </button>
        </div>
      </div>
    </div>
  )
}
