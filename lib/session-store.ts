/**
 * In-memory session store for CODEF multi-step auth flow.
 * Each session auto-expires after 20 minutes.
 */

export interface CodefSession {
  baseParams: Record<string, unknown>
  twoWayInfo?: Record<string, unknown>
  queryTwoWayInfo?: Record<string, unknown>
  queryParams?: Record<string, unknown>
  step: "start" | "captcha" | "sms_or_pass" | "reg_info" | "email_auth" | "done"
  regId?: string
  regPw?: string
  regEmail?: string
  finalId?: string
  finalPw?: string
  finalEmail?: string
  loginId?: string
  loginPw?: string
  updatedAt?: number
}

const sessions = new Map<string, CodefSession>()

export function getSession(id: string): CodefSession | undefined {
  return sessions.get(id)
}

export function saveSession(id: string, patch: Partial<CodefSession>): CodefSession {
  const existing = sessions.get(id) ?? ({} as CodefSession)
  const updated: CodefSession = { ...existing, ...patch, updatedAt: Date.now() }
  sessions.set(id, updated)
  // Auto-expire after 20 minutes
  setTimeout(() => sessions.delete(id), 20 * 60 * 1000)
  return updated
}

export function deleteSession(id: string): void {
  sessions.delete(id)
}
