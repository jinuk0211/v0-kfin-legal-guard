"use client"

import { useState } from "react"
import type { InsuranceState } from "@/app/insurance/page"

interface Props {
  state: InsuranceState
  onSuccess: () => void
  onBack: () => void
}

export function StepCaptcha({ state, onSuccess, onBack }: Props) {
  const [captcha, setCaptcha] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  async function handleSubmit() {
    setError("")
    if (!captcha.trim()) return setError("보안문자를 입력해주세요.")

    setLoading(true)
    try {
      const res = await fetch("/api/insurance/register/captcha", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: state.sessionId, captchaValue: captcha }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "오류가 발생했습니다.")
      onSuccess()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "오류가 발생했습니다.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="animate-slide-up border border-border bg-card p-7">
      <p className="mb-2 text-[10px] font-semibold uppercase tracking-[2px] text-muted-foreground">Step 2</p>
      <h2 className="mb-1 font-serif text-2xl font-bold text-foreground">보안문자 입력</h2>
      <p className="mb-7 text-sm leading-relaxed text-muted-foreground">아래 이미지의 문자를 입력해주세요.</p>

      <div className="mb-5 flex justify-center">
        <div className="border border-border bg-muted px-8 py-6 text-xs text-muted-foreground">
          보안문자 이미지 로딩 중...
        </div>
      </div>

      <div className="mb-4">
        <label className="mb-1.5 block text-xs font-semibold text-muted-foreground">보안문자</label>
        <input
          className="w-full border border-border bg-background px-4 py-3 text-sm text-foreground outline-none transition-colors focus:border-foreground"
          placeholder="이미지의 문자 입력"
          maxLength={10}
          value={captcha}
          onChange={e => setCaptcha(e.target.value)}
        />
      </div>

      {error && (
        <div className="mb-4 border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-600">{error}</div>
      )}

      <button onClick={handleSubmit} disabled={loading}
        className="flex w-full items-center justify-center gap-2 border-2 border-foreground bg-foreground py-4 text-sm font-semibold text-background transition-colors hover:bg-primary hover:border-primary disabled:opacity-50">
        {loading ? <><span className="h-4 w-4 animate-spin-slow rounded-full border-2 border-background/30 border-t-background" />처리 중...</> : "확인"}
      </button>
      <button onClick={onBack}
        className="mt-2 w-full border border-border bg-transparent py-3 text-sm text-muted-foreground transition-colors hover:border-foreground hover:text-foreground">
        ← 이전
      </button>
    </div>
  )
}
