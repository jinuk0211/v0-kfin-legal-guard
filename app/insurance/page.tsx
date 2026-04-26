"use client"

import { useState } from "react"
import { InsuranceHeader } from "@/components/insurance/insurance-header"
import { StepBar } from "@/components/insurance/step-bar"
import { StepUserInfo } from "@/components/insurance/step-user-info"
import { StepExtraInfo } from "@/components/insurance/step-extra-info"
import { StepCaptcha } from "@/components/insurance/step-captcha"
import { StepAuth } from "@/components/insurance/step-auth"
import { StepLoading } from "@/components/insurance/step-loading"
import { StepResult } from "@/components/insurance/step-result"

export type Step = 1 | 2 | 3 | 4 | 5 | 6 | 7

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
  const [step, setStep] = useState<Step>(1)
  const [state, setState] = useState<InsuranceState>(INITIAL_STATE)
  const [showExtra, setShowExtra] = useState(false)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [resultData, setResultData] = useState<any>(null)

  function updateState(patch: Partial<InsuranceState>) {
    setState(prev => ({ ...prev, ...patch }))
  }

  function reset() {
    setStep(1)
    setState(INITIAL_STATE)
    setShowExtra(false)
    setResultData(null)
  }

  return (
    <div className="min-h-screen bg-background">
      <InsuranceHeader />
      <main className="mx-auto max-w-lg px-4 pb-20 pt-8">
        <StepBar current={step} total={5} />

        {step === 1 && (
          <>
            <StepUserInfo
              state={state}
              updateState={updateState}
              onNewUser={() => setShowExtra(true)}
              onExistingUser={(sid) => {
                updateState({ sessionId: sid })
                setStep(6)
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
            onRegistered={() => { setStep(6) }}
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
            onError={() => setStep(1)}
          />
        )}

        {step === 7 && (
          <StepResult data={resultData} onReset={reset} />
        )}
      </main>
    </div>
  )
}
