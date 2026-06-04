import { drizzle } from "drizzle-orm/neon-http"
import { neon } from "@neondatabase/serverless"
import * as schema from "./schema"

type DB = ReturnType<typeof drizzle<typeof schema>>

let _db: DB | null = null

/** 지연 초기화 — DATABASE_URL이 없을 때 import 시점이 아니라 쿼리 시점에 실패시킨다. */
export function getDb(): DB {
  if (_db) return _db
  const url = process.env.DATABASE_URL
  if (!url) {
    throw new Error("DATABASE_URL 환경변수가 설정되지 않았습니다.")
  }
  _db = drizzle(neon(url), { schema })
  return _db
}
