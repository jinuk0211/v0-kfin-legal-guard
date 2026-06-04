// Client-safe demo metadata (no JSON imports, safe to use in the browser bundle).
// Mirrors the precomputed FinLegal-Harness runs available under data/analyses.

export type ProductKey =
  | "kb-chakhan"
  | "kyobo-tonghap"
  | "samsung-bigaengsin"
  | "shinhan-sol"
  | "hanwha-e"

export type ProfileId = "profile1" | "profile2"

export const DEMO_PROFILES: { id: ProfileId; name: string; summary: string }[] = [
  { id: "profile1", name: "김민준", summary: "42세 · 고혈압 · 위암 가족력" },
  { id: "profile2", name: "이수진", summary: "55세 · 당뇨/고지혈증 · 유방암 가족력" },
]

export const PRECOMPUTED_PRODUCTS: { key: ProductKey; label: string; company: string }[] = [
  { key: "kb-chakhan", label: "KB 착한암보험", company: "KB라이프생명" },
  { key: "kyobo-tonghap", label: "교보 통합암보험", company: "교보생명" },
  { key: "samsung-bigaengsin", label: "삼성 인터넷 비갱신암보험", company: "삼성생명" },
  { key: "shinhan-sol", label: "신한 SOL암보험", company: "신한라이프" },
  { key: "hanwha-e", label: "한화생명 e암보험", company: "한화생명" },
]
