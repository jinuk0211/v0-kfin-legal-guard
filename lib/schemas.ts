import { z } from "zod"

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

// User profile schema
export const userProfileSchema = z.object({
  age: z.string().optional(),
  occupation: z.string().optional(),
  conditions: z.string().optional(),
  productType: z.enum(["insurance", "loan"]).default("insurance"),
})

export type UserProfile = z.infer<typeof userProfileSchema>

// Analysis request schema
export const analysisRequestSchema = z.object({
  contractText: z.string().min(100, "약관 내용이 너무 짧습니다 (100자 이상)"),
  userProfile: userProfileSchema.optional(),
})

export type AnalysisRequest = z.infer<typeof analysisRequestSchema>

// Vulnerability finding schema
export const vulnerabilityFindingSchema = z.object({
  rank: z.number(),
  severity: z.enum(["CRITICAL", "HIGH", "MEDIUM", "LOW"]),
  vuln_id: z.string(),
  vuln_name: z.string(),
  clause_reference: z.string(),
  plain_language_explanation: z.string(),
  user_impact: z.string(),
  estimated_risk_scenario: z.string(),
  recommended_actions: z.array(
    z.object({
      action: z.string(),
      priority: z.enum(["즉시", "가입 전", "가입 후"]),
      contact: z.string().nullable(),
    })
  ),
  status: z.enum(["CONFIRMED", "UNVERIFIED"]),
  confidence: z.number().min(0).max(1),
})

export type VulnerabilityFinding = z.infer<typeof vulnerabilityFindingSchema>

// Analysis report schema
export const analysisReportSchema = z.object({
  executive_summary: z.string(),
  overall_risk_level: z.enum(["HIGH", "MEDIUM", "LOW", "NONE"]),
  vulnerability_count: z.object({
    critical: z.number(),
    high: z.number(),
    medium: z.number(),
    low: z.number(),
  }),
  findings: z.array(vulnerabilityFindingSchema),
  disclaimer: z.string(),
})

export type AnalysisReport = z.infer<typeof analysisReportSchema>

// Severity colors
export const SEVERITY_COLORS = {
  CRITICAL: { bg: "bg-red-600", text: "text-white", border: "border-red-600" },
  HIGH: { bg: "bg-orange-500", text: "text-white", border: "border-orange-500" },
  MEDIUM: { bg: "bg-yellow-500", text: "text-black", border: "border-yellow-500" },
  LOW: { bg: "bg-blue-500", text: "text-white", border: "border-blue-500" },
} as const

// Risk level colors
export const RISK_LEVEL_COLORS = {
  HIGH: "text-red-600",
  MEDIUM: "text-orange-500",
  LOW: "text-yellow-600",
  NONE: "text-green-600",
} as const
