"use client"

import { useState } from "react"
import type { CardReport, CardFinding } from "@/lib/card-schemas"
import {
  CARD_TAXONOMY,
  CARD_SEVERITY_COLORS,
  CARD_RISK_LEVEL_COLORS,
} from "@/lib/card-schemas"
import { cn } from "@/lib/utils"

interface CardReportProps {
  report: CardReport
  onReset: () => void
}

const PRIORITY_LABELS: Record<string, string> = {
  immediate: "즉시",
  "pre-signing": "가입 전",
  optional: "선택",
}

function SeverityBadge({ severity }: { severity?: string }) {
  if (!severity) return null
  const colors = CARD_SEVERITY_COLORS[severity] ?? { bg: "bg-muted", text: "text-foreground" }
  return (
    <span
      className={cn(
        "inline-block px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider",
        colors.bg,
        colors.text
      )}
    >
      {severity}
    </span>
  )
}

function FindingCard({ finding, index }: { finding: CardFinding; index: number }) {
  const [open, setOpen] = useState(false)
  const tax = CARD_TAXONOMY[finding.taxonomy]
  const taxLabel = tax?.label ?? finding.taxonomy
  const precedents = finding.legal_grounds?.precedents ?? []
  const statutes = finding.legal_grounds?.statutes ?? []

  return (
    <div className="border border-border bg-background">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-start gap-4 p-4 text-left transition-colors hover:bg-muted/50"
      >
        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center bg-primary text-sm font-bold text-primary-foreground">
          {index + 1}
        </div>
        <div className="flex-1">
          <div className="mb-1 flex flex-wrap items-center gap-2">
            <SeverityBadge severity={finding.severity} />
            <span className="text-xs font-bold text-primary">{finding.taxonomy}</span>
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
              {taxLabel}
            </span>
          </div>
          <p className="text-sm font-medium leading-relaxed text-foreground">{finding.title}</p>
        </div>
        <div className="flex-shrink-0 text-muted-foreground">{open ? "−" : "+"}</div>
      </button>

      {open && (
        <div className="border-t border-border px-4 pb-4 pt-4">
          {/* Verbatim trigger clause */}
          <div className="mb-4">
            <h4 className="mb-1 text-[10px] uppercase tracking-wider text-muted-foreground">
              Clause (verbatim)
            </h4>
            <blockquote className="border-l-2 border-primary bg-muted/30 px-3 py-2 text-sm leading-relaxed text-foreground">
              {finding.triggered_by}
            </blockquote>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {finding.plain_language_explanation && (
              <div>
                <h4 className="mb-1 text-[10px] uppercase tracking-wider text-muted-foreground">
                  What it means
                </h4>
                <p className="text-sm leading-relaxed text-foreground">
                  {finding.plain_language_explanation}
                </p>
              </div>
            )}
            {finding.user_impact && (
              <div>
                <h4 className="mb-1 text-[10px] uppercase tracking-wider text-muted-foreground">
                  Impact on you
                </h4>
                <p className="text-sm leading-relaxed text-foreground">{finding.user_impact}</p>
              </div>
            )}
          </div>

          {finding.estimated_risk_scenario && (
            <div className="mt-4">
              <h4 className="mb-1 text-[10px] uppercase tracking-wider text-muted-foreground">
                Risk scenario
              </h4>
              <p className="text-sm leading-relaxed text-foreground">
                {finding.estimated_risk_scenario}
              </p>
            </div>
          )}

          {/* Legal grounds */}
          {(statutes.length > 0 || precedents.length > 0) && (
            <div className="mt-4 border border-border bg-muted/20 p-3">
              <h4 className="mb-2 text-[10px] uppercase tracking-wider text-muted-foreground">
                Legal grounds
              </h4>
              {statutes.length > 0 && (
                <div className="mb-2 flex flex-wrap gap-1.5">
                  {statutes.map((s, i) => (
                    <span
                      key={i}
                      className="border border-border bg-background px-2 py-0.5 text-[10px] text-foreground"
                    >
                      {s.law_name} · {s.article}
                    </span>
                  ))}
                </div>
              )}
              {precedents.length > 0 && (
                <ul className="space-y-1">
                  {precedents.map((p, i) => (
                    <li key={i} className="text-xs leading-relaxed">
                      {p.url ? (
                        <a
                          href={p.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline"
                        >
                          {p.case_name}
                        </a>
                      ) : (
                        <span className="text-foreground">{p.case_name}</span>
                      )}
                      <span className="text-muted-foreground">
                        {p.court ? ` · ${p.court}` : ""}
                        {p.date ? ` · ${p.date}` : ""}
                        {typeof p.relevance_score === "number"
                          ? ` · 관련도 ${Math.round(p.relevance_score * 100)}%`
                          : ""}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {/* Recommended actions */}
          {finding.recommended_actions && finding.recommended_actions.length > 0 && (
            <div className="mt-4">
              <h4 className="mb-2 text-[10px] uppercase tracking-wider text-muted-foreground">
                Recommended actions
              </h4>
              <div className="space-y-2">
                {finding.recommended_actions.map((a, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-3 border-l-2 border-primary bg-muted/30 py-2 pl-3 pr-4"
                  >
                    <span className="mt-0.5 inline-block bg-muted px-1.5 py-0.5 text-[9px] font-medium uppercase text-foreground">
                      {PRIORITY_LABELS[a.priority] ?? a.priority}
                    </span>
                    <div className="text-sm text-foreground">
                      {a.action}
                      {a.contact && (
                        <span className="block text-[11px] text-muted-foreground">{a.contact}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="mt-4 flex flex-wrap items-center gap-4 text-[10px] text-muted-foreground">
            <span>
              검증:{" "}
              <span
                className={
                  finding.status === "CONFIRMED"
                    ? "font-medium text-green-600"
                    : "font-medium text-yellow-600"
                }
              >
                {finding.status === "CONFIRMED" ? "판례 확인됨" : "확인 필요"}
              </span>
            </span>
            {typeof finding.confidence === "number" && (
              <span>
                신뢰도:{" "}
                <span className="font-medium tabular-nums text-foreground">
                  {Math.round(finding.confidence * 100)}%
                </span>
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export function CardReportView({ report, onReset }: CardReportProps) {
  const vc = report.vulnerability_count
  const productLabel = report.product.replace(/_/g, " ")

  return (
    <div className="animate-slide-up mx-auto max-w-5xl px-6 py-10 sm:px-12">
      {/* Header */}
      <div className="mb-8 flex items-start justify-between border-b-2 border-foreground pb-6">
        <div>
          <div className="mb-2 flex flex-wrap items-center gap-3">
            <span className="bg-primary px-3 py-1 text-[10px] font-medium uppercase tracking-wider text-primary-foreground">
              US Credit Card
            </span>
            {report.overall_risk_level && (
              <span
                className={cn(
                  "text-sm font-bold",
                  CARD_RISK_LEVEL_COLORS[report.overall_risk_level]
                )}
              >
                Risk: {report.overall_risk_level}
              </span>
            )}
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
              {report.source === "precomputed" ? "사전 분석" : "실시간 분석"}
            </span>
          </div>
          <h1 className="font-serif text-2xl font-bold text-foreground sm:text-3xl">
            {productLabel}
          </h1>
          {report.user_profile?.id && (
            <p className="mt-1 text-sm text-muted-foreground">
              페르소나 {report.user_profile.id}
              {report.user_profile.occupation ? ` · ${report.user_profile.occupation}` : ""}
              {report.user_profile.risk_flags && report.user_profile.risk_flags.length > 0
                ? ` · ${report.user_profile.risk_flags.join(", ")}`
                : ""}
            </p>
          )}
        </div>
        <button
          onClick={onReset}
          className="flex-shrink-0 border border-border bg-transparent px-4 py-2 text-[10px] uppercase tracking-wider text-muted-foreground transition-colors hover:border-foreground hover:text-foreground"
        >
          목록으로
        </button>
      </div>

      {/* Stat strip */}
      <div className="mb-8 grid grid-cols-3 gap-4 md:grid-cols-5">
        {[
          { label: "Total", value: report.findings.length, color: "text-foreground" },
          { label: "Critical", value: vc.CRITICAL, color: "text-red-600" },
          { label: "High", value: vc.HIGH, color: "text-orange-500" },
          { label: "Medium", value: vc.MEDIUM, color: "text-yellow-600" },
          { label: "Uncategorized", value: vc.uncategorized, color: "text-muted-foreground" },
        ].map((s) => (
          <div key={s.label} className="border border-border bg-background p-4">
            <div className={cn("text-3xl font-bold tabular-nums", s.color)}>{s.value}</div>
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
              {s.label}
            </div>
          </div>
        ))}
      </div>

      {/* Executive summary */}
      {report.executive_summary && (
        <div className="mb-8 border-l-4 border-primary bg-muted/30 p-6">
          <h2 className="mb-2 text-[10px] uppercase tracking-wider text-muted-foreground">
            Executive Summary
          </h2>
          <p className="text-sm leading-relaxed text-foreground">{report.executive_summary}</p>
        </div>
      )}

      {/* Findings */}
      <div className="mb-8">
        <h2 className="mb-4 flex items-baseline gap-3 border-b border-border pb-3 font-serif text-xl font-bold text-foreground">
          Detected clauses
          <span className="text-sm font-normal text-muted-foreground">
            ({report.findings.length})
          </span>
        </h2>
        {report.findings.length > 0 ? (
          <div className="space-y-3">
            {report.findings.map((f, i) => (
              <FindingCard key={f.finding_id} finding={f} index={i} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4 border border-border bg-background p-8 text-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/report-empty.png" alt="" className="h-32 w-32 opacity-90" />
            <p className="text-sm text-muted-foreground">No adverse clauses detected.</p>
          </div>
        )}
      </div>

      {/* General recommendations */}
      {report.general_recommendations.length > 0 && (
        <div className="mb-8 border border-border bg-muted/20 p-5">
          <h2 className="mb-2 text-[10px] uppercase tracking-wider text-muted-foreground">
            General recommendations
          </h2>
          <ul className="space-y-1.5">
            {report.general_recommendations.map((r, i) => (
              <li key={i} className="flex gap-2 text-sm leading-relaxed text-foreground">
                <span className="text-primary">•</span>
                {r}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Disclaimer */}
      <div className="border-t border-border pt-6 text-[10px] leading-relaxed text-muted-foreground">
        <span className="font-medium uppercase tracking-wider">Disclaimer:</span>{" "}
        {report.disclaimer}
      </div>
    </div>
  )
}
