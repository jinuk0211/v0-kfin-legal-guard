"""
Vercel Python Function — /api/precedents

law.go.kr(국가법령정보 공동활용) 실시간 검색:
  - 판례: lawSearch.do(target=prec) → 상세(lawService.do) → 관련성 필터 → BM25 재랭킹
  - 법령: 취약점별 큐레이션 매핑(VULN_STATUTE_MAP)을 lawSearch.do(target=law)로 검증

scripts/search_precedents.py 를 서버리스에 맞게 적응:
  - konlpy 제거(정규식 토크나이즈로 대체), 파일 임베딩 캐시 제거(기본 BM25)
  - 로컬 precedents.json fallback 제거(서버리스엔 DB 파일 없음)
  - OC 키는 환경변수 LAW_GO_KR_OC (없으면 기존 값)

요청:  POST { "query": "...", "vuln_id": "INS-02", "mode": "bm25|api-only", "top_k": 3 }
응답:  { "precedents": [...], "statutes": [...], "query": "...", "vuln_id": "..." }

주의(배포):
  law.go.kr은 한국 정부 서비스라 해외/데이터센터 IP에서 연결이 막히거나 느릴 수 있음.
  Vercel 프로젝트 리전을 icn1(서울)로 두는 것을 권장(vercel.json regions).
"""

import os
import re
import json
import time
import hashlib

import requests
from bs4 import BeautifulSoup
from http.server import BaseHTTPRequestHandler

try:
    from rank_bm25 import BM25Okapi
    HAS_BM25 = True
except ImportError:
    HAS_BM25 = False

# ── 설정 ──────────────────────────────────────────────────────────────────────
OC = os.environ.get("LAW_GO_KR_OC", "dlwlsdnr2")
API_DELAY = 0.2            # law.go.kr 과부하 방지
FETCH_COUNT = 10           # 상세조회 후보 수(지연/타임아웃 균형)
SEARCH_URL = "https://www.law.go.kr/DRF/lawSearch.do"
SERVICE_URL = "https://www.law.go.kr/DRF/lawService.do"

EXCLUDE_KEYWORDS = [
    "취득세", "증여세", "상속세", "양도세", "명의신탁", "조세", "과세표준", "국세",
    "보이스피싱", "사기단", "범죄단체", "근로", "임금", "해고", "노동",
    "행정처분", "영업허가", "공정거래",
]

TAG_REQUIRED = {
    "INS-01": [["설명의무", "보험"], ["설명", "보험계약"], ["약관", "교부"]],
    "INS-02": [["고지의무"], ["불고지"], ["고지", "보험금"]],
    "INS-03": [["면책", "보험"], ["보험금", "거절"], ["보험금", "지급"]],
    "INS-04": [["고지의무"], ["서면질문"], ["불고지", "보험"]],
    "INS-05": [["약관", "해석"], ["약관", "불명확"], ["작성자불이익"]],
    "LOAN-01": [["금리", "대출", "변경"], ["변동금리", "약관"]],
    "LOAN-02": [["기한이익", "대출"], ["기한이익상실", "약관"]],
    "LOAN-03": [["중도상환수수료"], ["조기상환수수료", "대출"]],
    "LOAN-04": [["담보", "대출", "약관"], ["저당권", "금융"]],
    "LOAN-05": [["개인정보", "보험"], ["신용정보", "약관"], ["개인정보", "금융", "동의"]],
}

