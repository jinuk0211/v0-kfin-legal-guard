"use client"

import { useEffect, useRef, useState } from "react"
import type { InsuranceState } from "@/app/insurance/page"

interface Props {
  state: InsuranceState
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onSuccess: (data: any) => void
  onError: () => void
}

export function StepLoading({ state, onSuccess, onError }: Props) {
  const called = useRef(false)
  const [errorMsg, setErrorMsg] = useState("")

  useEffect(() => {
    if (called.current) return
    called.current = true
    doQuery()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function doQuery() {
    try {
      // For saved users without session, pass credentials directly
      const queryBody: Record<string, string> = {}
      
      if (state.sessionId) {
        queryBody.sessionId = state.sessionId
      } else if (state.regId && state.regPw) {
        // Direct query with saved credentials
        queryBody.userName = state.name
        queryBody.birthDate = state.birth
        queryBody.phoneNo = state.phone
        queryBody.telecom = state.telecom
        queryBody.regId = state.regId
        queryBody.regPw = state.regPw
      } else {
        setErrorMsg("저장된 인증 정보가 없습니다. 다시 등록해주세요.")
        setTimeout(() => onError(), 2000)
        return
      }

      const res = await fetch("/api/insurance/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(queryBody),
      })
      const data = await res.json()

      if (data.status === "success") { onSuccess(data.data); return }

      if (data.status === "error") {
        setErrorMsg(data.error || "조회에 실패했습니다.")
        setTimeout(() => onError(), 2000)
        return
      }

      if (data.status === "need_auth" && data.sessionId) {
        // PASS polling for query confirmation
        let cnt = 0
        const iv = setInterval(async () => {
          cnt++
          const r2 = await fetch("/api/insurance/query-confirm", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ sessionId: data.sessionId }),
          }).then(r => r.json())

          if (r2.status === "success") { clearInterval(iv); onSuccess(r2.data) }
          if (r2.status === "error" || cnt > 85) { clearInterval(iv); onError() }
        }, 2000)
        return
      }
      
      if (data.status === "need_auth" && !data.sessionId) {
        setErrorMsg("추가 인증이 필요합니다. 다시 등록해주세요.")
        setTimeout(() => onError(), 2000)
        return
      }

      setErrorMsg("알 수 없는 오류가 발생했습니다.")
      setTimeout(() => onError(), 2000)
    } catch (err) {
      const msg = err instanceof Error ? err.message : "네트워크 오류"
      setErrorMsg(msg)
      setTimeout(() => onError(), 2000)
    }
  }

  return (
    <div className="animate-fade-in border border-border bg-card p-7 text-center">
      <p className="mb-2 text-[10px] font-semibold uppercase tracking-[2px] text-muted-foreground">조회 중</p>
      {errorMsg ? (
        <>
          <h2 className="mb-8 font-serif text-2xl font-bold text-destructive">오류 발생</h2>
          <p className="text-sm text-muted-foreground">{errorMsg}</p>
          <p className="mt-4 text-xs text-muted-foreground">3초 후 처음으로 돌아갑니다...</p>
        </>
      ) : (
        <>
          <h2 className="mb-8 font-serif text-2xl font-bold text-foreground">보험 정보 조회 중...</h2>
          <div className="mb-6 flex justify-center">
            <div className="h-12 w-12 animate-spin-slow rounded-full border-2 border-border border-t-foreground" />
          </div>
          <p className="text-sm text-muted-foreground">가입된 보험 계약 정보를 불러오고 있어요.</p>
        </>
      )}
    </div>
  )
}
