import {
  CONFIDENCE_LEVELS,
  DEFAULT_DISCLAIMER,
  type AnalysisReport,
  type Confidence,
  type Vulnerability,
} from "./schemas"

// The real harness artifacts (logic/analysis_results) use a CONSISTENT
// per-vulnerability schema but an INCONSISTENT summary block (different runs
// emit by_confidence vs high_confidence, critical_findings vs critical_for_user,
// or no summary at all). We therefore recompute the summary from the
// vulnerabilities (always authoritative) and only harvest the human-readable
// string lists from whichever variant keys are present.

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Raw = Record<string, any>

function toStringArray(v: unknown): string[] {
  if (!v) return []
  if (typeof v === "string") return [v]
  if (Array.isArray(v)) {
    return v
      .map((x) => {
        if (typeof x === "string") return x
        if (x && typeof x === "object") {
          const o = x as Raw
          return o.title || o.issue || o.concern || o.description || ""
        }
        return ""
      })
      .filter((s): s is string => Boolean(s))
  }
  return []
}

function pickFirst(obj: Raw, keys: string[]): unknown {
  for (const k of keys) {
    if (obj[k] != null) return obj[k]
  }
  return undefined
}

function normalizeConfidence(raw: unknown): Confidence {
  const v = String(raw ?? "").toUpperCase()
  return (CONFIDENCE_LEVELS as readonly string[]).includes(v) ? (v as Confidence) : "MEDIUM"
}

function normalizeVuln(raw: Raw, index: number): Vulnerability {
  return {
    id: typeof raw.id === "string" ? raw.id : `V-${String(index + 1).padStart(3, "0")}`,
    taxonomy: String(raw.taxonomy ?? "INS-01"),
    title: String(raw.title ?? ""),
    triggered_by: String(raw.triggered_by ?? ""),
    description: String(raw.description ?? ""),
    user_relevance: String(raw.user_relevance ?? ""),
    confidence: normalizeConfidence(raw.confidence),
    precedent_refs: Array.isArray(raw.precedent_refs) ? raw.precedent_refs.map(String) : [],
    note: typeof raw.note === "string" ? raw.note : undefined,
    severity: raw.severity,
    recommended_actions: Array.isArray(raw.recommended_actions)
      ? raw.recommended_actions
      : undefined,
  }
}

const CRITICAL_KEYS = [
  "critical_findings",
  "critical_for_user",
  "user_critical_issues",
  "primary_concerns",
  "critical_findings_for_user",
  "critical_user_relevance",
]

const USER_RISK_KEYS = [
  "user_specific_risks",
  "key_user_risks",
  "priority_concerns_for_user",
  "priority_concerns",
]

// Accepts any harness artifact (or a live LLM result) and returns the canonical
// AnalysisReport shape the UI renders.
export function normalizeReport(raw: Raw, source: "precomputed" | "live"): AnalysisReport {
  const vulnerabilities: Vulnerability[] = Array.isArray(raw?.vulnerabilities)
    ? raw.vulnerabilities.map(normalizeVuln)
    : []

  const by_confidence = { HIGH: 0, MEDIUM: 0, LOW: 0 }
  const by_taxonomy: Record<string, number> = {}
  for (const v of vulnerabilities) {
    by_confidence[v.confidence] += 1
    by_taxonomy[v.taxonomy] = (by_taxonomy[v.taxonomy] ?? 0) + 1
  }

  const rawSummary: Raw = raw?.summary ?? {}
  let critical_findings = toStringArray(pickFirst(rawSummary, CRITICAL_KEYS))
  const user_specific_risks = toStringArray(pickFirst(rawSummary, USER_RISK_KEYS))

  // Fall back to the titles of the highest-confidence findings.
  if (critical_findings.length === 0) {
    critical_findings = vulnerabilities
      .filter((v) => v.confidence === "HIGH")
      .slice(0, 3)
      .map((v) => v.title)
      .filter(Boolean)
  }

  return {
    product: String(raw?.product ?? "분석 대상 약관"),
    profile: raw?.profile,
    analyzed_at: String(raw?.analyzed_at ?? new Date().toISOString().slice(0, 10)),
    doc_type: String(raw?.doc_type ?? "contract"),
    sections_parsed: typeof raw?.sections_parsed === "number" ? raw.sections_parsed : 0,
    vulnerabilities,
    summary: {
      total_vulnerabilities: vulnerabilities.length,
      by_taxonomy,
      by_confidence,
      critical_findings,
      user_specific_risks,
    },
    disclaimer: typeof raw?.disclaimer === "string" ? raw.disclaimer : DEFAULT_DISCLAIMER,
    source,
  }
}