# 취약점 → 관련 법령(큐레이션). law.go.kr target=law 로 존재 검증 후 반환.
VULN_STATUTE_MAP = {
    "INS-01": [("상법", "제638조의2", "보험약관의 교부·설명 의무"),
               ("금융소비자보호법", "제19조", "설명의무"),
               ("보험업법", "제95조의2", "보험계약의 체결 또는 모집에 관한 금지행위")],
    "INS-02": [("상법", "제651조", "고지의무위반으로 인한 계약해지"),
               ("상법", "제651조의2", "서면에 의한 질문의 효력")],
    "INS-03": [("약관의 규제에 관한 법률", "제7조", "면책조항의 금지"),
               ("상법", "제659조", "보험자의 면책사유"),
               ("상법", "제663조", "보험계약의 무효")],
    "INS-04": [("상법", "제651조의2", "서면에 의한 질문의 효력"),
               ("상법", "제651조", "고지의무위반으로 인한 계약해지")],
    "INS-05": [("약관의 규제에 관한 법률", "제5조", "약관의 해석"),
               ("약관의 규제에 관한 법률", "제6조", "일반원칙")],
    "LOAN-01": [("은행법", "제52조", "약관의 제정·변경"),
                ("약관의 규제에 관한 법률", "제6조", "일반원칙")],
    "LOAN-02": [("민법", "제388조", "기한의 이익의 상실"),
                ("약관의 규제에 관한 법률", "제9조", "계약의 해제·해지")],
    "LOAN-03": [("이자제한법", "제2조", "이자의 최고한도"),
                ("약관의 규제에 관한 법률", "제8조", "손해배상액의 예정")],
    "LOAN-04": [("민법", "제356조", "저당권의 효력"),
                ("약관의 규제에 관한 법률", "제6조", "일반원칙")],
    "LOAN-05": [("개인정보보호법", "제15조", "개인정보의 수집·이용"),
                ("개인정보보호법", "제17조", "개인정보의 제공"),
                ("신용정보법", "제33조", "개인신용정보의 이용")],
}


# ── 판례: law.go.kr API ───────────────────────────────────────────────────────
def api_search(query, display=FETCH_COUNT):
    params = {"OC": OC, "target": "prec", "type": "JSON",
              "query": query, "display": display, "sort": "ddes"}
    res = requests.get(SEARCH_URL, params=params, timeout=10)
    res.raise_for_status()
    prec = res.json().get("PrecSearch", {}).get("prec", [])
    if isinstance(prec, dict):
        prec = [prec]
    return prec if isinstance(prec, list) else []


def api_detail(prec_id):
    params = {"OC": OC, "target": "prec", "ID": prec_id, "type": "XML"}
    res = requests.get(SERVICE_URL, params=params, timeout=10)
    res.encoding = "utf-8"
    soup = BeautifulSoup(res.text, "xml")

    def txt(tag):
        el = soup.find(tag)
        return re.sub(r"\s+", " ", el.get_text(separator=" ")).strip() if el else ""

    return {
        "사건번호": txt("사건번호"), "사건명": txt("사건명"), "법원명": txt("법원명"),
        "선고일자": txt("선고일자"), "판시사항": txt("판시사항"),
        "판결요지": txt("판결요지"), "참조조문": txt("참조조문"),
    }


def is_relevant(raw, vuln_tag):
    combined = " ".join([raw.get("사건명", ""), raw.get("판시사항", ""),
                         raw.get("판결요지", ""), raw.get("참조조문", "")])
    if any(kw in combined for kw in EXCLUDE_KEYWORDS):
        return False
    groups = TAG_REQUIRED.get(vuln_tag, [])
    if not groups:
        return True
    return any(all(kw in combined for kw in group) for group in groups)


def raw_to_doc(raw, vuln_tag):
    full = raw.get("판결요지", "").replace("\n", " ").strip()
    summary = full[:97] + "..." if len(full) > 100 else full
    return {
        "type": "precedent",
        "case_number": raw.get("사건번호", "").strip(),
        "court": raw.get("법원명", ""),
        "date": raw.get("선고일자", ""),
        "subject": raw.get("사건명", ""),
        "summary": summary,
        "vuln_tags": [vuln_tag],
        "source": "law.go.kr",
        "_full_text": raw.get("판시사항", "") + " " + raw.get("판결요지", ""),
    }


def fetch_candidates(query, vuln_tag):
    meta_list = api_search(query, display=FETCH_COUNT)
    candidates, seen = [], set()
    for meta in meta_list:
        case_num = meta.get("사건번호", "").strip()
        prec_id = meta.get("판례일련번호", "").strip()
        if not case_num or not prec_id or case_num in seen:
            continue
        time.sleep(API_DELAY)
        try:
            raw = api_detail(prec_id)
        except Exception:
            continue
        if not raw.get("판결요지") or not is_relevant(raw, vuln_tag):
            continue
        candidates.append(raw_to_doc(raw, vuln_tag))
        seen.add(case_num)
    return candidates


