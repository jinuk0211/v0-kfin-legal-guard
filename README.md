# v0-kfin-legal-guard

This is a [Next.js](https://nextjs.org) project bootstrapped with [v0](https://v0.app).

## Built with v0

This repository is linked to a [v0](https://v0.app) project. You can continue developing by visiting the link below -- start new chats to make changes, and v0 will push commits directly to this repo. Every merge to `main` will automatically deploy.

[Continue working on v0 →](https://v0.app/chat/projects/prj_8pu2AsD2iAx9S1atCLUj1UpIXTzv)

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

## Learn More

To learn more, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.
- [v0 Documentation](https://v0.app/docs) - learn about v0 and how to use it.

<a href="https://v0.app/chat/api/kiro/clone/jinuk0211/v0-kfin-legal-guard" alt="Open in Kiro"><img src="https://pdgvvgmkdvyeydso.public.blob.vercel-storage.com/open%20in%20kiro.svg?sanitize=true" /></a>

version 0.1.0

● 모든 페이지 200 OK, 히어로 이미지 연결 확인, 테스트 스크립트 정리, 서버 종료 완료. 작업 상태를 마감합니다.

● 완료했습니다. 프론트엔드/백엔드를 logic/의 실제 하네스(FinLegal-Harness) 출력에 맞춰 정렬했습니다.

  한 일

  Phase 1 — 스키마 정렬 (v0 임의 스키마 → 하네스 출력)

- lib/schemas.ts: findings[].{vuln_id, clause_reference, severity, confidence:number} → 하네스 형식 vulnerabilities[].{taxonomy, triggered_by(원문), description,
  user_relevance, confidence:HIGH|MED|LOW, precedent_refs} + summary.{by_taxonomy, by_confidence, critical_findings, user_specific_risks} + product/profile/doc_type 메타로
  재정의.
- lib/anthropic-client.ts: 시스템 프롬프트를 Stage 2 스포터 형식으로 재작성 — taxonomy 분류, triggered_by 원문 인용, 판례 인용 금지(precedent_refs: []), 중학생 수준 서술,
  면책문구 필수. (KFinLegal 규칙 준수)
- components/vulnerability-report.tsx / contract-analyzer.tsx: 새 스키마로 렌더링 — 약관 원문 인용, 개인화 영향, 신뢰도 배지, 핵심 주의사항/프로필별 위험.

  Phase 2 — 사전계산 우선 + 라이브 폴백
- logic/analysis_results의 10개 JSON(2 프로필 × 5 상품)을 data/analyses/로 번들하고 lib/precomputed.ts 매처 생성.
- app/api/vulnerability/analyze: product+profileId 매칭 시 사전계산 제공, 없으면 라이브 Claude 호출.
- 핵심 발견 대응: 실제 산출물의 summary 블록이 파일마다 제각각(by_confidence vs high_confidence, 빈 {} 등)이었습니다. lib/normalize-report.ts를 만들어 summary를
  vulnerabilities에서 재계산하고 변형 키를 흡수 — 사전계산/라이브 양쪽에 동일 적용. 검증 결과 KB(4/4/2)·삼성(5/7/0) 등 모두 정확히 정규화됨.

  Phase 3 — 인슈어런스 조회 → 분석 연결
- /analyze 페이지 추가(딥링크로 약관 프리로드 + 자동 분석).
- step-result.tsx: 조회된 각 계약에 "이 약관 취약점 분석하기 →" 링크. CODEF 상품명을 lib/manifest-match.ts로 번들 약관에 퍼지 매칭.

  Phase 4 — gpt-image-2 일러스트
- gpt-image-2로 사이트 팔레트(크림/잉크/레드, 에디토리얼)에 맞춘 히어로 일러스트 + 빈 리포트 일러스트 생성 → 히어로 우측을 일러스트+통계 스트립으로 재구성.

  검증
- next build 성공(17 라우트), tsc 변경 파일 타입 클린(잔여 1건은 기존 node-rsa 타입 누락).
- 사전계산 5상품×2프로필 + 미매칭 400 폴백 모두 정상.

  짚어둘 점

1. ⚠️  노출된 OPENAI_API_KEY는 폐기/재발급하세요. 코드에는 하드코딩하지 않았고, ANTHROPIC 키는 .env.local(gitignore)에만 넣었습니다.
2. 라이브 분석은 Anthropic 크레딧 잔액 부족으로 현재 실패합니다(코드/환경은 정상, 빌링 문제). 크레딧 충전 시 동작합니다. 사전계산 경로는 크레딧 없이 동작합니다.
3. Tailwind v4가 루트의 대용량 logic/(760MB)·logic.zip(559MB)을 스캔하다 빌드가 깨져, globals.css에 source(none) + 명시적 @source로 스캔 범위를 앱 코드로 한정했습니다. 배포
   시 logic/·logic.zip은 .gitignore에 추가하길 권장합니다(앱 런타임엔 불필요 — 필요한 JSON은 data/로 복사됨).

v 0.2.0


 Here is Claude's plan:╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌
 Plan: US 대출(US_loan_corpus) 분석 페이지 추가
 Context

 앱에는 이미 3개 트랙이 있다: 한국 약관(/), 내보험 조회(/insurance), 미국 카드(/cards).
 public/us_loan_corpus/에는 SEC EDGAR에서 수집한 미국 대출/신용계약서 .txt 250+건과
 _manifest.jsonl이 있고, logic/에는 us_loan 평가 결과(taxonomy LOAN-01~05)가 있으나
 프런트엔드 페이지·API·lib·사전계산 리포트가 전혀 없다.

 사용자 요청: US_loan_corpus용 새 페이지를 /cards와 같은 구조로 만들되 —

1. gpt-image-2 생성 이미지를 **전면 배경(full-bleed)**으로 사용
2. 이미지는 스크립트만 작성(나중에 사용자가 OPENAI_API_KEY로 직접 생성)
3. 분석 진입부를 insurance '분석설정' 스타일(중앙 정렬 카드형 레이아웃)로 — 신규 대출 페이지에만 적용
4. 분석 파이프라인은 대출 전용으로 신규 구축(LOAN-01~05, 사전계산 없음 → 라이브 분석)

 결정사항 (사용자 확정)

 ┌───────────────────────┬──────────────────────────────────────────────────────────────────────┐
 │         항목          │                                 결정                                 │
 ├───────────────────────┼──────────────────────────────────────────────────────────────────────┤
 │ 배경 이미지           │ 전면 배경(full-bleed) + 가독성 위해 cream/ink 스크림 오버레이        │
 ├───────────────────────┼──────────────────────────────────────────────────────────────────────┤
 │ 이미지 생성           │ 스크립트만 작성, public/loans-hero.png 경로 참조(없으면 배경색 폴백) │
 ├───────────────────────┼──────────────────────────────────────────────────────────────────────┤
 │ insurance 스타일 적용 │ 신규 /loans 페이지만 (카드/기존 페이지 미변경)                       │
 ├───────────────────────┼──────────────────────────────────────────────────────────────────────┤
 │ 분석 방식             │ 대출 전용 lib/api 신규 구축, 라이브 전용(사전계산 리포트 없음)       │
 └───────────────────────┴──────────────────────────────────────────────────────────────────────┘

 신규 파일

1. lib/loan-schemas.ts  (← lib/card-schemas.ts 미러)

- LOAN_TAXONOMY: LOAN-01 가속조항(acceleration triggers) / LOAN-02 MAC(중대한 부정적 변화) /
  LOAN-03 중도상환 위약금(prepayment penalty) / LOAN-04 교차채무불이행(cross-default) /
  LOAN-05 후순위(subordination) / UNCATEGORIZED — 한글 label/description.
  (라벨 출처: logic/eval_US_loan/results/us_loan_summary.json의 taxonomy)
- LOAN_SEVERITY_COLORS, LOAN_RISK_LEVEL_COLORS: 카드와 동일 팔레트 재사용.
- LOAN_DISCLAIMER: "AI 분석, 법적 효력 없음. 구체적 자문은 금융/증권 전문 변호사 상담" (영문, 카드 disclaimer 톤).
- loanAnalysisRequestSchema(zod): { contractText, product } (persona 없음).
- loanReportSchema 등 zod: 카드 스키마와 동일 형태, doc_type 기본 "loan_agreement". persona/personaId 관련 필드 제거.

2. lib/loan-normalize.ts  (← lib/card-normalize.ts 미러)

- normalizeLoanReport(raw, source): rank 정렬, vulnerability_count 재계산, 기본값 보정.
  카드 버전과 동일 로직, 기본 product/doc_type/LOAN_DISCLAIMER만 교체.

3. lib/loan-anthropic.ts  (← lib/card-anthropic.ts 미러)

- analyzeLoan(contractText): Promise`<LoanReport>` — new Anthropic(), claude-sonnet-4-20250514.
- SYSTEM_PROMPT: 미국 대출/신용계약서 감사관. LOAN-01~05 taxonomy, 가속/MAC/중도상환/교차채무/후순위 초점.
  규칙 유지(중요): triggered_by는 원문 그대로, legal_grounds.precedents/statutes는 확실하지 않으면 []
  (판례 날조 금지 — kfinlegal-rules §1). persona 섹션 제거.
- JSON 파싱 실패 시 빈 리포트 폴백(카드와 동일 패턴).

4. app/api/loans/analyze/route.ts  (← app/api/cards/analyze/route.ts 미러, 단순화)

- loanAnalysisRequestSchema.safeParse → contractText 100자 미만이면 400 →
  analyzeLoan(contractText) → { status:"success", report }. 사전계산 분기 없음.

5. components/loans/loan-report.tsx  (← components/cards/card-report.tsx 미러)

- LoanReportView: 동일 구조, LOAN_TAXONOMY/LOAN_SEVERITY_COLORS/LOAN_RISK_LEVEL_COLORS 참조,
  헤더 배지 라벨 US Loan Agreement. precomputed/persona 표기 제거(라이브 전용).

6. components/loans/loan-explorer.tsx  (insurance 스타일 핵심)

- 상태 "input" | "analyzing" | "result".
- intro/입력 화면: app/insurance/page.tsx의 welcome 카드 미학 차용 —
  중앙 정렬 max-w-lg, border border-border bg-card p-6, 번호형 단계 안내 + "분석 방식" 설명,
  그 아래 문서 선택 영역(검색 input + ticker별 그룹 목록).
- 문서 목록: fetch("/us_loan_corpus/_manifest.jsonl") → 줄 단위 파싱 →
  { issuer: ticker, name: out 파일명 가독화, file: out, date: file_date }로 매핑, ticker별 그룹·검색 필터.
  (live fetch 시 404는 graceful 에러 메시지)
- analyzing 화면: components/insurance/step-bar.tsx 스타일의 진행 표시(파싱→탐지(LOAN-01~05)→심각도/리포트).
- runLive(doc): /us_loan_corpus/{file} 텍스트 fetch → /api/loans/analyze POST → LoanReportView 렌더.

7. app/loans/page.tsx  (← app/cards/page.tsx 구조, 배경 변경)

- <Header currentView="landing" onNavigate={()=>router.push("/")} />.
- Hero(전면 배경): 상대 컨테이너 안에 `<img src="/loans-hero.png">`를 absolute inset-0 object-cover로 깔고,
  그 위 absolute inset-0 bg-background/80(또는 cream→투명 그라디언트) 스크림 → 그 위에 ink 텍스트(제목/배지/STATS).
  이미지 없을 때도 bg-background가 보이도록 폴백. STATS: LOAN-01~05, SEC EDGAR, 라이브 분석 등.
- 하단 `<LoanExplorer />`.

 수정 파일

8. components/header.tsx

- 기존 "미국 카드 분석" `<Link href="/cards">` 다음에 `<Link href="/loans">`미국 대출 분석`</Link>` 추가
  (동일 className 패턴).

9. scripts/gen_card_images.py (JOBS 배열에 loan 잡 추가; 또는 신규 scripts/gen_loan_images.py)

- {"out":"public/loans-hero.png", "size":"1536x1024", "prompt": 대출계약서 감사 테마} 추가.
  배경용이므로 가로형 1536x1024, 기존 PALETTE(cream/ink/accent-red, 텍스트 없음) 재사용.
  모티프: 대출계약 문서 더미·악수/저울·돋보기로 fine print 검토하는 Swiss/Bauhaus 플랫 일러스트.

 재사용 (신규 작성 금지)

- 팔레트/배지/리포트 마크업: components/cards/card-report.tsx, lib/card-schemas.ts 그대로 미러.
- 진행 표시 미학: components/insurance/step-bar.tsx, app/insurance/page.tsx welcome 카드.
- 이미지 생성 패턴: scripts/gen_card_images.py (gpt-image-2, OPENAI_API_KEY).
- 코퍼스/매니페스트: public/us_loan_corpus/_manifest.jsonl (이미 public 서빙됨, 추가 변환 불필요).

 검증
  한 가지 짚을 점: 라이브 대출 분석은 실제로 동작하려면 ANTHROPIC_API_KEY가, 배경 이미지 실제 생성은 OPENAI_API_KEY가 필요합니다. 코드/스크립트는 키 없이도 모두 작성되며, 키는
  실행 시점에만 필요합니다.

● User approved Claude's plan
  ⎿  Plan saved to: C:\Users\tgc04\.claude\plans\memoized-moseying-bachman.md · /plan to edit
     Plan: US 대출(US_loan_corpus) 분석 페이지 추가

    Context

    앱에는 이미 3개 트랙이 있다: 한국 약관(/), 내보험 조회(/insurance), 미국 카드(/cards).
     public/us_loan_corpus/에는 SEC EDGAR에서 수집한 미국 대출/신용계약서 .txt 250+건과
     _manifest.jsonl이 있고, logic/에는 us_loan 평가 결과(taxonomy LOAN-01~05)가 있으나
     프런트엔드 페이지·API·lib·사전계산 리포트가 전혀 없다.

    사용자 요청: US_loan_corpus용 새 페이지를 /cards와 같은 구조로 만들되 —
     1. gpt-image-2 생성 이미지를 **전면 배경(full-bleed)**으로 사용
     2. 이미지는 스크립트만 작성(나중에 사용자가 OPENAI_API_KEY로 직접 생성)
     3. 분석 진입부를 insurance '분석설정' 스타일(중앙 정렬 카드형 레이아웃)로 — 신규 대출 페이지에만 적용
     4. 분석 파이프라인은 대출 전용으로 신규 구축(LOAN-01~05, 사전계산 없음 → 라이브 분석)
     결정사항 (사용자 확정)
     ┌───────────────────────┬──────────────────────────────────────────────────────────────────────┐
     │         항목          │                                 결정                                 │
     ├───────────────────────┼──────────────────────────────────────────────────────────────────────┤
     │ 배경 이미지           │ 전면 배경(full-bleed) + 가독성 위해 cream/ink 스크림 오버레이        │
     ├───────────────────────┼──────────────────────────────────────────────────────────────────────┤
     │ 이미지 생성           │ 스크립트만 작성, public/loans-hero.png 경로 참조(없으면 배경색 폴백) │
     ├───────────────────────┼──────────────────────────────────────────────────────────────────────┤
     │ insurance 스타일 적용 │ 신규 /loans 페이지만 (카드/기존 페이지 미변경)                       │
     ├───────────────────────┼──────────────────────────────────────────────────────────────────────┤
     │ 분석 방식             │ 대출 전용 lib/api 신규 구축, 라이브 전용(사전계산 리포트 없음)       │
     └───────────────────────┴──────────────────────────────────────────────────────────────────────┘

    신규 파일

    1. lib/loan-schemas.ts  (← lib/card-schemas.ts 미러)

    - LOAN_TAXONOMY: LOAN-01 가속조항(acceleration triggers) / LOAN-02 MAC(중대한 부정적 변화) /
     LOAN-03 중도상환 위약금(prepayment penalty) / LOAN-04 교차채무불이행(cross-default) /
     LOAN-05 후순위(subordination) / UNCATEGORIZED — 한글 label/description.
     (라벨 출처: logic/eval_US_loan/results/us_loan_summary.json의 taxonomy)
     - LOAN_SEVERITY_COLORS, LOAN_RISK_LEVEL_COLORS: 카드와 동일 팔레트 재사용.
     - LOAN_DISCLAIMER: "AI 분석, 법적 효력 없음. 구체적 자문은 금융/증권 전문 변호사 상담" (영문, 카드 disclaimer 톤).
     - loanAnalysisRequestSchema(zod): { contractText, product } (persona 없음).
     - loanReportSchema 등 zod: 카드 스키마와 동일 형태, doc_type 기본 "loan_agreement". persona/personaId 관련 필드 제거.

    2. lib/loan-normalize.ts  (← lib/card-normalize.ts 미러)

    - normalizeLoanReport(raw, source): rank 정렬, vulnerability_count 재계산, 기본값 보정.
     카드 버전과 동일 로직, 기본 product/doc_type/LOAN_DISCLAIMER만 교체.

    3. lib/loan-anthropic.ts  (← lib/card-anthropic.ts 미러)

    - analyzeLoan(contractText): Promise`<LoanReport>` — new Anthropic(), claude-sonnet-4-20250514.
     - SYSTEM_PROMPT: 미국 대출/신용계약서 감사관. LOAN-01~05 taxonomy, 가속/MAC/중도상환/교차채무/후순위 초점.
     규칙 유지(중요): triggered_by는 원문 그대로, legal_grounds.precedents/statutes는 확실하지 않으면 []
     (판례 날조 금지 — kfinlegal-rules §1). persona 섹션 제거.
     - JSON 파싱 실패 시 빈 리포트 폴백(카드와 동일 패턴).

    4. app/api/loans/analyze/route.ts  (← app/api/cards/analyze/route.ts 미러, 단순화)

    - loanAnalysisRequestSchema.safeParse → contractText 100자 미만이면 400 →
     analyzeLoan(contractText) → { status:"success", report }. 사전계산 분기 없음.

    5. components/loans/loan-report.tsx  (← components/cards/card-report.tsx 미러)

    - LoanReportView: 동일 구조, LOAN_TAXONOMY/LOAN_SEVERITY_COLORS/LOAN_RISK_LEVEL_COLORS 참조,
     헤더 배지 라벨 US Loan Agreement. precomputed/persona 표기 제거(라이브 전용).

    6. components/loans/loan-explorer.tsx  (insurance 스타일 핵심)

    - 상태 "input" | "analyzing" | "result".
     - intro/입력 화면: app/insurance/page.tsx의 welcome 카드 미학 차용 —
     중앙 정렬 max-w-lg, border border-border bg-card p-6, 번호형 단계 안내 + "분석 방식" 설명,
     그 아래 문서 선택 영역(검색 input + ticker별 그룹 목록).
     - 문서 목록: fetch("/us_loan_corpus/_manifest.jsonl") → 줄 단위 파싱 →
     { issuer: ticker, name: out 파일명 가독화, file: out, date: file_date }로 매핑, ticker별 그룹·검색 필터.
     (live fetch 시 404는 graceful 에러 메시지)
     - analyzing 화면: components/insurance/step-bar.tsx 스타일의 진행 표시(파싱→탐지(LOAN-01~05)→심각도/리포트).
     - runLive(doc): /us_loan_corpus/{file} 텍스트 fetch → /api/loans/analyze POST → LoanReportView 렌더.

    7. app/loans/page.tsx  (← app/cards/page.tsx 구조, 배경 변경)

    - <Header currentView="landing" onNavigate={()=>router.push("/")} />.
     - Hero(전면 배경): 상대 컨테이너 안에`<img src="/loans-hero.png">`를 absolute inset-0 object-cover로 깔고,
     그 위 absolute inset-0 bg-background/80(또는 cream→투명 그라디언트) 스크림 → 그 위에 ink 텍스트(제목/배지/STATS).
     이미지 없을 때도 bg-background가 보이도록 폴백. STATS: LOAN-01~05, SEC EDGAR, 라이브 분석 등.
     - 하단 `<LoanExplorer />`.

    수정 파일

    8. components/header.tsx

    - 기존 "미국 카드 분석"`<Link href="/cards">` 다음에 `<Link href="/loans">`미국 대출 분석`</Link>` 추가
     (동일 className 패턴).

    9. scripts/gen_card_images.py (JOBS 배열에 loan 잡 추가; 또는 신규 scripts/gen_loan_images.py)

    - {"out":"public/loans-hero.png", "size":"1536x1024", "prompt": 대출계약서 감사 테마} 추가.
     배경용이므로 가로형 1536x1024, 기존 PALETTE(cream/ink/accent-red, 텍스트 없음) 재사용.
     모티프: 대출계약 문서 더미·악수/저울·돋보기로 fine print 검토하는 Swiss/Bauhaus 플랫 일러스트.

    재사용 (신규 작성 금지)

    - 팔레트/배지/리포트 마크업: components/cards/card-report.tsx, lib/card-schemas.ts 그대로 미러.
     - 진행 표시 미학: components/insurance/step-bar.tsx, app/insurance/page.tsx welcome 카드.
     - 이미지 생성 패턴: scripts/gen_card_images.py (gpt-image-2, OPENAI_API_KEY).
     - 코퍼스/매니페스트: public/us_loan_corpus/_manifest.jsonl (이미 public 서빙됨, 추가 변환 불필요).

    검증

    1. pnpm dev → /loans 진입: Hero가 배경색 폴백으로라도 렌더(아직 png 없음), 헤더에 "미국 대출 분석" 탭 표시.
     2. intro 카드가 insurance welcome과 동일한 중앙 정렬 카드형으로 보이는지 확인, 문서 목록이 _manifest.jsonl에서 로드되는지.
     3. 문서 1건 "분석하기" → step-bar 진행 → (ANTHROPIC_API_KEY 필요) LoanReportView에 LOAN-01~05 라벨로 findings 렌더.
     4. pnpm tsc --noEmit --pretty false 타입 통과, pnpm build 성공.
     5. (선택, 사용자 실행) OPENAI_API_KEY=... python scripts/gen_card_images.py → public/loans-hero.png 생성 후 배경 표시 확인.

    범위 밖 (변경하지 않음)

    - 기존 /cards, /insurance, / 페이지 레이아웃/스타일.
     - 대출 사전계산 리포트(data/loans/*) 생성 — 라이브 분석만 제공.


=======================================


 계획: Codef 보험조회 활성화 + 조회 이력 DB 영구 저장(암호화)
 Context (왜 이 작업을 하는가)

 사용자가 "DB 달려있냐, 본인 정보 입력해서 Codef로 내 보험 바로 조회되냐"고 물었다. 조사 결과:

- DB 없음 — 세션은 서버 메모리(lib/session-store.ts, 20분 TTL), 사용자 정보는 브라우저 localStorage뿐.
- Codef 연동은 이미 완성 (목업 아님, 실제 API). 화면(welcome→정보입력→캡차→인증→조회→결과)과 API 라우트(app/api/insurance/*) 모두 구현됨.
- 막힌 단 하나: .env.local에 ANTHROPIC_API_KEY만 있고 Codef 키 3개(CODEF_CLIENT_ID/SECRET/PUBLIC_KEY)가 비어 있어 OAuth·RSA 단계에서 즉시 에러.

 사용자 결정:

- 운영(production) Codef 키 보유.
- 배포 대상: Vercel(클라우드).
- 조회 이력: 전체 결과 저장 + 암호화 필수.

 목표 결과: (A) 본인 정보 입력 시 Codef로 실제 가입보험을 즉시 조회, (B) 조회 결과를 암호화해 클라우드 DB에 영구 저장하고 나중에 다시 열람.

---

 기술 선택

- DB: Neon Postgres (Vercel Marketplace 연동). Vercel 서버리스에선 파일 SQLite가 영속되지 않으므로 클라우드 Postgres 사용.
- ORM: Drizzle ORM (drizzle-orm + @neondatabase/serverless, dev drizzle-kit). 가볍고 서버리스/엣지 친화적.
- 암호화: Node crypto AES-256-GCM. 키는 HISTORY_ENC_KEY(32바이트 base64) 환경변수.
- 사용자 식별: 별도 로그인 없음. userKey = HMAC-SHA256(phoneNo + birthDate, USER_KEY_SECRET) 로 평문 PII를 저장하지 않는 안정적 불투명 ID 생성.

 ▎ 보안 주의: 본 앱은 실제 인증 체계가 없어 "전화번호+생년월일"이 사실상 열람 키다(기존 localStorage 모델과 동일 수준). 가입내역은 민감 금융정보이므로
 ▎ payload는 항상 암호화 저장하고, 평문 컬럼은 최소(조회일시·건수·마스킹된 이름)로 제한한다.

---

 작업 단계

 Phase 1 — Codef 운영 활성화 (코드 변경 없음, 즉시 동작)

1. .env.local에 운영 키 추가 (값은 사용자가 제공 / 직접 입력, 커밋 금지):
   CODEF_CLIENT_ID=...
   CODEF_CLIENT_SECRET=...
   CODEF_PUBLIC_KEY=...        # BEGIN/END 줄 제외한 base64 본문만
   CODEF_ENV=production
2. lib/codef-client.ts가 CODEF_ENV==="production"이면 https://api.codef.io를 사용(이미 구현됨, 13–24행).
3. (선택) tsc 정리: types/node-rsa.d.ts에 declare module "node-rsa" 추가로 기존 빌드 경고 제거.
4. 검증: pnpm dev → /insurance에서 본인 정보 입력 → step6 조회 성공 확인.

 Phase 2 — 조회 이력 DB 영구 저장 (핵심)

 신규 파일:

- lib/db/client.ts — Neon + Drizzle 클라이언트 (DATABASE_URL).
- lib/db/schema.ts — 테이블 insurance_query_history:
  - id uuid pk default, userKey text (index), queriedAt timestamptz default now(),
  - env text, nameMasked text, contractCount int, totalPremium int (요약, 평문),
  - payloadCipher text (AES-GCM(iv+tag+ciphertext)로 암호화한 전체 result.data JSON).
- lib/crypto.ts — encryptJson(obj)→string, decryptJson(str)→obj (AES-256-GCM, HISTORY_ENC_KEY).
- lib/user-key.ts — deriveUserKey(phoneNo, birthDate) HMAC.
- lib/db/history.ts — saveQueryHistory(session, data), listQueryHistory(userKey)(요약만), getQueryHistoryItem(id, userKey)(복호화).
- drizzle.config.ts + drizzle/ 마이그레이션.

 저장 훅 (실패해도 사용자 조회는 막지 않도록 try/catch + 로그 후 진행):

- app/api/insurance/query/route.ts — CF-00000 성공 분기(49–50행) 직전에 await saveQueryHistory(session, result.data).
- app/api/insurance/query-confirm/route.ts — CF-00000 성공 분기(23행) 직전에 동일 호출.
  - session.baseParams의 userName/birthDate/phoneNo로 userKey·마스킹 이름 생성.

 열람 API + UI:

- app/api/insurance/history/route.ts — POST {name,birth,phone} → 서버에서 userKey 도출 → 목록(요약) 반환; ?id=로 단건 복호화 반환.
- app/insurance/page.tsx welcome 화면(savedUser 존재 시)에 "이전 조회 이력" 진입점 추가 → 목록 표시 → 항목 클릭 시 복호화 payload를 resultData에 넣고 step
  7로 이동.
  - 기존 components/insurance/step-result.tsx를 그대로 재사용(이미 data prop으로 동일 형태 렌더). 신규 렌더링 코드 불필요.

 신규 env: DATABASE_URL, HISTORY_ENC_KEY, USER_KEY_SECRET (Vercel Project Env에도 등록).

 Phase 3 — 세션 저장소 DB 이전 (Vercel 배포 전 필수, 로컬은 불필요)

 문제: lib/session-store.ts는 메모리 Map이라 Vercel 서버리스의 다중 인스턴스/콜드스타트에서 멀티스텝 인증(register→captcha→verify→query)이 세션 유실로 실패함.

- 테이블 codef_session 추가: id, dataCipher(세션 전체 암호화 — regPw/loginPw 등 자격증명 포함), expiresAt, updatedAt.
- getSession/saveSession/deleteSession을 DB 기반 async로 전환, 만료는 expiresAt(20분)으로 처리.
- 호출부 전부 await 적용: app/api/insurance/register/{start,captcha,verify,email}/route.ts, query/route.ts, query-confirm/route.ts, check-user(해당 시).
  패턴은 동일(동기→await).

 ▎ 로컬에서 먼저 테스트할 경우 Phase 3는 생략 가능. Vercel에 올리는 순간 필요.

---

 검증 (end-to-end)

1. 로컬 Codef: .env.local 키 입력 후 pnpm dev → /insurance 본인 정보 → 조회 성공.
   ● 계획서를 작성했습니다. 핵심 요약:

  지금 안 되는 이유 = DB 문제가 아니라 Codef 키 3개가 .env.local에 비어 있어서입니다. 연동 코드(화면+API+RSA+OAuth)는 이미 완성돼 있어, 운영 키만 넣으면 코드
  수정 없이 바로 본인 보험 조회가 됩니다.

  계획 3단계:

- Phase 1 (즉시): .env.local에 CODEF_CLIENT_ID/SECRET/PUBLIC_KEY + CODEF_ENV=production 추가 → 로컬에서 본인 정보로 실제 조회 가능.
- Phase 2 (핵심): Neon Postgres + Drizzle로 insurance_query_history 테이블 추가. 전체 결과를 AES-256-GCM 암호화해 저장(payloadCipher), 평문은
  조회일시·건수·마스킹된 이름만. 저장 훅은 성공 지점 2곳(query, query-confirm). 열람은 welcome 화면의 "이전 조회 이력" → 기존 StepResult 재사용.
- Phase 3 (Vercel 배포 전 필수): 메모리 세션 저장소를 DB 기반 async로 이전 — 서버리스 다중 인스턴스에서 멀티스텝 인증이 세션 유실로 깨지기 때문. 로컬
  테스트만 할 거면 생략 가능.

  보안 짚은 점: 이 앱은 실제 로그인 인증이 없어 "전화번호+생년월일"이 사실상 열람 키가 됩니다(기존 localStorage와 동일 수준). 그래서 가입내역 payload는 항상
  암호화하고 평문 컬럼은 최소화하는 설계로 잡았습니다.

  진행하려면 Codef 키 실제 값과 Neon DATABASE_URL이 필요합니다(둘 다 구현 단계에서 안내).

● User approved Claude's plan
  ⎿  Plan saved to: C:\Users\tgc04\.claude\plans\db-codef-synthetic-quiche.md · /plan to edit
     계획: Codef 보험조회 활성화 + 조회 이력 DB 영구 저장(암호화)
     Context (왜 이 작업을 하는가)
     사용자가 "DB 달려있냐, 본인 정보 입력해서 Codef로 내 보험 바로 조회되냐"고 물었다. 조사 결과:

    - DB 없음 — 세션은 서버 메모리(lib/session-store.ts, 20분 TTL), 사용자 정보는 브라우저 localStorage뿐.
     - Codef 연동은 이미 완성 (목업 아님, 실제 API). 화면(welcome→정보입력→캡차→인증→조회→결과)과 API 라우트(app/api/insurance/*) 모두 구현됨.
     - 막힌 단 하나: .env.local에 ANTHROPIC_API_KEY만 있고 Codef 키 3개(CODEF_CLIENT_ID/SECRET/PUBLIC_KEY)가 비어 있어 OAuth·RSA 단계에서 즉시 에러.

    사용자 결정:
     - 운영(production) Codef 키 보유.
     - 배포 대상: Vercel(클라우드).
     - 조회 이력: 전체 결과 저장 + 암호화 필수.

    목표 결과: (A) 본인 정보 입력 시 Codef로 실제 가입보험을 즉시 조회, (B) 조회 결과를 암호화해 클라우드 DB에 영구 저장하고 나중에 다시 열람.

    ---
     기술 선택

    - DB: Neon Postgres (Vercel Marketplace 연동). Vercel 서버리스에선 파일 SQLite가 영속되지 않으므로 클라우드 Postgres 사용.
     - ORM: Drizzle ORM (drizzle-orm + @neondatabase/serverless, dev drizzle-kit). 가볍고 서버리스/엣지 친화적.
     - 암호화: Node crypto AES-256-GCM. 키는 HISTORY_ENC_KEY(32바이트 base64) 환경변수.
     - 사용자 식별: 별도 로그인 없음. userKey = HMAC-SHA256(phoneNo + birthDate, USER_KEY_SECRET) 로 평문 PII를 저장하지 않는 안정적 불투명 ID 생성.

    ▎ 보안 주의: 본 앱은 실제 인증 체계가 없어 "전화번호+생년월일"이 사실상 열람 키다(기존 localStorage 모델과 동일 수준). 가입내역은 민감 금융정보이므로
     ▎ payload는 항상 암호화 저장하고, 평문 컬럼은 최소(조회일시·건수·마스킹된 이름)로 제한한다.

    ---
     작업 단계

    Phase 1 — Codef 운영 활성화 (코드 변경 없음, 즉시 동작)

    1. .env.local에 운영 키 추가 (값은 사용자가 제공 / 직접 입력, 커밋 금지):
     CODEF_CLIENT_ID=...
     CODEF_CLIENT_SECRET=...
     CODEF_PUBLIC_KEY=...        # BEGIN/END 줄 제외한 base64 본문만
     CODEF_ENV=production
     1. lib/codef-client.ts가 CODEF_ENV==="production"이면 https://api.codef.io를 사용(이미 구현됨, 13–24행).
     2. (선택) tsc 정리: types/node-rsa.d.ts에 declare module "node-rsa" 추가로 기존 빌드 경고 제거.
     3. 검증: pnpm dev → /insurance에서 본인 정보 입력 → step6 조회 성공 확인.

    Phase 2 — 조회 이력 DB 영구 저장 (핵심)

    신규 파일:
     - lib/db/client.ts — Neon + Drizzle 클라이언트 (DATABASE_URL).
     - lib/db/schema.ts — 테이블 insurance_query_history:
       - id uuid pk default, userKey text (index), queriedAt timestamptz default now(),
       - env text, nameMasked text, contractCount int, totalPremium int (요약, 평문),
       - payloadCipher text (AES-GCM(iv+tag+ciphertext)로 암호화한 전체 result.data JSON).
     - lib/crypto.ts — encryptJson(obj)→string, decryptJson(str)→obj (AES-256-GCM, HISTORY_ENC_KEY).
     - lib/user-key.ts — deriveUserKey(phoneNo, birthDate) HMAC.
     - lib/db/history.ts — saveQueryHistory(session, data), listQueryHistory(userKey)(요약만), getQueryHistoryItem(id, userKey)(복호화).
     - drizzle.config.ts + drizzle/ 마이그레이션.

    저장 훅 (실패해도 사용자 조회는 막지 않도록 try/catch + 로그 후 진행):
     - app/api/insurance/query/route.ts — CF-00000 성공 분기(49–50행) 직전에 await saveQueryHistory(session, result.data).
     - app/api/insurance/query-confirm/route.ts — CF-00000 성공 분기(23행) 직전에 동일 호출.
       - session.baseParams의 userName/birthDate/phoneNo로 userKey·마스킹 이름 생성.

    열람 API + UI:
     - app/api/insurance/history/route.ts — POST {name,birth,phone} → 서버에서 userKey 도출 → 목록(요약) 반환; ?id=로 단건 복호화 반환.
     - app/insurance/page.tsx welcome 화면(savedUser 존재 시)에 "이전 조회 이력" 진입점 추가 → 목록 표시 → 항목 클릭 시 복호화 payload를 resultData에 넣고 step     7로 이동.
       - 기존 components/insurance/step-result.tsx를 그대로 재사용(이미 data prop으로 동일 형태 렌더). 신규 렌더링 코드 불필요.

    신규 env: DATABASE_URL, HISTORY_ENC_KEY, USER_KEY_SECRET (Vercel Project Env에도 등록).

    Phase 3 — 세션 저장소 DB 이전 (Vercel 배포 전 필수, 로컬은 불필요)

    문제: lib/session-store.ts는 메모리 Map이라 Vercel 서버리스의 다중 인스턴스/콜드스타트에서 멀티스텝 인증(register→captcha→verify→query)이 세션 유실로
     실패함.

    - 테이블 codef_session 추가: id, dataCipher(세션 전체 암호화 — regPw/loginPw 등 자격증명 포함), expiresAt, updatedAt.
     - getSession/saveSession/deleteSession을 DB 기반 async로 전환, 만료는 expiresAt(20분)으로 처리.
     - 호출부 전부 await 적용: app/api/insurance/register/{start,captcha,verify,email}/route.ts, query/route.ts, query-confirm/route.ts, check-user(해당 시).
     패턴은 동일(동기→await).

    ▎ 로컬에서 먼저 테스트할 경우 Phase 3는 생략 가능. Vercel에 올리는 순간 필요.

    ---
     검증 (end-to-end)

    1. 로컬 Codef: .env.local 키 입력 후 pnpm dev → /insurance 본인 정보 → 조회 성공.
     2. DB 마이그레이션: pnpm drizzle-kit push (또는 generate+migrate) → Neon에 테이블 생성 확인.
     3. 이력 저장: 조회 성공 후 Neon insurance_query_history에 1행 생성, payloadCipher가 암호문인지 확인(평문 가입내역 노출 0).
     4. 이력 열람: welcome → "이전 조회 이력" → 항목 클릭 → step7 StepResult에 과거 결과 정상 표시.
     5. 복호화 라운드트립: 저장 직후 getQueryHistoryItem이 원본 result.data와 동일 객체 반환.
     6. 타입/빌드: npx tsc --noEmit (기존 node-rsa 경고 외 0), pnpm build.
     7. Vercel(선택): Phase 3 적용 후 프리뷰 배포에서 멀티스텝 인증→조회→이력 저장까지 통과.

    미해결/사용자 입력 필요

    - Codef 키 3개 실제 값(직접 .env.local에 넣거나 전달).
     - Neon DATABASE_URL 발급(Vercel Marketplace에서 Neon 연동 시 자동 주입 가능).
     - HISTORY_ENC_KEY, USER_KEY_SECRET는 구현 시 안전한 랜덤값으로 생성해 등록.


  완료된 작업
  Phase 1 — Codef 활성화

- .env.local에 주신 공개키 + sandbox CLIENT_ID/SECRET 반영, CODEF_ENV=sandbox. 암호화 키(HISTORY_ENC_KEY, USER_KEY_SECRET) 자동 생성.  - types/node-rsa.d.ts 추가로 기존 tsc 경고 제거.

  Phase 2 — 조회 이력 DB 영구 저장 (암호화)

- lib/db/schema.ts(insurance_query_history), lib/db/client.ts(지연 초기화 Neon+Drizzle), lib/crypto.ts(AES-256-GCM), lib/user-key.ts(HMAC),
  lib/db/history.ts(save/list/get).
- 저장 훅: query/route.ts·query-confirm/route.ts 성공 분기에 saveQueryHistory(try/catch로 조회 응답 비차단). 전체 결과는 payloadCipher에 암호화, 평문은
  조회일시·건수·월납입·마스킹 이름만.
- 열람: app/api/insurance/history/route.ts + components/insurance/step-history.tsx → welcome 화면 "이전 조회 이력 보기" → 기존 StepResult 재사용.

  Phase 3 — 세션 저장소 DB 이전 (Vercel 대비)

- lib/session-store.ts를 DB 기반 async로 전환(codef_session 테이블, 세션 전체 암호화, 20분 TTL). DATABASE_URL 없으면 메모리 폴백 → 로컬은 DB 없이도 동작.
- 8개 라우트 호출부 전부 await 적용.

  검증 결과

- tsc --noEmit 클린, drizzle-kit generate 마이그레이션 SQL 생성(drizzle/0000_*.sql), AES-GCM/HMAC 라운드트립 정상(한글 포함), pnpm build 성공(esbuild/sharp
  빌드 승인 pnpm-workspace.yaml에 반영).

  ⚠️  진행하려면 필요한 것 2가지

1. DATABASE_URL (Neon) — 이게 없으면 이력 저장/열람이 동작하지 않습니다(조회 자체는 메모리 폴백으로 됨). Neon 연결 문자열을 .env.local에 넣은 뒤 pnpm
   drizzle-kit push(또는 생성된 drizzle/0000_*.sql 적용)로 테이블을 만들면 됩니다. Vercel은 Marketplace에서 Neon 연동 시 자동 주입됩니다.
2. 운영 키 (중요) — 주신 건 sandbox 자격증명이라 CODEF_ENV=sandbox로 맞춰 뒀습니다. 이 상태로 본인 정보를 넣어도 Codef의 고정 테스트 데이터만 나오고 실제
   가입보험은 안 보입니다. 본인 실제 보험을 조회하려면 codef.io의 정식/데모 CLIENT_ID·SECRET으로 교체하고 CODEF_ENV=production(또는 demo)으로 바꿔야 합니다.

  알려진 제약: check-user의 "이미 등록됨" 캐시(userStore)는 아직 메모리라 Vercel에서 인스턴스 간 유지되지 않습니다(전체 재인증으로 폴백될 뿐 기능은 정상).
  필요하면 이것도 DB로 옮길 수 있습니다.


================================



  ✅ 수정 완료 — 추가정보 페이지가 뜨던 원인

  원인: 기존 사용자를 알아보는 저장소(check-user의 userStore)가 서버 메모리였습니다. 코드 주석에도 "replace with DB in production"이라 적혀 있던 부분으로,  서버를 재시작하면(검증하며 재시작했습니다) 비어버려 등록했던 정보를 똑같이 넣어도 "신규"로 인식 → 추가정보 페이지가 떴습니다.

  수정: 등록 사용자 저장소를 DB(registered_user)로 영구화하고 자격증명은 암호화(AES-256-GCM) 저장했습니다.

- 새 모듈 lib/db/registered-user.ts (findRegisteredUser/saveRegisteredUser, DATABASE_URL 없으면 메모리 폴백)
- check-user·register/start·register/verify·register/email이 메모리 Map 대신 이 모듈 사용 (route 파일에서 함수 export 하던 구조도 정리)
- Neon에 registered_user 테이블 추가(마이그레이션 0001 적용)

  검증:

  ┌──────────────────────────────────────┬─────────────────────────────────────────────────┐
  │                케이스                │                      결과                       │
  ├──────────────────────────────────────┼─────────────────────────────────────────────────┤
  │ 등록된 정보 재입력(하이픈 유무 무관) │ found:true → 추가정보 건너뛰고 바로 조회 ✓      │
  ├──────────────────────────────────────┼─────────────────────────────────────────────────┤
  │ 미등록 정보                          │ found:false → 추가정보 페이지(첫 등록자 정상) ✓ │
  ├──────────────────────────────────────┼─────────────────────────────────────────────────┤
  │ 자격증명 저장                        │ cred_cipher 암호문(평문 노출 0) ✓               │
  ├──────────────────────────────────────┼─────────────────────────────────────────────────┤
  │ tsc                                  │ 클린, 테스트 데이터 정리 완료                   │
  └──────────────────────────────────────┴─────────────────────────────────────────────────┘

  짚어둘 점

  지금 registered_user는 비어 있습니다. 그래서 처음 한 번은 추가정보 + 본인인증으로 등록을 완료해야 합니다. 그 등록이 성공하면 이제부터 같은 정보 재입력 시
  영구적으로 인식됩니다(재시작·Vercel 인스턴스 교체와 무관). 이전엔 그 등록조차 메모리라 재시작 때 날아갔습니다.

  ▎ 현재 CODEF_ENV=sandbox라 등록/조회가 Codef 테스트 흐름으로 진행됩니다. 실제 등록을 영구 인식시키려면 운영 키로 전환 후 한 번 등록하면 됩니다.

  dev 서버는 http://localhost:3000 에서 새 코드로 계속 실행 중입니다. 바로 /insurance에서 흐름을 확인해 보셔도 됩니다.
