"use client"

import { Suspense, useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Header } from "@/components/header"
import { ContractAnalyzer } from "@/components/contract-analyzer"
import { matchManifestContract } from "@/lib/manifest-match"

function AnalyzeInner() {
  const router = useRouter()
  const params = useSearchParams()

  const fileParam = params.get("file") ?? ""
  const product = params.get("product") ?? ""
  const company = params.get("company") ?? ""
  const profileId = params.get("profileId") ?? ""

  const [name, setName] = useState(params.get("name") ?? product)
  const [contractText, setContractText] = useState<string | null>(
    fileParam || product ? null : ""
  )
  const [error, setError] = useState("")

  useEffect(() => {
    let active = true

    async function resolve() {
      // Resolve a contract .txt: explicit file param, else fuzzy-match the
      // product name against the bundled manifest.
      let file = fileParam
      if (!file && product) {
        try {
          const manifest = await fetch("/contracts/manifest.json").then((r) => r.json())
          const match = matchManifestContract(manifest, product, company)
          if (match) {
            file = match.file
            if (active) setName(match.name)
          }
        } catch {
          /* fall through to no-file handling */
        }
      }

      if (!file) {
        // No contract text available; precomputed (profileId) may still run.
        if (active) {
          setContractText("")
          if (!profileId) setError("일치하는 약관을 찾지 못했습니다. 약관을 직접 붙여넣어 주세요.")
        }
        return
      }

      try {
        const res = await fetch(`/contracts/txt/${encodeURIComponent(file)}`)
        if (!res.ok) throw new Error("약관 파일을 불러올 수 없습니다")
        const text = await res.text()
        if (active) setContractText(text)
      } catch {
        if (active) {
          setContractText("")
          if (!profileId) setError("약관 파일을 불러오지 못했습니다")
        }
      }
    }

    resolve()
    return () => {
      active = false
    }
  }, [fileParam, product, company, profileId])

  if (contractText === null) {
    return (
      <main className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </main>
    )
  }

  // Auto-start when we have either a contract body (live) or a profile (precomputed)
  const canAutoStart = contractText.trim().length >= 100 || Boolean(profileId)

  return (
    <ContractAnalyzer
      onBack={() => router.push("/")}
      initialContractText={contractText}
      initialProduct={name}
      initialProfileId={profileId}
      autoStart={canAutoStart && !error}
    />
  )
}

export default function AnalyzePage() {
  return (
    <div className="min-h-screen bg-background">
      <Header currentView="analyzer" onNavigate={() => {}} />
      <Suspense
        fallback={
          <main className="flex min-h-[60vh] items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </main>
        }
      >
        <AnalyzeInner />
      </Suspense>
    </div>
  )
}
