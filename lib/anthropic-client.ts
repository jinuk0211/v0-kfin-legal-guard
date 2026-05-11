/**
 * lib/anthropic-client.ts
 * 4단계 파이프라인:
 *   Stage 1: 전처리 (preprocess.ts)
 *   Stage 2: 취약점 스포팅 (txt-vulnerability-spotter 로직)
 *   Stage 3: 법령 검증 (legal-validator 로직)
 *   Stage 4: 심각도 분류 + 최종 리포트 (severity-classifier 로직)
 */

import Anthropic from "@anthropic-ai/sdk"
import type { UserProfile, AnalysisReport } from "./schemas"
import { preprocessContract } from "./preprocess"

const anthropic = new Anthropic()

// ── 취약점 ID → 법령 매핑 (batch_validate.py의 VULN_STATUTE_MAP) ──────────
const VULN_STATUTE_MAP: Record<string, Array<[string, string, string]>> = {
  "INS-01": [
    ["상법", "제638조의2", "보험약관의 교부·설명 의무"],
    ["금융소비자보호법", "제19조", "설명의무"],
    ["보험업법", "제95조의2", "보험계약의 체결 또는 모집에 관한 금지행위"],
  ],
  "INS-02": [
    ["상법", "제651조", "고지의무위반으로 인한 계약해지"],
    ["상법", "제651조의2", "서면에 의한 질문의 효력"],
  ],
  "INS-03": [
    ["약관의 규제에 관한 법률", "제7조", "면책조항의 금지"],
    ["상법", "제659조", "보험자의 면책사유"],
  ],
  "INS-04": [
    ["상법", "제651조의2", "서면에 의한 질문의 효력"],
    ["상법", "제651조", "고지의무위반으로 인한 계약해지"],
  ],
  "INS-05": [
    ["약관의 규제에 관한 법률", "제5조", "약관의 해석"],
    ["약관의 규제에 관한 법률", "제6조", "일반원칙"],
  ],
  "LOAN-01": [
    ["은행법", "제52조", "약관의 제정·변경"],
    ["약관의 규제에 관한 법률", "제6조", "일반원칙"],
  ],
  "LOAN-02": [
    ["민법", "제388조", "기한의 이익의 상실"],
    ["약관의 규제에 관한 법률", "제9조", "계약의 해제·해지"],
  ],
  "LOAN-03": [
    ["이자제한법", "제2조", "이자의 최고한도"],
    ["약관의 규제에 관한 법률", "제8조", "손해배상액의 예정"],
  ],
}

// ── 택소노미 힌트 (batch_validate.py의 TAXONOMY_HINT) ────────────────────────
const TAXONOMY_HINT: Record<string, string> = {
  "INS-01": "면책 범위 과대, 보장 감액, 특정 암종 보험금 현저히 낮음",
  "INS-02": "고지의무 위반, 인과관계, 계약해지, 보험금 지급 거절 관련",
  "INS-03": "보험 면책조항, 대기기간, 보장범위 제한, 약관규제법 관련",
  "INS-04": "고지의무 서면질문 범위, 불고지, 보험계약 무효 관련",
  "INS-05": "약관 해석 원칙, 작성자불이익, 해약환급금, 불공정 약관 관련",
  "LOAN-01": "변동금리 대출, 금리변경 약관 관련",
  "LOAN-02": "기한이익상실, 대출 조기상환 관련",
  "LOAN-03": "중도상환수수료, 이자제한법 관련",
  "UNCATEGORIZED": "보험 약관 소비자 불이익 일반",
}

