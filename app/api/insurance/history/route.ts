import { NextRequest, NextResponse } from "next/server"
import { deriveUserKey } from "@/lib/user-key"
import { listQueryHistory, getQueryHistoryItem } from "@/lib/db/history"

// POST { phone, birth }        → 해당 사용자의 조회 이력 요약 목록
// POST { phone, birth, id }    → 해당 이력 단건(복호화된 전체 결과)
export async function POST(req: NextRequest) {
  try {
    const { phone, birth, id } = await req.json()
    if (!phone || !birth) {
      return NextResponse.json({ error: "전화번호와 생년월일이 필요합니다." }, { status: 400 })
    }
    const userKey = deriveUserKey(String(phone), String(birth))

    if (id) {
      const data = await getQueryHistoryItem(String(id), userKey)
      if (!data) return NextResponse.json({ error: "이력을 찾을 수 없습니다." }, { status: 404 })
      return NextResponse.json({ data })
    }

    const items = await listQueryHistory(userKey)
    return NextResponse.json({ items })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "서버 오류"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
