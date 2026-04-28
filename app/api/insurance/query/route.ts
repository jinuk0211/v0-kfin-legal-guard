import { NextRequest, NextResponse } from "next/server"
import { codefPost, rsaEncrypt } from "@/lib/codef-client"
import { getSession, saveSession } from "@/lib/session-store"
import { randomUUID } from "crypto"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { sessionId, userName, birthDate, phoneNo, telecom, regId, regPw } = body
    
    let params: Record<string, string>
    let session = sessionId ? getSession(sessionId) : null
    
    // Direct query with credentials (for saved users)
    if (!session && regId && regPw) {
      params = {
        organization: "0001",
        id: regId,
        password: rsaEncrypt(regPw),
        type: "0",
        userName: userName || "",
        birthDate: birthDate || "",
        phoneNo: phoneNo || "",
        telecom: telecom || "0",
        authMethod: "1",
        timeOut: "170",
      }
    } else if (session) {
      params = {
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
    } else {
      return NextResponse.json({ status: "error", error: "인증이 만료됐습니다. 처음부터 다시 시도해주세요." }, { status: 400 })
    }

    const result = await codefPost("/v1/kr/insurance/0001/credit4u/contract-info", params)
    const code = result?.result?.code

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
