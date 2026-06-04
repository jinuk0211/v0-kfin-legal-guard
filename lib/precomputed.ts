import type { AnalysisReport } from "./schemas"
import { normalizeReport } from "./normalize-report"
import type { ProductKey, ProfileId } from "./demo"

export type { ProductKey, ProfileId } from "./demo"
export { DEMO_PROFILES, PRECOMPUTED_PRODUCTS } from "./demo"

// Precomputed FinLegal-Harness runs (logic/analysis_results), copied into the
// app so they ship with the serverless function. Keyed by `${profileId}__${productKey}`.
import p1_hanwha from "@/data/analyses/profile1__hanwha-e.json"
import p1_kb from "@/data/analyses/profile1__kb-chakhan.json"
import p1_kyobo from "@/data/analyses/profile1__kyobo-tonghap.json"
import p1_samsung from "@/data/analyses/profile1__samsung-bigaengsin.json"
import p1_shinhan from "@/data/analyses/profile1__shinhan-sol.json"
import p2_hanwha from "@/data/analyses/profile2__hanwha-e.json"
import p2_kb from "@/data/analyses/profile2__kb-chakhan.json"
import p2_kyobo from "@/data/analyses/profile2__kyobo-tonghap.json"
import p2_samsung from "@/data/analyses/profile2__samsung-bigaengsin.json"
import p2_shinhan from "@/data/analyses/profile2__shinhan-sol.json"

const INDEX: Record<string, AnalysisReport> = {
  "profile1__hanwha-e": p1_hanwha as unknown as AnalysisReport,
  "profile1__kb-chakhan": p1_kb as unknown as AnalysisReport,
  "profile1__kyobo-tonghap": p1_kyobo as unknown as AnalysisReport,
  "profile1__samsung-bigaengsin": p1_samsung as unknown as AnalysisReport,
  "profile1__shinhan-sol": p1_shinhan as unknown as AnalysisReport,
  "profile2__hanwha-e": p2_hanwha as unknown as AnalysisReport,
  "profile2__kb-chakhan": p2_kb as unknown as AnalysisReport,
  "profile2__kyobo-tonghap": p2_kyobo as unknown as AnalysisReport,
  "profile2__samsung-bigaengsin": p2_samsung as unknown as AnalysisReport,
  "profile2__shinhan-sol": p2_shinhan as unknown as AnalysisReport,
}

// Keyword rules to map an arbitrary product/company string to a precomputed key.
const PRODUCT_RULES: { key: ProductKey; all?: string[]; any: string[] }[] = [
  { key: "kb-chakhan", any: ["착한"] },
  { key: "kyobo-tonghap", all: ["교보"], any: ["통합"] },
  { key: "samsung-bigaengsin", all: ["삼성"], any: ["비갱신"] },
  { key: "shinhan-sol", any: ["SOL", "sol"] },
  { key: "hanwha-e", all: ["한화"], any: ["e암", "e 암", "이암"] },
]

export function matchProductKey(raw?: string): ProductKey | null {
  if (!raw) return null
  const s = raw.replace(/[_\s]+/g, "")
  for (const rule of PRODUCT_RULES) {
    const allOk = (rule.all ?? []).every((t) => s.includes(t.replace(/\s+/g, "")))
    const anyOk = rule.any.some((t) => s.includes(t.replace(/\s+/g, "")))
    if (allOk && anyOk) return rule.key
  }
  return null
}

export function normalizeProfileId(raw?: string): ProfileId | null {
  if (!raw) return null
  if (raw === "profile1" || raw.includes("김민준")) return "profile1"
  if (raw === "profile2" || raw.includes("이수진")) return "profile2"
  return null
}

// Returns a precomputed report when both a product and profile resolve.
export function getPrecomputed(
  product?: string,
  profileId?: string
): AnalysisReport | null {
  const key = matchProductKey(product)
  const pid = normalizeProfileId(profileId)
  if (!key || !pid) return null
  const report = INDEX[`${pid}__${key}`]
  // Normalize: the real artifacts have inconsistent summary blocks, so recompute.
  return report ? normalizeReport(report, "precomputed") : null
}
