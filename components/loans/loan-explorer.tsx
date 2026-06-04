"use client"

import { useEffect, useMemo, useState } from "react"
import type { LoanReport } from "@/lib/loan-schemas"
import { StepBar } from "@/components/insurance/step-bar"
import { LoanReportView } from "./loan-report"

interface LoanDoc {
  issuer: string
  name: string
  file: string
  date: string
  query: string
}

const ANALYSIS_STEPS = [
  "대출계약 조항 파싱",
  "차주 불리 조항 탐지 (LOAN-01~05)",
  "심각도 분류",
  "리포트 생성",
]

type State = "input" | "analyzing" | "result"

// Turn a raw EDGAR ticker ("ALICO_", "KBR__", "Bally_s") into a display label.
function cleanIssuer(ticker: string): string {
  return ticker.replace(/_+$/g, "").replace(/_/g, " ").trim() || ticker
}

function parseManifest(text: string): LoanDoc[] {
  const seen = new Set<string>()
  const docs: LoanDoc[] = []
  for (const line of text.split("\n")) {
    const trimmed = line.trim()
    if (!trimmed) continue
    try {
      const r = JSON.parse(trimmed) as Record<string, unknown>
      const file = String(r.out ?? "")
      if (!file || seen.has(file)) continue
      seen.add(file)
      const exhibit = String(r.exhibit ?? "").replace(/\.html?$/i, "")
      docs.push({
        issuer: cleanIssuer(String(r.ticker ?? "Unknown")),
        name: exhibit || file.replace(/\.txt$/i, ""),
        file,
        date: String(r.file_date ?? ""),
        query: String(r.query ?? ""),
      })
    } catch {
      /* skip malformed line */
    }
  }
  return docs
}

