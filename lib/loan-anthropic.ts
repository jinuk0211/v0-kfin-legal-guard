import { LOAN_DISCLAIMER, type LoanReport } from "./loan-schemas"
import { normalizeLoanReport } from "./loan-normalize"
import { fetchUsGroundsBatch } from "./legal-grounds"
import { runCompletion } from "./llm"

// Live analysis for raw US loan / credit-agreement filings (SEC EDGAR).
// Reproduces the harness final-report shape in a single call.
// Mirrors lib/card-anthropic.ts.

const SYSTEM_PROMPT = `You are the FinLegal-Harness US loan/credit-agreement auditor. You detect borrower-adverse clauses in US commercial loan, credit, and term-loan agreements (SEC EDGAR Exhibit 10.x filings) and project legal/financial risk to the borrower.

Analysis pipeline:
1. Free-form finding: first identify borrower-adverse clauses from the agreement without choosing a taxonomy category.
2. Taxonomy labeling: after each candidate finding is identified, assign the closest taxonomy label. If none fits cleanly, use UNCATEGORIZED instead of forcing a category.
3. Validation: keep only findings directly supported by a verbatim clause, with no speculation, invented facts, or legal citations.

Taxonomy:
LOAN-01 Acceleration triggers (lender may demand full immediate repayment on minor or broadly-defined events of default)
LOAN-02 Material Adverse Change (MAC) clauses with vague definitions that let the lender unilaterally refuse or terminate obligations
LOAN-03 Prepayment penalty / make-whole premium that punishes early repayment
LOAN-04 Cross-default (default under another agreement cascades into default here)
LOAN-05 Subordination (borrower's rights or collateral ranked behind other creditors)
UNCATEGORIZED Any other borrower disadvantage not fitting LOAN-01..LOAN-05

Rules:
1. Follow the Analysis pipeline in order. Taxonomy is a post-hoc label, not the starting point for detection.
2. triggered_by MUST be the verbatim clause text from the agreement. No paraphrase.
3. Do NOT cite or invent case law or statutes. Verified grounding (CourtListener precedents) is attached by a separate stage, so OMIT legal_grounds entirely from your output.
4. plain_language_explanation (<=150 chars), user_impact (<=100 chars), estimated_risk_scenario (<=200 chars): 8th-grade reading level.
5. confidence and user_relevance_score are floats in [0,1]. severity is one of CRITICAL|HIGH|MEDIUM|LOW.
6. recommended_actions: 1-3 items with priority one of immediate|pre-signing|optional. Contacts limited to real bodies (a finance/securities attorney, the lender/counterparty).
7. Output JSON ONLY. No markdown fences.

Output JSON (exactly this shape). The server recomputes vulnerability_count and attaches
legal_grounds, so do NOT output those fields:
{
  "product": "string",
  "executive_summary": "string",
  "overall_risk_level": "HIGH|MEDIUM|LOW|NONE",
  "findings": [{
    "finding_id": "US-L001",
    "taxonomy": "LOAN-01",
    "title": "string",
    "triggered_by": "verbatim clause",
    "description": "string",
    "confidence": 0.8,
    "user_relevance_score": 0.7,
    "severity": "HIGH",
    "plain_language_explanation": "string",
    "user_impact": "string",
    "estimated_risk_scenario": "string",
    "recommended_actions": [{ "action": "string", "priority": "pre-signing", "contact": "a finance attorney" }],
    "rank": 1
  }],
  "general_recommendations": ["string"],
  "disclaimer": "string"
}`

function buildUserPrompt(contractText: string): string {
  return `Analyze the following US loan/credit agreement using free-form finding -> taxonomy labeling -> validation, then respond with the JSON shape only:\n\n${contractText.slice(0, 8000)}`
}

export async function analyzeLoan(
  contractText: string,
  modelId?: string
): Promise<LoanReport> {
  const raw = await runCompletion({
    system: SYSTEM_PROMPT,
    user: buildUserPrompt(contractText),
    modelId,
  })
  const cleaned = raw.replace(/```json|```/g, "").trim()
  try {
    const parsed = JSON.parse(cleaned)
    const report = normalizeLoanReport(parsed, "live")
    // 검증된 CourtListener 판례로 grounding (상위 findings).
    const grounds = await fetchUsGroundsBatch(report.findings)
    const findings = report.findings.map((f, i) =>
      grounds[i] ? { ...f, legal_grounds: grounds[i]! } : f
    )
    return { ...report, findings }
  } catch (parseError) {
    console.error("[loan-anthropic] parse error:", parseError)
    return {
      product: "Loan Agreement",
      doc_type: "loan_agreement",
      vulnerability_count: { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0, uncategorized: 0 },
      findings: [],
      general_recommendations: [],
      disclaimer:
        "An error occurred while processing the AI analysis. Please try again. " +
        LOAN_DISCLAIMER,
      source: "live",
    }
  }
}
