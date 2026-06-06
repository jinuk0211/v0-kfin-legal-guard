import { CARD_DISCLAIMER, type CardReport } from "./card-schemas"
import { normalizeCardReport } from "./card-normalize"
import { fetchUsGroundsBatch } from "./legal-grounds"
import { runCompletion } from "./llm"

// Live analysis for raw CFPB credit-card agreements. Reproduces the harness
// T2 final-report shape in a single call.

const SYSTEM_PROMPT = `You are the FinLegal-Harness US credit-card auditor. You detect consumer-adverse clauses in US credit-card agreements (CFPB Credit Card Agreement Database) and project cost/disclosure risk under the Truth in Lending Act (TILA), Regulation Z, the Credit CARD Act of 2009, and the Federal Arbitration Act.

Analysis pipeline:
1. Free-form finding: first identify consumer-adverse clauses from the agreement without choosing a taxonomy category.
2. Taxonomy labeling: after each candidate finding is identified, assign the closest taxonomy label. If none fits cleanly, use UNCATEGORIZED instead of forcing a category.
3. Validation: keep only findings directly supported by a verbatim clause, with no speculation, invented facts, or legal citations.

Taxonomy:
CC-01 Hidden or unclear fees (annual, foreign transaction, cash advance, late fees)
CC-02 Unfavorable APR / penalty-rate escalation
CC-03 Minimum-payment trap / unfavorable billing (average daily balance, two-cycle)
CC-04 Unilateral change-in-terms / account cancellation without adequate notice
CC-05 Mandatory arbitration / class-action waiver
UNCATEGORIZED Any other consumer disadvantage not fitting CC-01..CC-05

Rules:
1. Follow the Analysis pipeline in order. Taxonomy is a post-hoc label, not the starting point for detection.
2. triggered_by MUST be the verbatim clause text from the agreement. No paraphrase.
3. Do NOT cite or invent case law or statutes. Verified grounding (CourtListener precedents + US statutes) is attached by a separate stage, so OMIT legal_grounds entirely from your output.
4. plain_language_explanation (<=150 chars), user_impact (<=100 chars, tied to the persona if given), estimated_risk_scenario (<=200 chars): 8th-grade reading level.
5. confidence and user_relevance_score are floats in [0,1]. severity is one of CRITICAL|HIGH|MEDIUM|LOW.
6. recommended_actions: 1-3 items with priority one of immediate|pre-signing|optional. Contacts limited to real bodies (CFPB 1-855-411-2372, consumerfinance.gov, the issuer).
7. Output JSON ONLY. No markdown fences.

Output JSON (exactly this shape). The server recomputes vulnerability_count and attaches
legal_grounds, so do NOT output those fields:
{
  "product": "string",
  "user_profile": { "id": "P01|P02|P03|null", "risk_flags": ["string"] },
  "executive_summary": "string",
  "overall_risk_level": "HIGH|MEDIUM|LOW|NONE",
  "findings": [{
    "finding_id": "US-V001",
    "taxonomy": "CC-02",
    "title": "string",
    "triggered_by": "verbatim clause",
    "description": "string",
    "confidence": 0.8,
    "user_relevance_score": 0.7,
    "severity": "HIGH",
    "plain_language_explanation": "string",
    "user_impact": "string",
    "estimated_risk_scenario": "string",
    "recommended_actions": [{ "action": "string", "priority": "immediate", "contact": "CFPB at consumerfinance.gov" }],
    "rank": 1
  }],
  "general_recommendations": ["string"],
  "disclaimer": "string"
}`

interface PersonaHint {
  id?: string
  risk_flags?: string[]
}

function buildUserPrompt(contractText: string, persona?: PersonaHint): string {
  const personaSection = persona?.id
    ? `Consumer persona: ${persona.id} (risk flags: ${(persona.risk_flags ?? []).join(", ") || "none"}). Tailor user_impact to this persona.\n\n`
    : ""
  return `${personaSection}Analyze the following US credit-card agreement using free-form finding -> taxonomy labeling -> validation, then respond with the JSON shape only:\n\n${contractText.slice(0, 8000)}`
}

export async function analyzeCard(
  contractText: string,
  persona?: PersonaHint,
  modelId?: string
): Promise<CardReport> {
  const raw = await runCompletion({
    system: SYSTEM_PROMPT,
    user: buildUserPrompt(contractText, persona),
    modelId,
  })
  const cleaned = raw.replace(/```json|```/g, "").trim()
  try {
    const parsed = JSON.parse(cleaned)
    const report = normalizeCardReport(parsed, "live")
    // 검증된 CourtListener 판례 + US 법령으로 grounding (상위 findings).
    const grounds = await fetchUsGroundsBatch(report.findings)
    const findings = report.findings.map((f, i) =>
      grounds[i] ? { ...f, legal_grounds: grounds[i]! } : f
    )
    return { ...report, findings }
  } catch (parseError) {
    console.error("[card-anthropic] parse error:", parseError)
    return {
      product: "Credit Card Agreement",
      doc_type: "credit_card_agreement",
      vulnerability_count: { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0, uncategorized: 0 },
      findings: [],
      general_recommendations: [],
      disclaimer:
        "An error occurred while processing the AI analysis. Please try again. " +
        CARD_DISCLAIMER,
      source: "live",
    }
  }
}
