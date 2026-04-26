"use client"

import { useState, useEffect } from "react"
import { InsuranceHeader } from "@/components/insurance/insurance-header"
import { StepBar } from "@/components/insurance/step-bar"
import { StepUserInfo } from "@/components/insurance/step-user-info"
import { StepExtraInfo } from "@/components/insurance/step-extra-info"
import { StepCaptcha } from "@/components/insurance/step-captcha"
import { StepAuth } from "@/components/insurance/step-auth"
import { StepLoading } from "@/components/insurance/step-loading"
import { StepResult } from "@/components/insurance/step-result"
import { getSavedUser, saveUser, clearSavedUser, maskName, maskPhone, type SavedUser } from "@/lib/user-storage"

export type Step = "welcome" | 1 | 2 | 3 | 4 | 5 | 6 | 7

export interface InsuranceState {
  name: string
  birth: string
  phone: string
  idBack7: string
  telecom: string
  email: string
  regId: string
  regPw: string
  authMethod: "pass" | "sms"
  sessionId: string | null
}

const INITIAL_STATE: InsuranceState = {
  name: "", birth: "", phone: "", idBack7: "",
  telecom: "0", email: "", regId: "", regPw: "",
  authMethod: "pass", sessionId: null,
}

export default function InsurancePage() {
  const [step, setStep] = useState<Step>("welcome")
  const [state, setState] = useState<InsuranceState>(INITIAL_STATE)
  const [showExtra, setShowExtra] = useState(false)
  const [savedUser, setSavedUser] = useState<SavedUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [resultData, setResultData] = useState<any>(null)

  // Check for saved user on mount
  useEffect(() => {
    const user = getSavedUser()
    if (user) {
      setSavedUser(user)
      // Pre-fill state with saved user data
      setState(prev => ({
        ...prev,
        name: user.name,
        birth: user.birth,
        phone: user.phone,
        idBack7: user.idBack7,
        telecom: user.telecom,
        email: user.email,
        regId: user.regId,
        regPw: user.regPw,
      }))
    }
    setIsLoading(false)
  }, [])

  function updateState(patch: Partial<InsuranceState>) {
    setState(prev => ({ ...prev, ...patch }))
  }

  function handleLoginWithSaved() {
    // Go directly to loading/query step
    setStep(6)
  }

  function handleNewRegistration() {
    // Clear saved user and start fresh
    clearSavedUser()
    setSavedUser(null)
    setState(INITIAL_STATE)
    setStep(1)
  }

  function handleSuccessfulRegistration() {
    // Save user data for future logins
    saveUser({
      name: state.name,
      birth: state.birth,
      phone: state.phone,
      idBack7: state.idBack7,
      telecom: state.telecom,
      email: state.email,
      regId: state.regId,
      regPw: state.regPw,
    })
    setSavedUser({
      name: state.name,
      birth: state.birth,
      phone: state.phone,
      idBack7: state.idBack7,
      telecom: state.telecom,
      email: state.email,
      regId: state.regId,
      regPw: state.regPw,
      savedAt: Date.now(),
    })
    setStep(6)
  }

  function reset() {
    // Keep saved user but reset current session
    setStep("welcome")
    setShowExtra(false)
    setResultData(null)
  }

  function fullLogout() {
    clearSavedUser()
    setSavedUser(null)
    setState(INITIAL_STATE)
    setStep("welcome")
    setShowExtra(false)
    setResultData(null)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <InsuranceHeader />
        <main className="flex min-h-[60vh] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <InsuranceHeader />
      <main className="mx-auto max-w-lg px-4 pb-20 pt-8">
        
        {/* Welcome Screen */}
        {step === "welcome" && (
          <div className="animate-fade-in">
            {savedUser ? (
              // Returning user
              <div className="border border-border bg-card p-6">
                <div className="mb-6 text-center">
                  <div className="mb-2 inline-flex h-12 w-12 items-center justify-center border border-primary bg-primary/10">
                    <span className="text-xl text-primary">✓</span>
                  </div>
                  <h2 className="mt-4 font-serif text-xl font-bold text-foreground">
                    다시 오셨군요!
                  </h2>
                  <p className="mt-2 text-sm text-muted-foreground">
                    저장된 정보로 바로 조회하실 수 있습니다
                  </p>
                </div>

                <div className="mb-6 border-y border-border bg-muted/30 px-4 py-4">
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-[10px] uppercase tracking-wider text-muted-foreground">이름</span>
                      <p className="font-medium text-foreground">{maskName(savedUser.name)}</p>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase tracking-wider text-muted-foreground">전화번호</span>
                      <p className="font-medium text-foreground">{maskPhone(savedUser.phone)}</p>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase tracking-wider text-muted-foreground">생년월일</span>
                      <p className="font-medium text-foreground">{savedUser.birth.slice(0, 4)}.**.**</p>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase tracking-wider text-muted-foreground">저장일</span>
                      <p className="font-medium text-foreground">
                        {new Date(savedUser.savedAt).toLocaleDateString("ko-KR")}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <button
                    onClick={handleLoginWithSaved}
                    className="w-full bg-primary py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                  >
                    내 보험 바로 조회하기
                  </button>
                  <button
                    onClick={handleNewRegistration}
                    className="w-full border border-border bg-transparent py-3 text-sm font-medium text-foreground transition-colors hover:bg-muted"
                  >
                    다른 정보로 새로 등록
                  </button>
                </div>

                <p className="mt-4 text-center text-[10px] text-muted-foreground">
                  정보는 이 기기에만 저장되며 30일 후 자동 삭제됩니다
                </p>
              </div>
            ) : (
              // New user
              <div className="border border-border bg-card p-6">
                <div className="mb-6 text-center">
                  <div className="mb-2 inline-flex h-12 w-12 items-center justify-center border border-primary bg-primary/10">
                    <span className="text-xl text-primary">!</span>
                  </div>
                  <h2 className="mt-4 font-serif text-xl font-bold text-foreground">
                    처음이시군요!
                  </h2>
                  <p className="mt-2 text-sm text-muted-foreground">
                    본인인증 후 가입하신 모든 보험을 조회할 수 있습니다
                  </p>
                </div>

                <div className="mb-6 space-y-3 border-y border-border bg-muted/30 px-4 py-4 text-sm text-muted-foreground">
                  <div className="flex items-start gap-3">
                    <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center bg-primary/10 text-[10px] font-bold text-primary">1</span>
                    <span>기본 정보 입력 (이름, 생년월일, 전화번호)</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center bg-primary/10 text-[10px] font-bold text-primary">2</span>
                    <span>본인인증 (PASS 또는 SMS)</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center bg-primary/10 text-[10px] font-bold text-primary">3</span>
                    <span>보험 상품 조회 및 약관 분석</span>
                  </div>
                </div>

                <button
                  onClick={() => setStep(1)}
                  className="w-full bg-primary py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                >
                  시작하기
                </button>

                <p className="mt-4 text-center text-[10px] text-muted-foreground">
                  한 번 등록하면 다음에는 바로 조회할 수 있습니다
                </p>
              </div>
            )}
          </div>
        )}

        {/* Registration Steps */}
        {typeof step === "number" && step >= 1 && step <= 5 && (
          <StepBar current={step} total={5} />
        )}

        {step === 1 && (
          <>
            <StepUserInfo
              state={state}
              updateState={updateState}
              onNewUser={() => setShowExtra(true)}
              onExistingUser={(sid) => {
                updateState({ sessionId: sid })
                handleSuccessfulRegistration()
              }}
            />
            {showExtra && (
              <StepExtraInfo
                state={state}
                updateState={updateState}
                onCaptcha={() => setStep(2)}
                onAuthWait={() => setStep(3)}
              />
            )}
          </>
        )}

        {step === 2 && (
          <StepCaptcha
            state={state}
            onSuccess={() => setStep(3)}
            onBack={() => setStep(1)}
          />
        )}

        {step === 3 && (
          <StepAuth
            state={state}
            onRegistered={handleSuccessfulRegistration}
            onCancel={() => setStep(1)}
          />
        )}

        {step === 6 && (
          <StepLoading
            state={state}
            onSuccess={(data) => {
              setResultData(data)
              setStep(7)
            }}
            onError={() => setStep("welcome")}
          />
        )}

        {step === 7 && (
          <StepResult 
            data={resultData} 
            onReset={reset}
            onLogout={fullLogout}
            userName={savedUser?.name || state.name}
          />
        )}
      </main>
    </div>
  )
}
