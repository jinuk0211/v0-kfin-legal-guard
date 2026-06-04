// Client-safe helpers to resolve an arbitrary insurance product name (e.g. from
// a CODEF query) to a bundled contract .txt in public/contracts.

export interface ManifestContract {
  id: string
  company: string
  name: string
  file: string
}

interface Manifest {
  암보험?: ManifestContract[]
}

function normalize(s: string): string {
  return s
    .replace(/\(무\)|\(무배당\)|무배당/g, "")
    .replace(/[()[\]{}_\-+\s·,.]/g, "")
    .toLowerCase()
}

// Count shared 2-gram character overlap as a cheap similarity proxy.
function bigramOverlap(a: string, b: string): number {
  if (a.length < 2 || b.length < 2) return 0
  const grams = new Set<string>()
  for (let i = 0; i < a.length - 1; i++) grams.add(a.slice(i, i + 2))
  let hits = 0
  for (let i = 0; i < b.length - 1; i++) {
    if (grams.has(b.slice(i, i + 2))) hits++
  }
  return hits
}

export function matchManifestContract(
  manifest: Manifest,
  productName: string,
  companyName?: string
): ManifestContract | null {
  const list = manifest.암보험 ?? []
  if (list.length === 0) return null

  const nName = normalize(productName)
  const nCompany = companyName ? normalize(companyName) : ""

  let best: { c: ManifestContract; score: number } | null = null
  for (const c of list) {
    const candName = normalize(c.name)
    const candCompany = normalize(c.company)

    let score = bigramOverlap(nName, candName)
    // Company agreement is a strong signal.
    if (nCompany && (candCompany.includes(nCompany) || nCompany.includes(candCompany))) {
      score += 5
    }
    if (!best || score > best.score) best = { c, score }
  }

  // Require a minimum confidence to avoid arbitrary matches.
  return best && best.score >= 4 ? best.c : null
}
