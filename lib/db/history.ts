import { eq, and, desc } from "drizzle-orm"
import { getDb } from "./client"
import { insuranceQueryHistory } from "./schema"
import { encryptJson, decryptJson } from "@/lib/crypto"
import { deriveUserKey, maskName } from "@/lib/user-key"
import { getCodefEnv } from "@/lib/codef-client"

interface Contract {
  resPremium?: unknown
  resContractStatus?: string
}

interface QueryData {
  resFlatRateContractList?: Contract[]
  resActualLossContractList?: Contract[]
}

function summarize(data: QueryData): { count: number; totalPremium: number } {
  const all = [...(data?.resFlatRateContractList ?? []), ...(data?.resActualLossContractList ?? [])]
  const active = all.filter((c) => c.resContractStatus === "정상")
  const totalPremium = active.reduce((sum, c) => {
    const p = parseInt(String(c.resPremium ?? 0).replace(/[^0-9]/g, ""))
    return sum + (isNaN(p) ? 0 : p)
  }, 0)
  return { count: active.length, totalPremium }
}

interface BaseParams {
  userName?: unknown
  birthDate?: unknown
  phoneNo?: unknown
}

/** 조회 성공 시 호출. 전체 결과를 암호화해 저장한다. */
export async function saveQueryHistory(baseParams: BaseParams, data: unknown): Promise<void> {
  const userKey = deriveUserKey(
    String(baseParams.phoneNo ?? ""),
    String(baseParams.birthDate ?? "")
  )
  const { count, totalPremium } = summarize((data ?? {}) as QueryData)
  await getDb()
    .insert(insuranceQueryHistory)
    .values({
      userKey,
      env: getCodefEnv(),
      nameMasked: maskName(String(baseParams.userName ?? "")),
      contractCount: count,
      totalPremium,
      payloadCipher: encryptJson(data),
    })
}

export interface HistorySummary {
  id: string
  queriedAt: string
  env: string
  nameMasked: string | null
  contractCount: number
  totalPremium: number
}

export async function listQueryHistory(userKey: string): Promise<HistorySummary[]> {
  const rows = await getDb()
    .select({
      id: insuranceQueryHistory.id,
      queriedAt: insuranceQueryHistory.queriedAt,
      env: insuranceQueryHistory.env,
      nameMasked: insuranceQueryHistory.nameMasked,
      contractCount: insuranceQueryHistory.contractCount,
      totalPremium: insuranceQueryHistory.totalPremium,
    })
    .from(insuranceQueryHistory)
    .where(eq(insuranceQueryHistory.userKey, userKey))
    .orderBy(desc(insuranceQueryHistory.queriedAt))
    .limit(50)
  return rows.map((r) => ({ ...r, queriedAt: r.queriedAt.toISOString() }))
}

/** userKey가 일치할 때만 복호화 반환 (다른 사용자 이력 열람 차단). */
export async function getQueryHistoryItem(id: string, userKey: string): Promise<unknown | null> {
  const rows = await getDb()
    .select({ payloadCipher: insuranceQueryHistory.payloadCipher })
    .from(insuranceQueryHistory)
    .where(and(eq(insuranceQueryHistory.id, id), eq(insuranceQueryHistory.userKey, userKey)))
    .limit(1)
  if (!rows.length) return null
  return decryptJson(rows[0].payloadCipher)
}
