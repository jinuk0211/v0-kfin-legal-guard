import type { CardReport, CardProductKey } from "./card-schemas"
import { normalizeCardReport } from "./card-normalize"

export type { CardProductKey } from "./card-schemas"
export { CARD_PRODUCTS } from "./card-schemas"

// Precomputed FinLegal-Harness T2 runs (logic/eval_US_card/.../workspace_us),
// copied into the app so they ship with the serverless function.
// Keyed by `${productKey}__${personaId}`.
import midfirst_p01 from "@/data/cards/midfirst-rewards__P01.json"
import midfirst_p02 from "@/data/cards/midfirst-rewards__P02.json"
import midfirst_p03 from "@/data/cards/midfirst-rewards__P03.json"
import apg_agr_p01 from "@/data/cards/apgfcu-agreement__P01.json"
import apg_agr_p02 from "@/data/cards/apgfcu-agreement__P02.json"
import apg_agr_p03 from "@/data/cards/apgfcu-agreement__P03.json"
import apg_dis_p01 from "@/data/cards/apgfcu-disclosure__P01.json"
import apg_dis_p02 from "@/data/cards/apgfcu-disclosure__P02.json"
import apg_dis_p03 from "@/data/cards/apgfcu-disclosure__P03.json"

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const INDEX: Record<string, any> = {
  "midfirst-rewards__P01": midfirst_p01,
  "midfirst-rewards__P02": midfirst_p02,
  "midfirst-rewards__P03": midfirst_p03,
  "apgfcu-agreement__P01": apg_agr_p01,
  "apgfcu-agreement__P02": apg_agr_p02,
  "apgfcu-agreement__P03": apg_agr_p03,
  "apgfcu-disclosure__P01": apg_dis_p01,
  "apgfcu-disclosure__P02": apg_dis_p02,
  "apgfcu-disclosure__P03": apg_dis_p03,
}

// Keyword rules to map an arbitrary product string to a precomputed key.
const PRODUCT_RULES: { key: CardProductKey; all?: string[]; any: string[] }[] = [
  { key: "midfirst-rewards", any: ["midfirst"] },
  { key: "apgfcu-agreement", all: ["apgfcu"], any: ["agreement"] },
  { key: "apgfcu-disclosure", all: ["apgfcu"], any: ["disclosure"] },
]

export function matchCardProduct(raw?: string): CardProductKey | null {
  if (!raw) return null
  const s = raw.toLowerCase().replace(/[_\s]+/g, "")
  for (const rule of PRODUCT_RULES) {
    const allOk = (rule.all ?? []).every((t) => s.includes(t))
    const anyOk = rule.any.some((t) => s.includes(t))
    if (allOk && anyOk) return rule.key
  }
  return null
}

function normalizePersona(raw?: string): string {
  const v = String(raw ?? "").toUpperCase()
  return v === "P01" || v === "P02" || v === "P03" ? v : "P01"
}

// Returns a precomputed card report when the product resolves (persona defaults to P01).
export function getCardReport(product?: string, personaId?: string): CardReport | null {
  const key = matchCardProduct(product)
  if (!key) return null
  const pid = normalizePersona(personaId)
  const raw = INDEX[`${key}__${pid}`]
  return raw ? normalizeCardReport(raw, "precomputed") : null
}
