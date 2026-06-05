import { createHash } from "node:crypto"
import { eq } from "drizzle-orm"
import { getDb } from "./client"
import { analysisCache } from "./schema"

/**
 * 분석 결과 content-hash 캐시. 같은 문서(+프로필)에 대한 LLM 재호출을 막아 토큰을 절감한다.
 *
 * 주의: DATABASE_URL 미설정/쿼리 실패 시 캐시는 graceful degrade(null/no-op)하고 분석은
 * 평소대로 진행한다 — 캐시는 최적화일 뿐 정확성에 필수가 아니다.
 */

// 모델·프롬프트가 바뀌면 키가 달라져 자동 무효화된다. 프롬프트/스키마 변경 시 올린다.
const CACHE_VERSION = "v1-2026-06"

/** 문서 + 프로필을 한 키로 해시. kind는 "kr" | "card" | "loan". */
export function analysisCacheKey(
  kind: string,
  contractText: string,
  profileKey: string
): string {
  return createHash("sha256")
    .update(`${kind} ${CACHE_VERSION} ${profileKey} ${contractText}`)
    .digest("hex")
}

/** 캐시 조회. 미스/오류면 null. */
export async function getCachedReport(cacheKey: string): Promise<unknown | null> {
  try {
    const rows = await getDb()
      .select({ reportJson: analysisCache.reportJson })
      .from(analysisCache)
      .where(eq(analysisCache.cacheKey, cacheKey))
      .limit(1)
    if (!rows.length) return null
    return JSON.parse(rows[0].reportJson)
  } catch (error) {
    console.warn("[analysis-cache] get skipped:", error instanceof Error ? error.message : error)
    return null
  }
}

/** 캐시 저장(멱등). 오류는 무시 — 분석 흐름을 막지 않는다. */
export async function saveCachedReport(cacheKey: string, report: unknown): Promise<void> {
  try {
    await getDb()
      .insert(analysisCache)
      .values({ cacheKey, reportJson: JSON.stringify(report) })
      .onConflictDoNothing()
  } catch (error) {
    console.warn("[analysis-cache] save skipped:", error instanceof Error ? error.message : error)
  }
}
