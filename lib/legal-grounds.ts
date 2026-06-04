/**
 * 라이브 카드·대출 분석에서 탐지된 finding을 CourtListener 판례 + US 법령으로
 * grounding한다. 서버에서 /api/precedents_us (Vercel Python Function)를 호출.
 *
 * 주의: 이 Python 엔드포인트는 Vercel 배포(또는 `vercel dev`)에서만 동작한다.
 * 일반 `next dev`엔 없으므로 호출이 실패하면 빈 grounds로 graceful degrade한다.
 */

// 카드/대출 legal_grounds와 구조적으로 호환되는 형태.
export interface UsLegalGrounds {
  statutes: { law_name: string; article: string; verified?: boolean }[]
  precedents: {
    case_number?: string
    case_name: string
    court?: string
    date?: string
    summary?: string
    relevance_score?: number
    source?: string
    url?: string
  }[]
}

function getBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_BASE_URL) return process.env.NEXT_PUBLIC_BASE_URL
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`
  return `http://localhost:${process.env.PORT ?? 3000}`
}

interface GroundQuery {
  taxonomy?: string
  title?: string
  triggered_by?: string
}

async function fetchOne(item: GroundQuery): Promise<UsLegalGrounds | null> {
  const taxonomy = String(item.taxonomy ?? "").trim()
  if (!taxonomy) return null
  try {
    const res = await fetch(`${getBaseUrl()}/api/precedents_us`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        taxonomy,
        title: item.title ?? "",
        triggered_by: item.triggered_by ?? "",
        top_k: 3,
      }),
    })
    if (!res.ok) return null
    const data = await res.json()
    return {
      statutes: Array.isArray(data.statutes) ? data.statutes : [],
      precedents: Array.isArray(data.precedents) ? data.precedents : [],
    }
  } catch {
    return null
  }
}

/**
 * 상위 maxItems개 finding만 grounding(지연 제한). 반환 배열은 입력 순서와 정렬되며,
 * 실패/범위 밖이면 null.
 */
export async function fetchUsGroundsBatch(
  items: GroundQuery[],
  maxItems = 5
): Promise<(UsLegalGrounds | null)[]> {
  const targets = items.slice(0, maxItems)
  const results = await Promise.all(targets.map(fetchOne))
  // 입력 길이에 맞춰 패딩
  return items.map((_, i) => (i < results.length ? results[i] : null))
}
