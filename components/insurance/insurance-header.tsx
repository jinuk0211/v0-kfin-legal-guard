import Link from "next/link"

export function InsuranceHeader() {
  return (
    <header className="sticky top-0 z-50 border-b-2 border-foreground bg-background">
      <div className="mx-auto flex h-14 max-w-lg items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-3">
          <span className="font-serif text-lg font-bold text-foreground">KFin</span>
          <span className="font-serif text-lg font-bold text-primary">Legal</span>
          <span className="hidden text-[10px] uppercase tracking-wider text-muted-foreground sm:block">
            내보험 조회
          </span>
        </Link>
        <span className="border border-foreground/20 bg-muted px-2.5 py-1 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
          CODEF
        </span>
      </div>
    </header>
  )
}
