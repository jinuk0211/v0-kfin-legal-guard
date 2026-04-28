"use client"

import { useState, useEffect, useRef } from "react"
import type { InsuranceState } from "@/app/insurance/page"

const TOTAL_SEC = 170

interface Props {
  state: InsuranceState
  onRegistered: () => void
  onCancel: () => void
}

export function StepAuth({ state, onRegistered, onCancel }: Props) {
  const [remain, setRemain] = useState(TOTAL_SEC)
  const [smsCode, setSmsCode] = useState("")
  const [status, setStatus] = useState("인증 대기 중...")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const countRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const isPass = state.authMethod === "pass"

  useEffect(() => {
    // Countdown
    countRef.current = setInterval(() => {
      setRemain(r => {
        if (r <= 1) {
          stopAll()
          setError("인증 시간이 만료됐습니다.")
          setTimeout(() => onCancel(), 1500)
          return 0
        }
        return r - 1
      })
    }, 1000)

    // PASS only: auto-poll every 3s
    if (isPass) {
      pollRef.current = setInterval(() => verify(false), 3000)
    }

    return () => stopAll()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function stopAll() {
    if (pollRef.current) clearInterval(pollRef.current)
    if (countRef.current) clearInterval(countRef.current)
  }

  async function verify(manual: boolean) {
    try {
      const res = await fetch("/api/insurance/register/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: state.sessionId, smsAuthNo: manual ? smsCode : "" }),
      })
      const data = await res.json()

      if (data.status === "pending") {
        setStatus(`승인 대기 중...`)
        return
      }
      stopAll()
      if (data.status === "registered" || data.status === "need_email_auth") {
        onRegistered()
        return
      }
      if (data.status === "timeout" || data.status === "error") {
        setError(data.error || "인증이 만료되었습니다.")
        setTimeout(() => onCancel(), 2000)
        return
      }
      setError(data.error || "인증 실패")
      setTimeout(() => onCancel(), 2000)
    } catch {
      if (!manual) return
      setError("네트워크 오류가 발생했습니다.")
    }
  }

  async function handleSmsVerify() {
    setError("")
    if (!smsCode || smsCode.length < 4) return setError("인증번호를 입력해주세요.")
    setLoading(true)
    await verify(true)
    setLoading(false)
  }

  const circumference = 2 * Math.PI * 45
  const dashOffset = circumference * (1 - remain / TOTAL_SEC)

  return (
    <div className="animate-slide-up border border-border bg-card p-7">
      <p className="mb-2 text-[10px] font-semibold uppercase tracking-[2px] text-muted-foreground">Step 3</p>
      <h2 className="mb-7 font-serif text-2xl font-bold text-foreground">본인 인증</h2>

      <div className="flex flex-col items-center text-center">
        <div className={`mb-5 flex h-16 w-16 items-center justify-center border-2 text-xs font-bold uppercase tracking-wider ${isPass ? "border-primary bg-primary text-primary-foreground" : "border-foreground bg-foreground text-background"}`}>
          {isPass ? "PASS" : "SMS"}
        </div>
        <p className="mb-1 font-semibold text-foreground">
          {isPass ? "PASS 앱을 확인해주세요" : "SMS 인증번호를 입력해주세요"}
        </p>
        <p className="mb-6 text-sm text-muted-foreground">
          {isPass ? "PASS 앱에서 인증 요청을 승인해주세요." : "입력하신 번호로 SMS 인증번호가 발송됐습니다."}
        </p>

        {/* Timer ring */}
        <div className="relative mb-6 h-24 w-24">
          <svg className="-rotate-90" width="96" height="96" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="5" className="text-border" />
            <circle
              cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="5"
              strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={dashOffset}
              className="text-foreground transition-[stroke-dashoffset] duration-1000"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center font-mono text-xl font-bold tabular-nums text-foreground">
            {remain}
          </div>
        </div>

        {!isPass && (
          <div className="mb-4 w-full">
            <label className="mb-1.5 block text-xs font-semibold text-muted-foreground">SMS 인증번호</label>
            <input
              className="w-full border border-border bg-background px-4 py-3 text-sm text-foreground outline-none transition-colors focus:border-foreground"
              placeholder="6자리 입력" maxLength={6} inputMode="numeric"
              value={smsCode}
              onChange={e => setSmsCode(e.target.value.replace(/\D/g, ""))}
              onKeyDown={e => { if (e.key === "Enter") handleSmsVerify() }}
              autoFocus
            />
            <button onClick={handleSmsVerify} disabled={loading}
              className="mt-2 flex w-full items-center justify-center gap-2 border-2 border-foreground bg-foreground py-3 text-sm font-semibold text-background hover:bg-primary hover:border-primary disabled:opacity-50">
              {loading ? <><span className="h-4 w-4 animate-spin-slow rounded-full border-2 border-background/30 border-t-background" />처리 중...</> : "인증번호 확인"}
            </button>
          </div>
        )}

        <p className="text-xs text-muted-foreground">{status}</p>
        {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
      </div>

      <button onClick={() => { stopAll(); onCancel() }}
        className="mt-6 w-full border border-border bg-transparent py-3 text-sm text-muted-foreground transition-colors hover:border-foreground hover:text-foreground">
        취소
      </button>
    </div>
  )
}