// ────────────────────────────────────────────────────────────────────────────
// Stage 2: 취약점 스포팅 프롬프트
// txt-vulnerability-spotter.md 로직 이식
// ────────────────────────────────────────────────────────────────────────────
function buildStage2Prompt(preprocessed: string, userProfile?: UserProfile): string {
  const profileSection = userProfile
    ? `사용자 프로필:
- 나이: ${userProfile.age || "미입력"}세
- 직업: ${userProfile.occupation || "미입력"}
- 기존 병력: ${userProfile.conditions || "없음"}
- 상품 유형: ${userProfile.productType === "loan" ? "대출" : "보험"}
`
    : ""

  return `${profileSection}
아래 약관 전처리 텍스트를 읽고, 소비자 입장에서 불리하거나 불투명하거나 권리를 제한하는 모든 조항을 탐지하라.

탐지 순서:
① 원문 전체를 읽으며 소비자 불이익 문장·조항 자유 추출 (택소노미 생각 금지)
② 추출된 항목에 택소노미 라벨 후부착 (INS-01~05 / LOAN-01~03 / UNCATEGORIZED)

탐지 기준 (하나라도 해당하면 추출):
- 이 조항으로 소비자가 예상보다 적은 보험금을 받을 수 있는가?
- 이 조항이 보험사에게 일방적인 재량권을 주는가?
- 이 조항의 의미가 평균적인 소비자에게 불명확한가?
- 이 조항이 소비자의 해지·청구·이의제기 권리를 제한하는가?
- 이 조항에 소비자가 예상하지 못할 불이익이 숨어 있는가?

택소노미 라벨:
INS-01: 면책 범위 과대, 보장 감액
INS-02: 고지의무 위반 면책, 인과관계 불문 면책
INS-03: 대기기간·면책기간 불이익
INS-04: 소비자 불리한 계약 해지·취소
INS-05: 해약환급금 미지급·삭감
LOAN-01: 변동금리 위험 미고지
LOAN-02: 조기상환 조건 불투명
LOAN-03: 담보권 실행 조건 과도
UNCATEGORIZED: 위 어디에도 맞지 않는 소비자 불이익

user_relevance_score 기준 (base 0.60):
- 나이 65세↑ + INS-01/INS-05: +0.30
- 기존 병력 + INS-02/INS-04: +0.40
- 위험 직군 + INS-01/INS-03: +0.25
- UNCATEGORIZED: 내용 기반 0.00~0.40

confidence (상품요약서 −0.10 적용 후):
- HIGH: 0.70 (소비자 불이익이 원문에 명확)
- MEDIUM: 0.55 (불이익 가능성 있으나 해석 여지)
- LOW: 0.45 (간접 신호, 정식 약관 확인 필요)

절대 규칙:
- triggered_by는 원문 그대로 (요약·재서술 금지)
- precedent_refs는 반드시 빈 배열
- 판례 인용 금지 (이 단계에서는)
- JSON만 출력, Markdown 블록 금지

출력 형식 (JSON 배열):
[
  {
    "id": "V-001",
    "taxonomy": "INS-02",
    "title": "취약점 짧은 제목 (30자 이내)",
    "section_title": "발견된 섹션 제목",
    "triggered_by": "근거 원문 그대로",
    "description": "왜 소비자에게 불리한지 2~3줄",
    "confidence": 0.70,
    "user_relevance_score": 0.60,
    "retrieval_query": "판례 검색용 자연어 쿼리",
    "status": "DRAFT",
    "uncategorized_reason": null,
    "precedent_refs": []
  }
]

약관 텍스트:
${preprocessed.slice(0, 12000)}`
}

// ────────────────────────────────────────────────────────────────────────────
// Stage 3: 법령 검증 프롬프트
// legal-validator.md 로직 이식
// ────────────────────────────────────────────────────────────────────────────
function buildStage3Prompt(
  drafts: VulnerabilityDraft[],
  userProfile?: UserProfile
): string {
  const statuteHints = drafts.map((d) => {
    const statutes = VULN_STATUTE_MAP[d.taxonomy] || []
    const hint = TAXONOMY_HINT[d.taxonomy] || ""
    return {
      id: d.id,
      taxonomy: d.taxonomy,
      triggered_by: d.triggered_by.slice(0, 300),
      description: d.description,
      hint,
      statutes,
    }
  })

  return `다음은 보험 약관 취약점 DRAFT 목록이다.
각 항목에 대해 관련 법령과 판례를 검증하고 법적 근거를 보강하라.

사용자 프로필:
- 나이: ${userProfile?.age || "미입력"}세
- 기존 병력: ${userProfile?.conditions || "없음"}

검증 지침:
1. 각 취약점의 taxonomy에 해당하는 법령 조항을 확인하라
2. 실제 대법원·하급심 판례만 인용하라 (hallucination 절대 금지)
3. 판례를 찾을 수 없으면 status: "UNVERIFIED", precedent_refs: []
4. UNCATEGORIZED도 일반 약관규제법 기준으로 검토하라
5. confidence는 법령 검증 후 ±0.10 조정 가능
6. JSON만 출력, Markdown 블록 금지

법령 힌트:
${JSON.stringify(statuteHints, null, 2)}

출력 형식 (JSON 배열):
[
  {
    "id": "V-001",
    "taxonomy": "INS-02",
    "title": "...",
    "triggered_by": "...",
    "description": "...",
    "confidence": 0.70,
    "user_relevance_score": 0.60,
    "status": "CONFIRMED",
    "legal_grounds": {
      "statutes": [{"law": "상법", "article": "제651조", "description": "고지의무위반"}],
      "precedents": [{"case_number": "대법원 2019다12345", "date": "2019-05-30", "summary": "..."}]
    },
    "precedent_refs": []
  }
]`
}

