"use client"

import { useState, useRef } from "react"
import type { UserProfile, AnalysisReport } from "@/lib/schemas"
import { VulnerabilityReport } from "./vulnerability-report"

const ANALYSIS_STEPS = [
  "약관 조항 파싱",
  "취약점 후보 탐지 (INS-01~05)",
  "판례 DB 대조",
  "심각도 분류 및 리포트 생성",
]

const SAMPLE_CONTRACT = `제13조(고지의무)
① 계약자 또는 피보험자는 청약할 때 청약서에서 질문한 사항에 대하여 알고 있는 사실을 반드시 사실대로 알려야 합니다.
② 계약자 또는 피보험자가 고의 또는 중대한 과실로 인하여 제1항의 중요한 사항을 사실과 다르게 알린 경우에는 회사는 그 사실을 안 날부터 1개월 이내에, 계약을 해지할 수 있습니다.

제14조(보험금 지급 제한)
① 회사는 다음 각 호의 어느 하나에 해당하는 경우에는 보험금을 드리지 않습니다.
1. 피보험자가 고의로 자신을 해친 경우
2. 보험수익자가 고의로 피보험자를 해친 경우
3. 계약자가 고의로 피보험자를 해친 경우

제15조(보장개시일)
① 이 계약의 보험금 지급 사유가 발생하더라도 아래의 기간 중에 발생한 경우에는 보험금을 드리지 않습니다.
- 계약일로부터 90일 이내 암 진단

제16조(해약환급금)
① 이 계약의 해약환급금은 보험료 및 책임준비금 산출방법서에 따라 계산합니다. 계약일로부터 1년 이내에 해약할 경우 해약환급금이 없거나 납입한 보험료보다 적을 수 있습니다.`

type AnalysisState = "input" | "analyzing" | "result"

interface ContractAnalyzerProps {
  onBack: () => void
}

