import Anthropic from "@anthropic-ai/sdk"
import type { UserProfile, AnalysisReport } from "./schemas"

// Initialize client - will use ANTHROPIC_API_KEY from env
const anthropic = new Anthropic()

const SYSTEM_PROMPT = `당신은 KFinLegal-Harness AI 시스템입니다. 한국 금융계약(보험/대출) 약관의 소비자 취약 조항을 탐지하는 전문가입니다.

취약점 분류(taxonomy):
INS-01 보장 범위 불명확 – 면책조항이 과도하게 넓거나 애매한 경우
INS-02 고지의무 위반 면책 남용 – 인과관계 무관 면책 가능한 경우
INS-03 보장개시일/대기기간 불이익 – 소비자 불리한 대기기간
INS-04 계약 해지권 남용 – 보험사 일방적 해지 가능 조항
INS-05 해약환급금 불이익 – 원금 대비 현저히 낮은 환급금
LOAN-01 변동금리 위험 미고지
LOAN-02 조기상환 조건 불투명
LOAN-03 담보권 실행 조건 과도

규칙:
1. 실제 대법원 판례만 인용하라 (hallucination 금지)
2. 사용자 프로필로 user_relevance_score 조정
3. 반드시 JSON만 출력하라 (Markdown 블록 금지)

출력 JSON 구조:
{
  "executive_summary": "string",
  "overall_risk_level": "HIGH|MEDIUM|LOW|NONE",
  "vulnerability_count": { "critical": 0, "high": 0, "medium": 0, "low": 0 },
  "findings": [{
    "rank": 1,
    "severity": "CRITICAL|HIGH|MEDIUM|LOW",
    "vuln_id": "INS-02",
    "vuln_name": "string",
    "clause_reference": "string",
    "plain_language_explanation": "string (150자 이내)",
    "user_impact": "string (100자 이내)",
    "estimated_risk_scenario": "string (200자 이내)",
    "recommended_actions": [{ "action": "string", "priority": "즉시|가입 전|가입 후", "contact": null }],
    "status": "CONFIRMED|UNVERIFIED",
    "confidence": 0.85
  }],
  "disclaimer": "string"
}`

function buildUserPrompt(contractText: string, userProfile?: UserProfile): string {
  const profileSection = userProfile
    ? `사용자 프로필:
- 나이: ${userProfile.age || "미입력"}세
- 직업: ${userProfile.occupation || "미입력"}
- 기존 병력: ${userProfile.conditions || "없음"}
- 상품 유형: ${userProfile.productType === "loan" ? "대출" : "보험"}

`
    : ""

  return `${profileSection}다음 약관을 분석해주세요:

${contractText.slice(0, 8000)}`
}

export async function analyzeContract(
  contractText: string,
  userProfile?: UserProfile
): Promise<AnalysisReport> {
  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 4000,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: buildUserPrompt(contractText, userProfile),
      },
    ],
  })

  // Extract text content
  const textBlock = message.content.find((block) => block.type === "text")
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("No text response from AI")
  }

  // Clean and parse JSON
  const raw = textBlock.text
  const cleaned = raw.replace(/```json|```/g, "").trim()

  try {
    const parsed = JSON.parse(cleaned) as AnalysisReport
    return parsed
  } catch (parseError) {
    // If JSON parsing fails, return a structured error response
    console.error("[anthropic-client] JSON parse error:", parseError)
    console.error("[anthropic-client] Raw response:", raw)

    return {
      executive_summary: "분석 결과를 파싱하는 중 오류가 발생했습니다.",
      overall_risk_level: "NONE",
      vulnerability_count: { critical: 0, high: 0, medium: 0, low: 0 },
      findings: [],
      disclaimer:
        "AI 분석 결과를 처리하는 중 오류가 발생했습니다. 다시 시도해 주세요.",
    }
  }
}
