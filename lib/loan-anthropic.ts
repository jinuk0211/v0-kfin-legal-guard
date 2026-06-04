import Anthropic from "@anthropic-ai/sdk"
import { LOAN_DISCLAIMER, type LoanReport } from "./loan-schemas"
import { normalizeLoanReport } from "./loan-normalize"
import { fetchUsGroundsBatch } from "./legal-grounds"

// Live analysis for raw US loan / credit-agreement filings (SEC EDGAR).
// Reproduces the harness final-report shape in a single call. Reads
// ANTHROPIC_API_KEY from env. Mirrors lib/card-anthropic.ts.
const anthropic = new Anthropic()

const SYSTEM_PROMPT = `You are the FinLegal-Harness US loan/credit-agreement auditor. You detect borrower-adverse clauses in US commercial loan, credit, and term-loan agreements (SEC EDGAR Exhibit 10.x filings) and project legal/financial risk to the borrower.

Taxonomy:
LOAN-01 Acceleration triggers (lender may demand full immediate repayment on minor or broadly-defined events of default)
LOAN-02 Material Adverse Change (MAC) clauses with vague definitions that let the lender unilaterally refuse or terminate obligations
LOAN-03 Prepayment penalty / make-whole premium that punishes early repayment
LOAN-04 Cross-default (default under another agreement cascades into default here)
LOAN-05 Subordination (borrower's rights or collateral ranked behind other creditors)
UNCATEGORIZED Any other borrower disadvantage not fitting LOAN-01..LOAN-05

Rules:
1. triggered_by MUST be the verbatim clause text from the agreement. No paraphrase.
2. Do NOT cite or invent case law or statutes. ALWAYS leave legal_grounds.precedents = [] and legal_grounds.statutes = []. Verified grounding (CourtListener precedents) is attached by a separate stage.
3. plain_language_explanation (<=150 chars), user_impact (<=100 chars), estimated_risk_scenario (<=200 chars): 8th-grade reading level.
4. confidence and user_relevance_score are floats in [0,1]. severity is one of CRITICAL|HIGH|MEDIUM|LOW.
5. recommended_actions: 1-3 items with priority one of immediate|pre-signing|optional. Contacts limited to real bodies (a finance/securities attorney, the lender/counterparty).
6. Output JSON ONLY. No markdown fences.

Output JSON (exactly this shape):
{
  "product": "string",
  "doc_type": "loan_agreement",
  "executive_summary": "string",
  "overall_risk_level": "HIGH|MEDIUM|LOW|NONE",
  "vulnerability_count": { "CRITICAL": 0, "HIGH": 0, "MEDIUM": 0, "LOW": 0, "uncategorized": 0 },
  "findings": [{
    "finding_id": "US-L001",
    "taxonomy": "LOAN-01",
    "title": "string",
    "triggered_by": "verbatim clause",
    "description": "string",
    "status": "UNVERIFIED",
    "confidence": 0.8,
    "user_relevance_score": 0.7,
    "legal_grounds": { "statutes": [], "precedents": [] },
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
  return `Analyze the following US loan/credit agreement and respond with the JSON shape only:\n\n${contractText.slice(0, 8000)}`
}

export async function analyzeLoan(contractText: string): Promise<LoanReport> {
  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 4000,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: buildUserPrompt(contractText) }],
  })

  const textBlock = message.content.find((block) => block.type === "text")
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("No text response from AI")
  }

  const cleaned = textBlock.text.replace(/```json|```/g, "").trim()
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
