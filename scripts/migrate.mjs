// 비대화형 마이그레이션 적용: drizzle/ 폴더의 생성된 SQL을 Neon에 적용한다.
import { readFileSync } from "fs"
import { neon } from "@neondatabase/serverless"
import { drizzle } from "drizzle-orm/neon-http"
import { migrate } from "drizzle-orm/neon-http/migrator"

// .env.local 수동 로드
const env = readFileSync(".env.local", "utf8")
for (const line of env.split(/\r?\n/)) {
  const m = line.match(/^([A-Z_]+)=(.*)$/)
  if (m) process.env[m[1]] = m[2]
}

const url = process.env.DATABASE_URL
if (!url) throw new Error("DATABASE_URL 없음")

const db = drizzle(neon(url))
await migrate(db, { migrationsFolder: "./drizzle" })
console.log("✓ 마이그레이션 적용 완료")
