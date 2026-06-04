"""
Vercel Python Function — /api/precedents_us

CourtListener(미국 판례) 실시간 검색 — 카드(CC-01~05)·대출(LOAN-01~05) 공용.
logic/eval_US_card/persona/us_legal_validator.py 를 서버리스에 맞게 포팅:
  - CourtListener v4 search → BM25 재랭킹 → (선택)Claude Haiku judge 관련성 필터
  - US 법령은 라이브 검색 대신 고정 citation gate 매핑(성문법)

요청:  POST { "taxonomy": "CC-05", "triggered_by": "...", "title": "...", "query": "...", "top_k": 3 }
응답:  { "statutes": [{law_name, article, verified}],
        "precedents": [{case_number, case_name, court, date, summary, relevance_score, source, url}] }

env:
  COURTLISTENER_API_KEY  (선택 — 없으면 익명, rate limit 낮음)
  ANTHROPIC_API_KEY      (선택 — 있으면 Haiku judge, 없으면 키워드 fallback)
"""

import os
import re
import json
import time

import requests
from http.server import BaseHTTPRequestHandler

try:
    import anthropic as _anthropic
    _judge_client = _anthropic.Anthropic(api_key=os.environ.get("ANTHROPIC_API_KEY", ""))
    HAS_ANTHROPIC = bool(os.environ.get("ANTHROPIC_API_KEY", ""))
except Exception:
    HAS_ANTHROPIC = False

CL_BASE = "https://www.courtlistener.com/api/rest/v4"
CL_KEY = os.environ.get("COURTLISTENER_API_KEY", "")
CL_HDR = {"User-Agent": "KFinLegalHarness-US/1.0"}
if CL_KEY:
    CL_HDR["Authorization"] = f"Token {CL_KEY}"

# ── US 법령 citation gate (성문법 — 고정 매핑) ────────────────────────────────
US_STATUTE_MAP = {
    "CC-01": [("Truth in Lending Act", "15 U.S.C. § 1601"), ("CFPB Regulation Z", "12 CFR Part 1026")],
    "CC-02": [("Truth in Lending Act", "15 U.S.C. § 1666i"), ("Credit CARD Act 2009", "15 U.S.C. § 1637")],
    "CC-03": [("Truth in Lending Act", "15 U.S.C. § 1637"), ("CFPB Regulation Z", "12 CFR § 1026.51")],
    "CC-04": [("Truth in Lending Act", "15 U.S.C. § 1637"), ("Credit CARD Act 2009", "15 U.S.C. § 1637(i)")],
    "CC-05": [("Federal Arbitration Act", "9 U.S.C. § 2"), ("Dodd-Frank Act", "12 U.S.C. § 5518")],
    # 대출은 상사계약 — 소비자 성문법이 약함. 판례 위주, 법령은 비움.
    "LOAN-01": [], "LOAN-02": [], "LOAN-03": [], "LOAN-04": [], "LOAN-05": [],
}

# ── taxonomy별 CourtListener 검색 쿼리 ────────────────────────────────────────
TAX_QUERY = {
    "CC-01": "credit card fee disclosure TILA Truth in Lending hidden fees",
    "CC-02": "credit card penalty APR interest rate increase consumer protection TILA",
    "CC-03": "credit card minimum payment billing unfair practice consumer",
    "CC-04": "credit card change in terms unilateral modification account cancellation",
    "CC-05": "credit card arbitration clause class action waiver unconscionable consumer",
    "LOAN-01": "loan acceleration event of default immediately due and payable enforceability",
    "LOAN-02": "loan material adverse change MAC clause lender discretion enforceability",
    "LOAN-03": "loan prepayment penalty make-whole premium yield maintenance enforceability",
    "LOAN-04": "loan cross-default other indebtedness acceleration enforceability",
    "LOAN-05": "loan subordination senior debt junior creditor priority",
    "UNCATEGORIZED": "",
}

# ── judge 키워드 fallback (anthropic 없을 때) ─────────────────────────────────
JUDGE_KW = {
    "CC-01": ["fee", "disclosure", "TILA", "truth in lending"],
    "CC-02": ["APR", "interest", "penalty", "rate"],
    "CC-03": ["minimum payment", "billing", "balance"],
    "CC-04": ["change", "terms", "cancel", "modification"],
    "CC-05": ["arbitration", "class action", "waiver"],
    "LOAN-01": ["acceleration", "due and payable", "default"],
    "LOAN-02": ["material adverse", "adverse change"],
    "LOAN-03": ["prepayment", "make-whole", "yield maintenance"],
    "LOAN-04": ["cross-default", "indebtedness", "default"],
    "LOAN-05": ["subordinat", "senior debt", "junior"],
}


def clean_ascii(text):
    return (text or "").encode("ascii", errors="ignore").decode("ascii")


def tokenize(text):
    return re.findall(r"[a-zA-Z]+", (text or "").lower())


