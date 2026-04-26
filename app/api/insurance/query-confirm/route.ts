import { NextRequest, NextResponse } from "next/server"
import { codefPost } from "@/lib/codef-client"
import { getSession } from "@/lib/session-store"

export async function POST(req: NextRequest) {
  try {
    const { sessionId, smsAuthNo } = await req.json()
    const session = getSession(sessionId)
    if (!session) return NextResponse.json({ error: "세션 만료." }, { status: 404 })

    const params = {
      ...session.queryParams,
      smsAuthNo: smsAuthNo || "",
      simpleAuth: "1",
      is2Way: true,
      twoWayInfo: session.queryTwoWayInfo,
    }

    const result = await codefPost("/v1/kr/insurance/0001/credit4u/contract-info", params)
    const code = result?.result?.code

    if (code === "CF-03002" || code === "CF-03003") return NextResponse.json({ status: "pending" })
    if (code === "CF-00000") return NextResponse.json({ status: "success", data: result?.data })

    return NextResponse.json({ status: "error", error: result?.result?.message, code }, { status: 400 })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "서버 오류"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