# ── 재랭킹 ────────────────────────────────────────────────────────────────────
def tokenize(text):
    return re.findall(r"[가-힣]{2,}", text) if text else []


def rerank_bm25(query, candidates, top_k):
    if not candidates:
        return []
    docs = [d.get("_full_text", d.get("summary", "")) for d in candidates]
    q_tokens = tokenize(query) or query.split()
    if HAS_BM25:
        tokenized = [tokenize(d) or d.split() for d in docs]
        scores = BM25Okapi(tokenized).get_scores(q_tokens)
        max_s = max(scores) if scores.size and max(scores) > 0 else 1.0
        norm = [float(s) / max_s for s in scores]
    else:
        q_set = set(q_tokens)
        norm = [len(q_set & set(tokenize(d) or d.split())) / max(len(q_set), 1) for d in docs]
    ranked = sorted(zip(candidates, norm), key=lambda x: x[1], reverse=True)
    out = []
    for doc, score in ranked[:top_k]:
        clean = {k: v for k, v in doc.items() if not k.startswith("_")}
        clean["relevance_score"] = round(float(score), 3)
        out.append(clean)
    return out


def search_precedents(query, vuln_id="", top_k=3, mode="bm25"):
    try:
        candidates = fetch_candidates(query, vuln_id)
    except Exception:
        return []
    if not candidates:
        return []
    if mode == "api-only":
        out = []
        for doc in candidates[:top_k]:
            clean = {k: v for k, v in doc.items() if not k.startswith("_")}
            clean["relevance_score"] = 1.0
            out.append(clean)
        return out
    return rerank_bm25(query, candidates, top_k)


# ── 법령: law.go.kr target=law 로 검증 ────────────────────────────────────────
def verify_statute(law_name):
    """법령명을 law.go.kr에서 검색해 존재 확인 + 법령ID/링크 반환."""
    try:
        params = {"OC": OC, "target": "law", "type": "JSON", "query": law_name, "display": 1}
        res = requests.get(SEARCH_URL, params=params, timeout=10)
        res.raise_for_status()
        laws = res.json().get("LawSearch", {}).get("law", [])
        if isinstance(laws, dict):
            laws = [laws]
        for l in laws:
            name = l.get("법령명한글", "")
            if law_name.replace(" ", "") in name.replace(" ", ""):
                return {"law_id": l.get("법령ID", ""), "official_name": name}
    except Exception:
        pass
    return None


def search_statutes(vuln_id):
    entries = VULN_STATUTE_MAP.get(vuln_id, [])
    results, checked = [], {}
    for law_name, article, title in entries:
        if law_name not in checked:
            time.sleep(API_DELAY)
            checked[law_name] = verify_statute(law_name)
        meta = checked[law_name]
        results.append({
            "type": "statute",
            "law": law_name,
            "article": article,
            "title": title,
            "verified": bool(meta),
            "law_id": (meta or {}).get("law_id", ""),
            "link": f"https://www.law.go.kr/법령/{law_name}/{article}",
            "source": "law.go.kr",
        })
    return results


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
                         "usage": "POST { query, vuln_id?, mode?, top_k? }"})

    def do_POST(self):
        length = int(self.headers.get("content-length", 0) or 0)
        try:
            req = json.loads(self.rfile.read(length) or b"{}") if length else {}
        except Exception:
            req = {}

        query = (req.get("query") or "").strip()
        vuln_id = (req.get("vuln_id") or req.get("vulnId") or "").strip()
        mode = req.get("mode") or "bm25"
        try:
            top_k = int(req.get("top_k") or req.get("topK") or 3)
        except (TypeError, ValueError):
            top_k = 3

        if not query:
            return self._send(400, {"error": "query is required"})

        try:
            precedents = search_precedents(query, vuln_id, top_k, mode)
            statutes = search_statutes(vuln_id) if vuln_id else []
            self._send(200, {"query": query, "vuln_id": vuln_id,
                             "precedents": precedents, "statutes": statutes})
        except Exception as e:
            self._send(500, {"error": str(e)})
