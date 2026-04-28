import { NextRequest, NextResponse } from "next/server"
import { codefPost, rsaEncrypt } from "@/lib/codef-client"
import { getSession, saveSession } from "@/lib/session-store"

export async function POST(req: NextRequest) {
  try {
    const { sessionId } = await req.json()
    const session = getSession(sessionId)
    console.log("[v0] Query session:", sessionId, "found:", !!session, "regId:", session?.regId, "loginId:", session?.loginId)
    if (!session) return NextResponse.json({ status: "error", error: "인증이 만료됐습니다. 처음부터 다시 시도해주세요." }, { status: 400 })

    const params = {
      organization: "0001",
      id: session.loginId || session.finalId || session.regId || "",
      password: rsaEncrypt(session.loginPw || session.finalPw || session.regPw || ""),
      type: "0",
      userName: session.baseParams.userName,
      birthDate: session.baseParams.birthDate,
      phoneNo: session.baseParams.phoneNo,
      telecom: session.baseParams.telecom,
      authMethod: session.baseParams.authMethod,
      timeOut: "170",
    }

    const result = await codefPost("/v1/kr/insurance/0001/credit4u/contract-info", params)
    const code = result?.result?.code
    
    console.log("[v0] Query result code:", code, "message:", result?.result?.message)

    if (code === "CF-03002") {
      const extraInfo = result?.data?.extraInfo || {}
      saveSession(sessionId, {
        queryTwoWayInfo: {
          jobIndex: result?.data?.jobIndex ?? 0,
          threadIndex: result?.data?.threadIndex ?? 0,
          jti: result?.data?.jti ?? "",
          twoWayTimestamp: result?.data?.twoWayTimestamp ?? Date.now(),
        },
        queryParams: params,
      })
      return NextResponse.json({ status: "need_auth", sessionId, authMethod: session.baseParams.authMethod, extraInfo })
    }

    if (code === "CF-00000") {
      return NextResponse.json({ status: "success", data: result?.data })
    }

    return NextResponse.json({ status: "error", error: result?.result?.message, code }, { status: 400 })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "서버 오류"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
