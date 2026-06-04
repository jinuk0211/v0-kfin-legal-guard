"""One-off: generate the US-card page hero illustration via OpenAI gpt-image-2.

Reads OPENAI_API_KEY from the environment. Writes PNGs into public/.
Not part of the app runtime — run manually when assets need refreshing.
"""
import base64
import json
import os
import sys
import urllib.request

API = "https://api.openai.com/v1/images/generations"
KEY = os.environ.get("OPENAI_API_KEY")
if not KEY:
    sys.exit("OPENAI_API_KEY not set")

PALETTE = (
    "Strict limited palette only: warm cream paper (#F4F1E9) background, "
    "near-black ink (#111111), and a single bold accent red (#C8001A). "
    "No other colors. No text, no letters, no numbers, no words anywhere."
)

JOBS = [
    {
        "out": "public/cards-hero.png",
        "size": "1024x1536",
        "prompt": (
            "Editorial Swiss-style flat vector illustration for a legal-tech product "
            "that audits US credit-card agreements for consumer-unfair clauses. "
            "Central motif: a credit card overlapping a folded contract document, a "
            "magnifying glass inspecting fine-print clause lines, and a small balance "
            "scale of justice. Bauhaus geometric composition, bold thick ink outlines, "
            "flat shapes, high contrast, generous negative space, confident asymmetric "
            "layout, subtle halftone paper grain. Serious, trustworthy, institutional "
            "but modern. " + PALETTE
        ),
    },
    {
        # Landscape, used as a full-bleed page background behind the /loans hero.
        "out": "public/loans-hero.png",
        "size": "1536x1024",
        "prompt": (
            "Editorial Swiss-style flat vector illustration, used as a wide page "
            "background, for a legal-tech product that audits US commercial loan and "
            "credit agreements for borrower-unfavorable clauses. Central motif: a thick "
            "stack of loan-contract documents, a magnifying glass inspecting fine-print "
            "clause lines, a balance scale of justice, and an upward-accelerating arrow "
            "implying debt acceleration. Bauhaus geometric composition, bold thick ink "
            "outlines, flat shapes, high contrast, very generous negative space on the "
            "left for overlaid text, confident asymmetric layout, subtle halftone paper "
            "grain. Serious, trustworthy, institutional but modern. " + PALETTE
        ),
    },
]


def main() -> None:
    for job in JOBS:
        body = json.dumps(
            {"model": "gpt-image-2", "prompt": job["prompt"], "size": job["size"], "n": 1}
        ).encode()
        req = urllib.request.Request(
            API,
            data=body,
            headers={"Authorization": f"Bearer {KEY}", "Content-Type": "application/json"},
        )
        print(f"[gen] {job['out']} ({job['size']}) ...", flush=True)
        with urllib.request.urlopen(req, timeout=300) as resp:
            data = json.load(resp)
        b64 = data["data"][0]["b64_json"]
        os.makedirs(os.path.dirname(job["out"]), exist_ok=True)
        with open(job["out"], "wb") as f:
            f.write(base64.b64decode(b64))
        print(f"[done] wrote {job['out']}", flush=True)


if __name__ == "__main__":
    main()
