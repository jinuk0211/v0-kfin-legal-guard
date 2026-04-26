"use client"

import { useEffect, useRef } from "react"
import type { InsuranceState } from "@/app/insurance/page"

interface Props {
  state: InsuranceState
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onSuccess: (data: any) => void
  onError: () => void
}

export function StepLoading({ state, onSuccess, onError }: Props) {
  const called = useRef(false)

  useEffect(() => {
    if (called.current) return
    called.current = true
    doQuery()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function doQuery() {
    try {
      const res = await fetch("/api/insurance/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: state.sessionId }),
      })
      const data = await res.json()

      if (data.status === "success") { onSuccess(data.data); return }

      if (data.status === "need_auth") {
        // PASS polling for query confirmation
        let cnt = 0
        const iv = setInterval(async () => {
          cnt++
          const r2 = await fetch("/api/insurance/query-confirm", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ sessionId: state.sessionId }),
          }).then(r => r.json())

          if (r2.status === "success") { clearInterval(iv); onSuccess(r2.data) }
          if (r2.status === "error" || cnt > 85) { clearInterval(iv); onError() }
        }, 2000)
        return
      }

      onError()
    } catch {
      onError()
    }
  }

  return (
    <div className="animate-fade-in border border-border bg-card p-7 text-center">
      <p className="mb-2 text-[10px] font-semibold uppercase tracking-[2px] text-muted-foreground">조회 중</p>
      <h2 className="mb-8 font-serif text-2xl font-bold text-foreground">보험 정보 조회 중...</h2>

      <div className="mb-6 flex justify-center">
        <div className="h-12 w-12 animate-spin-slow rounded-full border-2 border-border border-t-foreground" />
      </div>
      <p className="text-sm text-muted-foreground">가입된 보험 계약 정보를 불러오고 있어요.</p>
    </div>
  )
}
