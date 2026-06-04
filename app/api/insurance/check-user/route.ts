import { NextRequest, NextResponse } from "next/server"
import { saveSession } from "@/lib/session-store"
import { findRegisteredUser } from "@/lib/db/registered-user"
import { randomUUID } from "crypto"

export async function POST(req: NextRequest) {
  try {
    const { phoneNo, birthDate, userName } = await req.json()
    if (!phoneNo || !birthDate || !userName) {
      return NextResponse.json({ error: "필수 항목 누락" }, { status: 400 })
    }

    const clean = phoneNo.replace(/-/g, "")
    const existing = await findRegisteredUser(clean, birthDate)

    if (existing) {
      const sessionId = randomUUID()
      await saveSession(sessionId, {
        baseParams: {
          organization: "0001",
          userName,
          birthDate,
          telecom: "0",
          phoneNo: clean,
          authMethod: "1",
        },
        loginId: existing.id,
        loginPw: existing.pw,
        step: "done",
      })
      return NextResponse.json({ found: true, sessionId })
    }

    return NextResponse.json({ found: false })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "서버 오류"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
