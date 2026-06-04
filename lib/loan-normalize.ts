import { LOAN_DISCLAIMER, type LoanReport, type LoanFinding } from "./loan-schemas"

// Defensive normalization for live loan reports: coerce defaults, sort findings
// by rank, and recompute vulnerability_count from the findings so displayed
// stats stay internally consistent. Mirrors lib/card-normalize.ts.

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Raw = Record<string, any>

function normalizeFinding(raw: Raw, index: number): LoanFinding {
  const lg = raw.legal_grounds ?? {}
  return {
    finding_id: String(raw.finding_id ?? `US-L${String(index + 1).padStart(3, "0")}`),
    taxonomy: String(raw.taxonomy ?? "UNCATEGORIZED"),
    title: String(raw.title ?? ""),
    triggered_by: String(raw.triggered_by ?? ""),
    description: raw.description != null ? String(raw.description) : undefined,
    status: raw.status,
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

export function normalizeLoanReport(raw: Raw, source: "live"): LoanReport {
  const findings: LoanFinding[] = Array.isArray(raw?.findings)
    ? raw.findings.map(normalizeFinding).sort((a, b) => (a.rank ?? 0) - (b.rank ?? 0))
    : []

  const count = { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0, uncategorized: 0 }
  for (const f of findings) {
    if (f.severity && count[f.severity] !== undefined) count[f.severity] += 1
    if (f.taxonomy === "UNCATEGORIZED") count.uncategorized += 1
  }

  return {
    session_id: raw?.session_id,
    generated_at: raw?.generated_at,
    product: String(raw?.product ?? "Loan Agreement"),
    doc_type: raw?.doc_type ?? "loan_agreement",
    executive_summary: raw?.executive_summary,
    overall_risk_level: raw?.overall_risk_level,
    vulnerability_count: count,
    findings,
    general_recommendations: Array.isArray(raw?.general_recommendations)
      ? raw.general_recommendations
      : [],
    disclaimer: typeof raw?.disclaimer === "string" ? raw.disclaimer : LOAN_DISCLAIMER,
    source,
  }
}