// ────────────────────────────────────────────────────────────────────────────
// Stage 4: 심각도 분류 + 최종 리포트
// severity-classifier.md 로직 이식
// ────────────────────────────────────────────────────────────────────────────
function buildStage4Prompt(
  validated: ValidatedFinding[],
  userProfile?: UserProfile
): string {
  const profileSection = userProfile
    ? `사용자 프로필:
- 나이: ${userProfile.age || "미입력"}세
- 직업: ${userProfile.occupation || "미입력"}
- 기존 병력: ${userProfile.conditions || "없음"}
- 상품 유형: ${userProfile.productType === "loan" ? "대출" : "보험"}
`
    : ""

  return `${profileSection}
다음은 법령 검증이 완료된 취약점 목록이다.
각 취약점의 심각도를 분류하고 개인화된 최종 리포트를 생성하라.

심각도 분류 기준:
CRITICAL: 법령 위반 명확 + confidence 0.75↑ + user_relevance_score 0.80↑
HIGH:     법령 위반 가능 + confidence 0.65↑
MEDIUM:   소비자 불이익 있으나 법령 위반 불확실
LOW:      간접 불이익, 참고 수준

UNCATEGORIZED는 내용 기반으로 MEDIUM 또는 LOW 부여.
UNVERIFIED는 MEDIUM 이하로만 분류.

출력 규칙:
- findings는 severity 내림차순 정렬 (CRITICAL→HIGH→MEDIUM→LOW)
- plain_language_explanation: 150자 이내, 평어체
- user_impact: 100자 이내, 이 사용자에게 맞춤화
- estimated_risk_scenario: 200자 이내, 구체적 시나리오
- recommended_actions: 금융감독원(☎1332), 한국소비자원(☎1372) 등 검증된 기관만
- disclaimer에 "상품요약서 기반 분석" 문구 포함
- JSON만 출력, Markdown 블록 금지

검증 완료 취약점:
${JSON.stringify(validated, null, 2).slice(0, 10000)}

출력 형식:
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
  "disclaimer": "본 리포트는 AI 기반 자동 분석 결과로, 법적 효력이 없습니다. 상품요약서 기반 분석이므로 정식 약관 원문과 다를 수 있습니다. 확인된 취약점에 대해서는 반드시 금융감독원(☎1332) 또는 전문 변호사에 문의하시기 바랍니다."
}`
}

// ── 내부 타입 ─────────────────────────────────────────────────────────────
interface VulnerabilityDraft {
  id: string
  taxonomy: string
  title: string
  section_title: string
  triggered_by: string
  description: string
  confidence: number
  user_relevance_score: number
  retrieval_query: string
  status: string
  uncategorized_reason: string | null
  precedent_refs: string[]
}

interface ValidatedFinding extends VulnerabilityDraft {
  legal_grounds?: {
    statutes: Array<{ law: string; article: string; description: string }>
    precedents: Array<{ case_number: string; date: string; summary: string }>
  }
}