export function ContractAnalyzer({ onBack }: ContractAnalyzerProps) {
  const [contractText, setContractText] = useState("")
  const [fileName, setFileName] = useState("")
  const [userProfile, setUserProfile] = useState<UserProfile>({
    age: "",
    occupation: "",
    conditions: "",
    productType: "insurance",
  })
  const [analysisState, setAnalysisState] = useState<AnalysisState>("input")
  const [currentStep, setCurrentStep] = useState(0)
  const [report, setReport] = useState<AnalysisReport | null>(null)
  const [error, setError] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)

  function handleFileSelect(file: File) {
    setFileName(file.name)
    const reader = new FileReader()
    reader.onload = (e) => setContractText((e.target?.result as string) || "")
    reader.readAsText(file, "utf-8")
  }

  async function startAnalysis() {
    const text = contractText.trim()
    if (text.length < 100) {
      setError("약관 내용이 너무 짧습니다 (100자 이상)")
      return
    }

    setError("")
    setAnalysisState("analyzing")
    setCurrentStep(0)

    // Progress animation
    const interval = setInterval(() => {
      setCurrentStep((prev) => Math.min(prev + 1, ANALYSIS_STEPS.length - 1))
    }, 3000)

    try {
      const response = await fetch("/api/vulnerability/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contractText: text,
          userProfile,
        }),
      })

      clearInterval(interval)

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "분석 중 오류가 발생했습니다")
      }

      setReport(data.report)
      setAnalysisState("result")
    } catch (err) {
      clearInterval(interval)
      setError(err instanceof Error ? err.message : "분석 오류가 발생했습니다")
      setAnalysisState("input")
    }
  }

  function resetAnalysis() {
    setAnalysisState("input")
    setReport(null)
    setCurrentStep(0)
    setContractText("")
    setFileName("")
    setError("")
  }

  if (analysisState === "result" && report) {
    return <VulnerabilityReport report={report} onReset={resetAnalysis} />
  }

  if (analysisState === "analyzing") {
    return (
      <div className="animate-slide-up mx-auto flex min-h-[60vh] max-w-2xl flex-col items-center justify-center px-6 py-16">
        <div className="mb-8">
          <div className="mx-auto h-12 w-12 animate-spin-slow rounded-full border-2 border-muted border-t-primary" />
        </div>

        <h2 className="mb-2 font-serif text-2xl font-bold text-foreground">
          약관 분석 중
        </h2>
        <p className="mb-8 text-sm text-muted-foreground">
          AI가 취약점을 탐지하고 있습니다
        </p>

        <div className="w-full max-w-md">
          {ANALYSIS_STEPS.map((step, index) => (
            <div
              key={step}
              className="flex items-center gap-3 border-b border-border py-3"
            >
              <div
                className={`flex h-6 w-6 items-center justify-center text-xs font-bold ${
                  index <= currentStep
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {index + 1}
              </div>
              <span
                className={`text-sm ${
                  index <= currentStep
                    ? "text-foreground"
                    : "text-muted-foreground"
                }`}
              >
                {step}
              </span>
              {index === currentStep && (
                <span className="ml-auto text-xs text-primary">진행 중...</span>
              )}
              {index < currentStep && (
                <span className="ml-auto text-xs text-green-600">완료</span>
              )}
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="animate-slide-up mx-auto max-w-5xl px-6 py-10 sm:px-12">
      <div className="grid gap-8 lg:grid-cols-[1fr_340px]">
        {/* Left column - Contract input */}
        <div>
          <div className="mb-6 flex items-baseline gap-3 border-b-2 border-foreground pb-4">
            <span className="font-serif text-2xl font-bold text-foreground">
              약관 입력
            </span>
            <span className="text-[10px] uppercase tracking-[2px] text-muted-foreground">
              Contract Input
            </span>
          </div>

          {/* File upload area */}
          <div
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault()
              const file = e.dataTransfer.files[0]
              if (file) handleFileSelect(file)
            }}
            className="mb-5 flex cursor-pointer items-center gap-4 border border-dashed border-border bg-muted/30 px-6 py-5 transition-colors hover:border-primary"
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".txt,.md"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) handleFileSelect(file)
              }}
            />
            <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center border border-foreground text-lg">
              ↑
            </div>
            <div>
              <div className="text-xs font-medium tracking-wide text-foreground">
                {fileName || "TXT / MD 파일을 드래그하거나 클릭해 업로드"}
              </div>
              <div className="mt-1 text-[10px] text-muted-foreground">
                보험약관, 상품요약서, 대출 약관 지원
              </div>
            </div>
          </div>

          {/* Text area */}
          <div className="mb-5">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                약관 원문
              </span>
              <button
                onClick={() => setContractText(SAMPLE_CONTRACT)}
                className="text-[10px] uppercase tracking-wider text-primary hover:underline"
              >
                샘플 약관 불러오기
              </button>
            </div>
            <textarea
              value={contractText}
              onChange={(e) => setContractText(e.target.value)}
              placeholder="약관 텍스트를 붙여넣거나 파일을 업로드하세요..."
              className="h-64 w-full resize-none border border-border bg-background p-4 text-sm leading-relaxed text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
            />
            <div className="mt-1 text-right text-[10px] tabular-nums text-muted-foreground">
              {contractText.length.toLocaleString()} / 8,000자
            </div>
          </div>

          {error && (
            <div className="mb-4 border border-primary bg-primary/10 px-4 py-3 text-sm text-primary">
              {error}
            </div>
          )}

          <button
            onClick={startAnalysis}
            disabled={contractText.trim().length < 100}
            className="w-full border-2 border-foreground bg-transparent px-8 py-3 text-xs font-medium uppercase tracking-[2px] text-foreground transition-colors hover:border-primary hover:bg-primary hover:text-primary-foreground disabled:cursor-not-allowed disabled:opacity-50"
          >
            취약점 분석 시작
          </button>
        </div>

        {/* Right column - User profile */}
        <div>
          <div className="mb-6 flex items-baseline gap-3 border-b-2 border-foreground pb-4">
            <span className="font-serif text-lg font-bold text-foreground">
              사용자 프로필
            </span>
            <span className="text-[9px] uppercase tracking-[1.5px] text-muted-foreground">
              Optional
            </span>
          </div>

          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-[10px] uppercase tracking-wider text-muted-foreground">
                나이
              </label>
              <input
                type="text"
                value={userProfile.age}
                onChange={(e) =>
                  setUserProfile((p) => ({ ...p, age: e.target.value }))
                }
                placeholder="예: 35"
                className="w-full border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-[10px] uppercase tracking-wider text-muted-foreground">
                직업
              </label>
              <input
                type="text"
                value={userProfile.occupation}
                onChange={(e) =>
                  setUserProfile((p) => ({ ...p, occupation: e.target.value }))
                }
                placeholder="예: 회사원"
                className="w-full border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-[10px] uppercase tracking-wider text-muted-foreground">
                기존 병력
              </label>
              <input
                type="text"
                value={userProfile.conditions}
                onChange={(e) =>
                  setUserProfile((p) => ({ ...p, conditions: e.target.value }))
                }
                placeholder="예: 고혈압, 당뇨"
                className="w-full border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-[10px] uppercase tracking-wider text-muted-foreground">
                상품 유형
              </label>
              <select
                value={userProfile.productType}
                onChange={(e) =>
                  setUserProfile((p) => ({
                    ...p,
                    productType: e.target.value as "insurance" | "loan",
                  }))
                }
                className="w-full border border-border bg-background px-3 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none"
              >
                <option value="insurance">보험</option>
                <option value="loan">대출</option>
              </select>
            </div>
          </div>

          <div className="mt-6 border-t border-border pt-4 text-[10px] leading-relaxed text-muted-foreground">
            사용자 프로필은 취약점의 개인별 영향도를 분석하는 데 사용됩니다.
            입력하지 않아도 기본 분석은 진행됩니다.
          </div>

          <button
            onClick={onBack}
            className="mt-6 w-full border border-border bg-transparent px-4 py-2.5 text-[10px] uppercase tracking-wider text-muted-foreground transition-colors hover:border-foreground hover:text-foreground"
          >
            ← 메인으로 돌아가기
          </button>
        </div>
      </div>
    </div>
  )
}
