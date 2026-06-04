"""One-off: generate editorial hero/illustration assets via OpenAI gpt-image-2.

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
        "out": "public/hero-illustration.png",
        "size": "1024x1536",
        "prompt": (
            "Editorial Swiss-style flat vector illustration for a Korean legal-tech "
            "product that audits insurance policy contracts for consumer-unfair clauses. "
            "Central motif: a large protective shield overlapping a folded paper contract "
            "document, with a magnifying glass inspecting fine-print clause lines on the "
            "document. Bauhaus geometric composition, bold thick ink outlines, flat shapes, "
            "high contrast, generous negative space, confident asymmetric layout, subtle "
            "halftone paper grain. Serious, trustworthy, institutional but modern. "
            + PALETTE
        ),
    },
    {
        "out": "public/report-empty.png",
        "size": "1024x1024",
        "prompt": (
            "Editorial Swiss-style flat vector spot illustration: a clean checkmark inside "
            "a shield over a simple document, signaling a completed safe review. Minimal, "
            "bold ink outlines, flat geometric shapes, lots of negative space. " + PALETTE
        ),
    },
]


def main() -> None:
    for job in JOBS:
        body = json.dumps(
            {
                "model": "gpt-image-2",
                "prompt": job["prompt"],
                "size": job["size"],
                "n": 1,
            }
        ).encode()
        req = urllib.request.Request(
            API,
            data=body,
            headers={
                "Authorization": f"Bearer {KEY}",
                "Content-Type": "application/json",
            },
        )
        print(f"[gen] {job['out']} ({job['size']}) ...", flush=True)
        with urllib.request.urlopen(req, timeout=300) as resp:
            data = json.load(resp)
        b64 = data["data"][0]["b64_json"]
        out_path = job["out"]
        os.makedirs(os.path.dirname(out_path), exist_ok=True)
        with open(out_path, "wb") as f:
            f.write(base64.b64decode(b64))
        print(f"[done] wrote {out_path}", flush=True)


if __name__ == "__main__":
    main()