export function LoanExplorer() {
  const [state, setState] = useState<State>("input")
  const [report, setReport] = useState<LoanReport | null>(null)
  const [error, setError] = useState("")
  const [currentStep, setCurrentStep] = useState(0)

  const [docs, setDocs] = useState<LoanDoc[]>([])
  const [loadingManifest, setLoadingManifest] = useState(true)

  // Bar-select state: issuer → document → preview
  const [selectedIssuer, setSelectedIssuer] = useState("")
  const [selectedFile, setSelectedFile] = useState("")
  const [preview, setPreview] = useState("")
  const [loadingPreview, setLoadingPreview] = useState(false)

  useEffect(() => {
    fetch("/us_loan_corpus/_manifest.jsonl")
      .then((r) => (r.ok ? r.text() : ""))
      .then((t) => setDocs(parseManifest(t)))
      .catch(() => setDocs([]))
      .finally(() => setLoadingManifest(false))
  }, [])

  // Group by issuer for the two cascading select bars.
  const byIssuer = useMemo(
    () =>
      docs.reduce<Record<string, LoanDoc[]>>((acc, d) => {
        ;(acc[d.issuer] ??= []).push(d)
        return acc
      }, {}),
    [docs]
  )
  const issuers = Object.keys(byIssuer).sort((a, b) => a.localeCompare(b))
  const docsForIssuer = selectedIssuer ? byIssuer[selectedIssuer] ?? [] : []
  const selectedDoc = docs.find((d) => d.file === selectedFile) ?? null

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
      const text = await fetch(`/us_loan_corpus/${encodeURIComponent(file)}`).then((r) => {
        if (!r.ok) throw new Error()
        return r.text()
      })
      setPreview(text)
    } catch {
      setError("계약서 미리보기를 불러오지 못했습니다")
    } finally {
      setLoadingPreview(false)
    }
  }

  async function runAnalysis() {
    if (!selectedDoc) return
    setError("")
    setState("analyzing")
    setCurrentStep(0)
    const interval = setInterval(
      () => setCurrentStep((p) => Math.min(p + 1, ANALYSIS_STEPS.length - 1)),
      3000
    )
    try {
      const text =
        preview ||
        (await fetch(`/us_loan_corpus/${encodeURIComponent(selectedDoc.file)}`).then((r) => {
          if (!r.ok) throw new Error("계약서 파일을 불러오지 못했습니다")
          return r.text()
        }))
      const res = await fetch("/api/loans/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contractText: text,
          product: `${selectedDoc.issuer} — ${selectedDoc.name}`,
        }),
      })
      clearInterval(interval)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "분석에 실패했습니다")
      setReport(data.report)
      setState("result")
    } catch (err) {
      clearInterval(interval)
      setError(
        err instanceof Error ? err.message : "분석 오류 (실시간 분석은 API 크레딧이 필요합니다)"
      )
      setState("input")
    }
  }

  if (state === "result" && report) {
    return (
      <LoanReportView
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
      <main className="mx-auto max-w-lg px-4 pb-20 pt-12">
        <StepBar current={currentStep + 1} total={ANALYSIS_STEPS.length} />
        <div className="animate-fade-in flex flex-col items-center border border-border bg-card p-8 text-center">
          <div className="mb-6 h-12 w-12 animate-spin rounded-full border-2 border-muted border-t-primary" />
          <h2 className="mb-1 font-serif text-xl font-bold text-foreground">분석 중</h2>
          <p className="mb-6 truncate text-sm text-muted-foreground">
            {selectedDoc ? `${selectedDoc.issuer} — ${selectedDoc.name}` : ""}
          </p>
          <div className="w-full">
            {ANALYSIS_STEPS.map((step, i) => (
              <div key={step} className="flex items-center gap-3 border-b border-border py-3 last:border-b-0">
                <div
                  className={`flex h-6 w-6 items-center justify-center text-xs font-bold ${
                    i <= currentStep
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {i + 1}
                </div>
                <span
                  className={`text-sm ${i <= currentStep ? "text-foreground" : "text-muted-foreground"}`}
                >
                  {step}
                </span>
              </div>
            ))}
          </div>
        </div>
      </main>
    )
  }

  // ── input (insurance "분석설정" style: bar select → preview → analyze) ──────
  return (
    <main className="mx-auto max-w-2xl px-4 pb-20 pt-8">
      {error && (
        <div className="mb-6 border border-primary bg-primary/10 px-4 py-3 text-sm text-primary">
          {error}
        </div>
      )}

      {/* Intro card */}
      <div className="animate-fade-in mb-8 border border-border bg-card p-6">
        <div className="mb-6 text-center">
          <div className="mb-2 inline-flex h-12 w-12 items-center justify-center border border-primary bg-primary/10">
            <span className="text-xl text-primary">$</span>
          </div>
          <h2 className="mt-4 font-serif text-xl font-bold text-foreground">
            미국 대출 계약서 분석
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            SEC EDGAR 공시 대출·신용계약서에서 차주 불리 조항을 탐지합니다
          </p>
        </div>

        <div className="mb-6 space-y-3 border-y border-border bg-muted/30 px-4 py-4 text-sm text-muted-foreground">
          <div className="flex items-start gap-3">
            <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center bg-primary/10 text-[10px] font-bold text-primary">1</span>
            <span>발행사와 계약서를 선택하면 원문을 미리 봅니다</span>
          </div>
          <div className="flex items-start gap-3">
            <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center bg-primary/10 text-[10px] font-bold text-primary">2</span>
            <span>가속조항·MAC·중도상환·교차채무·후순위 등 탐지 (LOAN-01~05)</span>
          </div>
          <div className="flex items-start gap-3">
            <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center bg-primary/10 text-[10px] font-bold text-primary">3</span>
            <span>심각도 분류 및 리포트 생성</span>
          </div>
        </div>

        <p className="text-center text-[10px] text-muted-foreground">
          분석은 Claude 실시간 호출로 수행됩니다 (API 크레딧 필요)
        </p>
      </div>

      {/* Document picker — bar select */}
      <div className="border border-border">
        <div className="flex items-center justify-between border-b border-border bg-muted/50 px-4 py-3">
          <span className="text-[10px] font-medium uppercase tracking-wider text-foreground">
            계약서 선택
          </span>
          <span className="text-[10px] text-muted-foreground">
            SEC EDGAR · {docs.length}건
          </span>
        </div>

        <div className="space-y-4 p-4">
          {loadingManifest ? (
            <div className="py-4 text-center text-sm text-muted-foreground">
              계약서 목록 불러오는 중...
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

              {/* Document bar */}
              <div>
                <label className="mb-1.5 block text-[10px] uppercase tracking-wider text-muted-foreground">
                  계약서
                </label>
                <select
                  value={selectedFile}
                  onChange={(e) => handleFileChange(e.target.value)}
                  disabled={!selectedIssuer}
                  className="w-full border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none disabled:opacity-50"
                >
                  <option value="">
                    {selectedIssuer ? "계약서를 선택하세요" : "먼저 발행사를 선택하세요"}
                  </option>
                  {docsForIssuer.map((d) => (
                    <option key={d.file} value={d.file}>
                      {d.name}
                      {d.date ? ` · ${d.date}` : ""}
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
          <div className="mb-2 flex items-center justify-between">
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
              계약서 원문 미리보기
            </span>
            {selectedDoc?.query && (
              <span className="text-[10px] text-muted-foreground">{selectedDoc.query}</span>
            )}
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
        disabled={!selectedDoc || loadingPreview || !preview}
        className="mt-5 w-full border-2 border-foreground bg-transparent px-8 py-3 text-xs font-medium uppercase tracking-[2px] text-foreground transition-colors hover:border-primary hover:bg-primary hover:text-primary-foreground disabled:cursor-not-allowed disabled:opacity-50"
      >
        취약점 분석 시작
      </button>
    </main>
  )
}
