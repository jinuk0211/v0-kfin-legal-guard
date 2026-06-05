import Anthropic from "@anthropic-ai/sdk"
import { DEFAULT_DISCLAIMER, type AnalysisReport, type UserProfile } from "./schemas"
import { normalizeReport } from "./normalize-report"

// Initialize client - uses ANTHROPIC_API_KEY from env
const anthropic = new Anthropic()

// The live call reproduces the FinLegal-Harness Stage 2 (vulnerability spotter)
// artifact shape plus a Stage 4 summary. Per the harness role boundaries, the
// spotter detects only and does NOT cite precedents — precedent_refs stays [].
const SYSTEM_PROMPT = `당신은 FinLegal-Harness의 Stage 2 취약점 탐지기(Vulnerability Spotter)입니다. 한국 금융계약(보험/대출) 약관에서 소비자에게 불리한 조항을 탐지합니다.

취약점 분류(taxonomy):
INS-01 보장 범위 불명확 – 면책조항이 과도하게 넓거나 모호한 경우
INS-02 고지의무 위반 면책 남용 – 인과관계 무관 면책 가능한 경우
INS-03 보장개시일/대기기간 불이익 – 소비자에게 불리한 대기기간/감액
INS-04 계약 해지권 남용 – 보험사 일방적 해지 가능 조항
INS-05 해약환급금 불이익 – 원금 대비 현저히 낮은 환급금
LOAN-01 변동금리 위험 미고지
LOAN-02 조기상환 조건 불투명
LOAN-03 담보권 실행 조건 과도

규칙(엄수):
1. triggered_by에는 약관 조항의 **원문**만 그대로 인용한다. 요약·해석·변형 금지.
2. 판례를 인용하지 않는다. precedent_refs는 항상 빈 배열 []로 둔다. (판례 검증은 별도 단계)
3. description과 user_relevance는 중학생 수준의 쉬운 어휘로 작성한다.
4. user_relevance는 제공된 사용자 프로필(나이/직업/병력 등)에 구체적으로 연결한다. 프로필이 없으면 일반적 영향으로 서술한다.
5. confidence는 "HIGH" | "MEDIUM" | "LOW" 중 하나(문자열)로만 표기한다.
6. 불필요한 공포를 유발하지 않는다. 확인이 필요한 사항은 "확인이 필요함" 수준으로 서술한다.
7. 반드시 JSON만 출력한다. Markdown 코드블록 금지.

출력 JSON 구조(정확히 이 형식). 집계 통계(total/by_taxonomy/by_confidence)는 서버가
vulnerabilities에서 재계산하므로 출력하지 말 것:
{
  "product": "상품명",
  "doc_type": "product_summary | contract",
  "vulnerabilities": [
    {
      "id": "V-001",
      "taxonomy": "INS-05",
      "title": "string",
      "triggered_by": "약관 원문 그대로",
      "description": "string",
      "user_relevance": "string",
      "confidence": "HIGH | MEDIUM | LOW",
      "precedent_refs": []
    }
  ],
  "summary": {
    "critical_findings": ["string"],
    "user_specific_risks": ["string"]
  },
  "disclaimer": "string"
}`

function buildUserPrompt(contractText: string, userProfile?: UserProfile): string {
  const profileSection = userProfile
    ? `사용자 프로필:
- 나이: ${userProfile.age || "미입력"}
- 직업: ${userProfile.occupation || "미입력"}
- 기존 병력: ${userProfile.conditions || "없음"}
- 상품 유형: ${userProfile.productType === "loan" ? "대출" : "보험"}

`
    : ""

  return `${profileSection}다음 약관을 분석하여 위 JSON 형식으로만 응답해주세요:

${contractText.slice(0, 8000)}`
}

export async function analyzeContract(
  contractText: string,
  userProfile?: UserProfile
): Promise<AnalysisReport> {
  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 4000,
    system: [{ type: "text", text: SYSTEM_PROMPT, cache_control: { type: "ephemeral" } }],
    messages: [
      {
        role: "user",
        content: buildUserPrompt(contractText, userProfile),
      },
    ],
  })

  const textBlock = message.content.find((block) => block.type === "text")
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("No text response from AI")
  }

  const raw = textBlock.text
  const cleaned = raw.replace(/```json|```/g, "").trim()

  try {
    const parsed = JSON.parse(cleaned)
    // Normalize into the canonical report shape (recomputes summary counts).
    return normalizeReport(parsed, "live")
  } catch (parseError) {
    console.error("[anthropic-client] parse/validation error:", parseError)
    console.error("[anthropic-client] Raw response:", raw)

    return {
      product: "분석 대상 약관",
      analyzed_at: new Date().toISOString().slice(0, 10),
      doc_type: "contract",
      sections_parsed: 0,
      vulnerabilities: [],
      summary: {
        total_vulnerabilities: 0,
        by_taxonomy: {},
        by_confidence: { HIGH: 0, MEDIUM: 0, LOW: 0 },
        critical_findings: [],
        user_specific_risks: [],
      },
      disclaimer:
        "AI 분석 결과를 처리하는 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요. " +
        DEFAULT_DISCLAIMER,
      source: "live",
    }
  }
}
