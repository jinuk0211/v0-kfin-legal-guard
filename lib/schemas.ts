import { z } from "zod"

// ──────────────────────────────────────────────────────────────────────────
// Schema aligned to the FinLegal-Harness pipeline output
// (logic/analysis_results/*.json). These mirror the artifacts the harness
// actually produces: Stage 2 vulnerability drafts + Stage 3/4 summary.
// ──────────────────────────────────────────────────────────────────────────

// Vulnerability taxonomy
export const VULNERABILITY_TAXONOMY = {
  insurance: [
    { id: "INS-01", name: "보장 범위 불명확", description: "면책조항이 과도하게 넓거나 모호하게 서술된 경우" },
    { id: "INS-02", name: "고지의무 위반 면책 남용", description: "고지의무 위반과 사고 간 인과관계 불요 면책" },
    { id: "INS-03", name: "보장개시일/대기기간 불이익", description: "소비자에게 불리하게 설정된 대기기간" },
    { id: "INS-04", name: "계약 해지권 남용", description: "보험사 일방적 해지 가능 조항" },
    { id: "INS-05", name: "해약환급금 불이익", description: "조기 해지 시 원금 대비 현저히 낮은 환급금" },
  ],
  loan: [
    { id: "LOAN-01", name: "변동금리 위험 미고지", description: "금리 변동 위험 미충분 설명" },
    { id: "LOAN-02", name: "조기상환 조건 불투명", description: "중도상환 수수료 및 조건 불명확" },
    { id: "LOAN-03", name: "담보권 실행 조건 과도", description: "소비자 불리한 담보 실행 요건" },
  ],
} as const

// Flat id -> name lookup for rendering taxonomy labels
export const TAXONOMY_LABELS: Record<string, string> = [
  ...VULNERABILITY_TAXONOMY.insurance,
  ...VULNERABILITY_TAXONOMY.loan,
].reduce<Record<string, string>>((acc, item) => {
  acc[item.id] = item.name
  return acc
}, {})

// ── Request schemas ─────────────────────────────────────────────────────────

// User profile schema (free-text inputs from the analyzer form)
export const userProfileSchema = z.object({
  age: z.string().optional(),
  occupation: z.string().optional(),
  conditions: z.string().optional(),
  productType: z.enum(["insurance", "loan"]).default("insurance"),
})

export type UserProfile = z.infer<typeof userProfileSchema>

// Analysis request schema. `product`/`profileId` are optional hints used to
// serve a precomputed analysis before falling back to a live LLM call.
export const analysisRequestSchema = z.object({
  // Optional: a precomputed run can be served from product + profileId alone.
  // Live analysis still requires text (validated in the route).
  contractText: z.string().optional(),
  userProfile: userProfileSchema.optional(),
  product: z.string().optional(),
  profileId: z.string().optional(),
  // Optional LLM model id (lib/models.ts). Defaults server-side when omitted.
  model: z.string().optional(),
})

export type AnalysisRequest = z.infer<typeof analysisRequestSchema>

// ── Report schemas (match analysis_results/*.json) ───────────────────────────

export const CONFIDENCE_LEVELS = ["HIGH", "MEDIUM", "LOW"] as const
export type Confidence = (typeof CONFIDENCE_LEVELS)[number]

export const DEFAULT_DISCLAIMER =
  "본 분석은 약관/상품요약서를 기반으로 한 참고 자료이며, 법적 효력이 없습니다. 정확한 보장 내용은 정식 약관 원문을 확인하시기 바랍니다. 추가 상담이 필요한 경우 금융감독원(1332), 한국소비자원(1372), 또는 금융분쟁조정위원회에 문의하시기 바랍니다."

// Optional Stage 4 enrichment (severity tier + recommended actions). The base
// validated-findings artifacts omit these, so they are optional.
export const recommendedActionSchema = z.object({
  action: z.string(),
  priority: z.enum(["즉시", "가입 전", "가입 후", "선택"]),
  contact: z.string().nullable(),
})

export const vulnerabilitySchema = z.object({
  id: z.string(),
  taxonomy: z.string(),
  title: z.string(),
  // Verbatim clause text that triggered the finding (원문 인용)
  triggered_by: z.string(),
  description: z.string(),
  user_relevance: z.string(),
  confidence: z.enum(CONFIDENCE_LEVELS),
  // Verified precedent ids only; empty when none confirmed (Stage 2 default)
  precedent_refs: z.array(z.string()).default([]),
  note: z.string().optional(),
  // Stage 4 (optional)
  severity: z.enum(["CRITICAL", "HIGH", "MEDIUM", "LOW"]).optional(),
  recommended_actions: z.array(recommendedActionSchema).optional(),
})

export type Vulnerability = z.infer<typeof vulnerabilitySchema>

export const analysisProfileSchema = z
  .object({
    name: z.string().optional(),
    age: z.number().optional(),
    gender: z.string().optional(),
    occupation: z.string().optional(),
    conditions: z.array(z.string()).optional(),
    family_history: z.array(z.string()).optional(),
    smoking: z.boolean().optional(),
    special_notes: z.string().optional(),
  })
  .passthrough()

export const analysisSummarySchema = z.object({
  total_vulnerabilities: z.number(),
  by_taxonomy: z.record(z.string(), z.number()),
  by_confidence: z.object({
    HIGH: z.number(),
    MEDIUM: z.number(),
    LOW: z.number(),
  }),
  critical_findings: z.array(z.string()),
  user_specific_risks: z.array(z.string()),
})

export type AnalysisSummary = z.infer<typeof analysisSummarySchema>

export const analysisReportSchema = z.object({
  product: z.string(),
  profile: analysisProfileSchema.optional(),
  analyzed_at: z.string(),
  doc_type: z.string(),
  sections_parsed: z.number(),
  vulnerabilities: z.array(vulnerabilitySchema),
  summary: analysisSummarySchema,
  disclaimer: z.string(),
  // Provenance: where this report came from (precomputed harness run vs live)
  source: z.enum(["precomputed", "live"]).optional(),
})

export type AnalysisReport = z.infer<typeof analysisReportSchema>

// ── Display helpers ───────────────────────────────────────────────────────

// Confidence drives the headline color since the validated-findings format
// keys risk on confidence (HIGH/MEDIUM/LOW) rather than a severity tier.
export const CONFIDENCE_COLORS: Record<
  Confidence,
  { bg: string; text: string; border: string; dot: string }
> = {
  HIGH: { bg: "bg-red-600", text: "text-white", border: "border-red-600", dot: "bg-red-600" },
  MEDIUM: { bg: "bg-orange-500", text: "text-white", border: "border-orange-500", dot: "bg-orange-500" },
  LOW: { bg: "bg-yellow-500", text: "text-black", border: "border-yellow-500", dot: "bg-yellow-500" },
}

export const CONFIDENCE_LABELS: Record<Confidence, string> = {
  HIGH: "높음",
  MEDIUM: "보통",
  LOW: "낮음",
}
