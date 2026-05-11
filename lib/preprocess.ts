/**
 * lib/preprocess.ts
 * Stage 1: TXT 전처리기 (preprocess_pdf.py → TypeScript)
 */

const EXACT_REMOVE_LINES = new Set([
  "  [ 전체 표 JSON 구조 ]",
  "보험가격지수란?",
  "보장범위지수란?",
  "내용은 반드시 보험약관 등을 참조하시기 바랍니다.",
  "참조하시기 바랍니다.",
  "* 보험상품공시위원회에서 정하는 표준보장범위 상품의 위험보험료",
])

const STARTSWITH_REMOVE = [
  "Q. 적용이율이란",
  "A. 보험료를 납입하는 시점과",
  "Q. 적용위험률이란",
  "A. 한 개인이 사망하거나",
  "Q. 계약체결비용 및 계약관리비용",
  "A. 계약체결비용 및 계약관리비용이란",
  "Q. 해약환급금은 어떻게 산출",
  "□ 보장범위지수는 보험상품",
  "▶ 해당상품의 위험보험료",
  "해당상품의 보험료총액(보험금 지급을 위한 보험료 및 보험회사의 사업경비",
  "업비총액",
  "[ 페이지",
  "파일:",
  "▶ 텍스트",
  "▶ 표 ",
  "상품요약서",
  "◆ 계약자 배당에 관한 사항",
  "* 감독원장이 정하는 바에 따라",
  "** 상품군별 생명보험상품 전체의",
  "※ 회사별/상품별 비교",
]

const CONTAINS_REMOVE = [
  "━━━━━━━━━", "========",
  "+--------", "+------", "+-----", "+----", "+---",
]

const INTERNAL_MARKER = /\[.+?[-–—].+?INTERNAL\]/i
const TABLE_BORDER_ONLY = /^\s*(\|\s*)+\s*$/

function extractTableCellContent(line: string): string | null {
  const trimmed = line.trim()
  if (!trimmed.startsWith("|") || !trimmed.endsWith("|")) return null
  const cells = trimmed.slice(1, -1).split("|").map((c) => c.trim()).filter((c) => c.length > 0)
  if (cells.length === 0) return ""
  return cells.join(" ")
}

function preprocessLines(text: string): string {
  const lines = text.split("\n")
  const result: string[] = []
  let inJson = false

  for (const line of lines) {
    const stripped = line.trim()

    if (line.includes("[ 전체 표 JSON 구조 ]")) inJson = true
    if (inJson) continue
    if (INTERNAL_MARKER.test(line)) continue
    if (/^\s*\+[-+|]+\+\s*$/.test(stripped)) continue
    if (TABLE_BORDER_ONLY.test(line) && stripped.length > 0) continue
    if (EXACT_REMOVE_LINES.has(stripped)) continue
    if (STARTSWITH_REMOVE.some((p) => stripped.startsWith(p))) continue
    if (CONTAINS_REMOVE.some((s) => line.includes(s))) continue

    const tableContent = extractTableCellContent(line)
    if (tableContent !== null) {
      if (tableContent.trim().length > 0) result.push(tableContent)
      continue
    }
    result.push(line)
  }
  return result.join("\n")
}

function normalizeWhitespace(text: string): string {
  return text.replace(/\n{3,}/g, "\n\n")
    .split("\n").map((l) => l.trimEnd()).join("\n").trim()
}

export interface Section {
  title: string
  content: string
}

const SECTION_HEADER_RE =
  /^(?:◆\s+.+|[0-9]+(?:-[0-9]+)*\.\s+.+|\([0-9]+\)\s+.+|[⑴⑵⑶⑷⑸⑹⑺⑻⑼⑽]\s*.+)$/

export function parseSections(text: string): Section[] {
  const lines = text.split("\n")
  const sections: Section[] = []
  let currentTitle = "(도입부)"
  let currentLines: string[] = []

  for (const line of lines) {
    if (SECTION_HEADER_RE.test(line.trim())) {
      if (currentLines.some((l) => l.trim())) {
        sections.push({ title: currentTitle, content: currentLines.join("\n").trim() })
      }
      currentTitle = line.trim()
      currentLines = []
    } else {
      currentLines.push(line)
    }
  }
  if (currentLines.some((l) => l.trim())) {
    sections.push({ title: currentTitle, content: currentLines.join("\n").trim() })
  }
  return sections
}

export function preprocessContract(rawText: string): {
  preprocessed: string
  sections: Section[]
  stats: { originalLen: number; processedLen: number; reductionPct: number; sectionCount: number }
} {
  const originalLen = rawText.length
  let processed = preprocessLines(rawText)
  processed = normalizeWhitespace(processed)
  const sections = parseSections(processed)
  const processedLen = processed.length
  const reductionPct = originalLen > 0 ? (1 - processedLen / originalLen) * 100 : 0

  return {
    preprocessed: processed,
    sections,
    stats: {
      originalLen,
      processedLen,
      reductionPct: Math.round(reductionPct * 10) / 10,
      sectionCount: sections.length,
    },
  }
}
