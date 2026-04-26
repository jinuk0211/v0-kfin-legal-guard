import { NextResponse } from "next/server"
import { promises as fs } from "fs"
import path from "path"

export async function GET() {
  try {
    const manifestPath = path.join(process.cwd(), "public", "contracts", "manifest.json")
    const manifestContent = await fs.readFile(manifestPath, "utf-8")
    const manifest = JSON.parse(manifestContent)
    
    return NextResponse.json(manifest)
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to load contracts manifest" },
      { status: 500 }
    )
  }
}
