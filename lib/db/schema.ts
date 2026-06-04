import { pgTable, uuid, text, integer, timestamp, index } from "drizzle-orm/pg-core"

/** 보험 조회 이력 — 전체 결과는 payloadCipher에 암호화 저장, 평문 컬럼은 최소. */
export const insuranceQueryHistory = pgTable(
  "insurance_query_history",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userKey: text("user_key").notNull(),
    queriedAt: timestamp("queried_at", { withTimezone: true }).defaultNow().notNull(),
    env: text("env").notNull(),
    nameMasked: text("name_masked"),
    contractCount: integer("contract_count").notNull().default(0),
    totalPremium: integer("total_premium").notNull().default(0),
    payloadCipher: text("payload_cipher").notNull(),
  },
  (t) => ({
    userKeyIdx: index("iqh_user_key_idx").on(t.userKey),
  })
)

/** CODEF 멀티스텝 인증 세션 — 서버리스 다중 인스턴스 대응(메모리 Map 대체). 전체 암호화. */
export const codefSession = pgTable("codef_session", {
  id: text("id").primaryKey(),
  dataCipher: text("data_cipher").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
})

/** 등록 완료 사용자 — 같은 정보 재입력 시 재인증 없이 바로 조회. 자격증명은 암호화 저장. */
export const registeredUser = pgTable("registered_user", {
  userKey: text("user_key").primaryKey(),
  credCipher: text("cred_cipher").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
})