function parseJsonSafely<T>(raw: string, fallback: T): T {
  const cleaned = raw.replace(/```json|```/g, "").trim()
  try {
    return JSON.parse(cleaned) as T
  } catch {
    // JSON이 잘린 경우 배열 끝을 수동으로 닫기 시도
    try {
      const partial = cleaned.endsWith("]") ? cleaned : cleaned + "]"
      return JSON.parse(partial) as T
    } catch {
      return fallback
    }
  }
}

// ── 메인 export ───────────────────────────────────────────────────────────

export async function analyzeContract(
  contractText: string,
  userProfile?: UserProfile
): Promise<AnalysisReport> {

  // ── Stage 1: 전처리 ────────────────────────────────────────────
  const { preprocessed, stats } = preprocessContract(contractText)
  console.log(
    `[Stage1] 전처리 완료 — ${stats.originalLen}자 → ${stats.processedLen}자 (${stats.reductionPct}% 절감), 섹션 ${stats.sectionCount}개`
  )

  if (stats.sectionCount === 0 && preprocessed.trim().length < 100) {
    throw new Error("PARSE_FAIL: 파싱 가능한 섹션이 없습니다. 파일 형식을 확인하세요.")
  }

  // ── Stage 2: 취약점 스포팅 ────────────────────────────────────
  const stage2Res = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 4000,
    system:
      "당신은 KFinLegal-Harness의 취약점 스포터입니다. 보험·대출 약관에서 소비자 불이익 조항을 탐지합니다. 판례 인용 금지. JSON 배열만 출력.",
    messages: [{ role: "user", content: buildStage2Prompt(preprocessed, userProfile) }],
  })

  const stage2Text = stage2Res.content.find((b) => b.type === "text")?.text ?? "[]"
  const drafts = parseJsonSafely<VulnerabilityDraft[]>(stage2Text, [])
  console.log(`[Stage2] 취약점 DRAFT ${drafts.length}건 탐지`)

  if (drafts.length === 0) {
    return {
      executive_summary: "분석 결과 소비자 불이익 조항이 발견되지 않았습니다.",
      overall_risk_level: "NONE",
      vulnerability_count: { critical: 0, high: 0, medium: 0, low: 0 },
      findings: [],
      disclaimer:
        "본 리포트는 AI 기반 자동 분석 결과로, 법적 효력이 없습니다. 상품요약서 기반 분석이므로 정식 약관 원문과 다를 수 있습니다.",
    }
  }

  // ── Stage 3: 법령 검증 ────────────────────────────────────────
  const stage3Res = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 4000,
    system:
      "당신은 KFinLegal-Harness의 법령 검증 에이전트입니다. 취약점 DRAFT에 법령 근거를 보강합니다. 실제 판례만 인용. JSON 배열만 출력.",
    messages: [{ role: "user", content: buildStage3Prompt(drafts, userProfile) }],
  })

  const stage3Text = stage3Res.content.find((b) => b.type === "text")?.text ?? "[]"
  const validated = parseJsonSafely<ValidatedFinding[]>(stage3Text, drafts as ValidatedFinding[])
  console.log(`[Stage3] 법령 검증 완료 — ${validated.length}건`)

  // ── Stage 4: 심각도 분류 + 최종 리포트 ───────────────────────
  const stage4Res = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 4000,
    system:
      "당신은 KFinLegal-Harness의 심각도 분류기입니다. 법령 검증 완료 취약점을 심각도별로 분류하고 개인화된 최종 리포트를 생성합니다. JSON만 출력.",
    messages: [{ role: "user", content: buildStage4Prompt(validated, userProfile) }],
  })

  const stage4Text = stage4Res.content.find((b) => b.type === "text")?.text ?? "{}"
  const report = parseJsonSafely<AnalysisReport>(stage4Text, {
    executive_summary: "리포트 생성 중 오류가 발생했습니다.",
    overall_risk_level: "NONE",
    vulnerability_count: { critical: 0, high: 0, medium: 0, low: 0 },
    findings: [],
    disclaimer: "AI 분석 결과를 처리하는 중 오류가 발생했습니다. 다시 시도해 주세요.",
  })

  console.log(`[Stage4] 최종 리포트 생성 완료 — 위험도: ${report.overall_risk_level}`)
  return report
}
