import { CARD_DISCLAIMER, type CardReport, type CardFinding } from "./card-schemas"

// The 9 precomputed card reports are consistent, but we still normalize
// defensively: coerce defaults, sort findings by rank, and recompute
// vulnerability_count from the findings so the displayed stats are always
// internally consistent (severity buckets + a parallel uncategorized count).

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Raw = Record<string, any>

function normalizeFinding(raw: Raw, index: number, source: "precomputed" | "live"): CardFinding {
  // 라이브는 모델이 emit한 인용을 신뢰하지 않는다(환각 차단). grounding은
  // 검증된 CourtListener 단계(lib/legal-grounds)에서 별도로 채운다.
  const lg = source === "live" ? {} : (raw.legal_grounds ?? {})
  return {
    finding_id: String(raw.finding_id ?? `US-V${String(index + 1).padStart(3, "0")}`),
    taxonomy: String(raw.taxonomy ?? "UNCATEGORIZED"),
    title: String(raw.title ?? ""),
    triggered_by: String(raw.triggered_by ?? ""),
    description: raw.description != null ? String(raw.description) : undefined,
    // 라이브는 슬림 출력을 위해 status를 emit하지 않는다 → 검증 전 기본값 주입.
    status: raw.status ?? (source === "live" ? "UNVERIFIED" : undefined),
    confidence: typeof raw.confidence === "number" ? raw.confidence : undefined,
    user_relevance_score:
      typeof raw.user_relevance_score === "number" ? raw.user_relevance_score : undefined,
    legal_grounds: {
      statutes: Array.isArray(lg.statutes) ? lg.statutes : [],
      precedents: Array.isArray(lg.precedents) ? lg.precedents : [],
    },
    severity: raw.severity,
    plain_language_explanation: raw.plain_language_explanation,
    user_impact: raw.user_impact,
    estimated_risk_scenario: raw.estimated_risk_scenario,
    recommended_actions: Array.isArray(raw.recommended_actions)
      ? raw.recommended_actions
      : undefined,
    rank: typeof raw.rank === "number" ? raw.rank : index + 1,
  }
}

export function normalizeCardReport(raw: Raw, source: "precomputed" | "live"): CardReport {
  const findings: CardFinding[] = Array.isArray(raw?.findings)
    ? raw.findings
        .map((f: Raw, i: number) => normalizeFinding(f, i, source))
        .sort((a, b) => (a.rank ?? 0) - (b.rank ?? 0))
    : []

  const count = { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0, uncategorized: 0 }
  for (const f of findings) {
    if (f.severity && count[f.severity] !== undefined) count[f.severity] += 1
    if (f.taxonomy === "UNCATEGORIZED") count.uncategorized += 1
  }

  return {
    session_id: raw?.session_id,
    generated_at: raw?.generated_at,
    product: String(raw?.product ?? "Credit Card Agreement"),
    doc_type: raw?.doc_type ?? "credit_card_agreement",
    user_profile: raw?.user_profile,
    executive_summary: raw?.executive_summary,
    overall_risk_level: raw?.overall_risk_level,
    vulnerability_count: count,
    findings,
    general_recommendations: Array.isArray(raw?.general_recommendations)
      ? raw.general_recommendations
      : [],
    disclaimer: typeof raw?.disclaimer === "string" ? raw.disclaimer : CARD_DISCLAIMER,
    source,
  }
}