# ── CourtListener 검색 ────────────────────────────────────────────────────────
def cl_search(query, n=15):
    if not query:
        return []
    try:
        r = requests.get(
            f"{CL_BASE}/search/",
            params={"q": query, "type": "o", "stat_Precedential": "on", "count": n},
            headers=CL_HDR, timeout=15,
        )
        r.raise_for_status()
        out = []
        for item in r.json().get("results", []):
            out.append({
                "case_number": str(item.get("docket_id", "")),
                "case_name": item.get("caseName", ""),
                "court": item.get("court_id", ""),
                "date": item.get("dateFiled", ""),
                "snippet": clean_ascii(item.get("snippet", ""))[:400],
                "_full": clean_ascii(item.get("caseName", "") + " " + item.get("snippet", "")),
                "source": "courtlistener.com",
                "url": "https://www.courtlistener.com" + item.get("absolute_url", ""),
            })
        return out
    except Exception:
        return []


# ── BM25 재랭킹 ───────────────────────────────────────────────────────────────
def rerank_bm25(query, candidates, top_k=3):
    if not candidates:
        return []
    try:
        from rank_bm25 import BM25Okapi
        docs = [tokenize(c["_full"]) or ["_"] for c in candidates]
        scores = BM25Okapi(docs).get_scores(tokenize(query) or ["_"])
        max_s = max(scores) if len(scores) and max(scores) > 0 else 1.0
        norm = [float(s) / max_s for s in scores]
    except ImportError:
        q_set = set(tokenize(query))
        norm = [len(q_set & set(tokenize(c["_full"]))) / max(len(q_set), 1) for c in candidates]
    ranked = sorted(zip(candidates, norm), key=lambda x: -x[1])
    return [dict(d, relevance_score=round(s, 3)) for d, s in ranked[:top_k]]


# ── Claude judge (관련성 필터) ────────────────────────────────────────────────
_JUDGE_CACHE = {}


def judge_relevance(taxonomy, title, triggered_by, prec):
    key = taxonomy + "|" + prec.get("case_number", "")
    if key in _JUDGE_CACHE:
        return _JUDGE_CACHE[key]

    if not HAS_ANTHROPIC:
        kws = JUDGE_KW.get(taxonomy, [])
        text = (prec.get("case_name", "") + prec.get("snippet", "")).lower()
        result = any(k.lower() in text for k in kws) if kws else True
        _JUDGE_CACHE[key] = result
        return result

    prompt = (
        f"Is this US court case legally relevant to the consumer-finance / loan vulnerability?\n\n"
        f"[Vulnerability] {taxonomy} — {title}\n"
        f"[Clause] {(triggered_by or '')[:200]}\n\n"
        f"[Case: {prec.get('case_name', '')[:80]}]\n"
        f"Snippet: {prec.get('snippet', '')[:300]}\n\n"
        f"Reply YES or NO only."
    )
    try:
        resp = _judge_client.messages.create(
            model="claude-haiku-4-5", max_tokens=5,
            messages=[{"role": "user", "content": prompt}],
        )
        result = resp.content[0].text.strip().upper().startswith("Y")
        _JUDGE_CACHE[key] = result
        time.sleep(0.2)
        return result
    except Exception:
        return False


# ── 핵심: taxonomy + 조항 → 판례·법령 ─────────────────────────────────────────
def find_grounds(taxonomy, title="", triggered_by="", query="", top_k=3):
    q = query or TAX_QUERY.get(taxonomy, "")
    if taxonomy == "UNCATEGORIZED" and not q:
        words = [w for w in tokenize(triggered_by) if len(w) > 3]
        q = " ".join(words[:8]) + " consumer finance rights"

    candidates = cl_search(q, n=15) if q else []
    ranked = rerank_bm25(q, candidates, top_k)

    precedents = []
    for prec in ranked:
        if judge_relevance(taxonomy, title, triggered_by, prec):
            precedents.append({
                "case_number": prec.get("case_number", ""),
                "case_name": prec.get("case_name", ""),
                "court": prec.get("court", ""),
                "date": prec.get("date", ""),
                "summary": clean_ascii(prec.get("snippet", ""))[:120],
                "relevance_score": prec.get("relevance_score", 0),
                "source": prec.get("source", "courtlistener.com"),
                "url": prec.get("url", ""),
            })

    statutes = [{"law_name": s[0], "article": s[1], "verified": True}
                for s in US_STATUTE_MAP.get(taxonomy, [])]
    return {"statutes": statutes, "precedents": precedents}


# ── 핸들러 ────────────────────────────────────────────────────────────────────
class handler(BaseHTTPRequestHandler):
    def _send(self, code, obj):
        data = json.dumps(obj, ensure_ascii=False).encode("utf-8")
        self.send_response(code)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(data)))
        self.end_headers()
        self.wfile.write(data)

    def do_GET(self):
        self._send(200, {"ok": True,
                         "usage": "POST { taxonomy, triggered_by?, title?, query?, top_k? }"})

    def do_POST(self):
        length = int(self.headers.get("content-length", 0) or 0)
        try:
            req = json.loads(self.rfile.read(length) or b"{}") if length else {}
        except Exception:
            req = {}

        taxonomy = (req.get("taxonomy") or "").strip()
        if not taxonomy:
            return self._send(400, {"error": "taxonomy is required"})
        try:
            top_k = int(req.get("top_k") or req.get("topK") or 3)
        except (TypeError, ValueError):
            top_k = 3

        try:
            grounds = find_grounds(
                taxonomy,
                title=req.get("title") or "",
                triggered_by=req.get("triggered_by") or "",
                query=req.get("query") or "",
                top_k=top_k,
            )
            self._send(200, {"taxonomy": taxonomy, **grounds})
        except Exception as e:
            self._send(500, {"error": str(e)})
