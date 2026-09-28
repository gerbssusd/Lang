"""Reproduce the stylometric counts on slide 26.

Usage:  python analysis/stylometrics.py "Gerbs_Anthology_of_Short_Stories.pdf"
Requires poppler's `pdftotext`. Page ranges are the anthology's PDF pages.
"""
import json, re, subprocess, sys

RANGES = {"Fitzgerald": (150, 197), "Gilman": (198, 216), "Chopin": (217, 221)}
BYLINE = r"^.*?by (F\. Scott Fitzgerald 1|Charlotte Perkins Gilman|Kate Chopin)"
COLOR = {"yellow","gold","golden","white","black","green","blue","pink","rose","red","crimson","amber",
         "silver","violet","sulphur","orange","ivory","ebony","turquoise","sapphire","ruby","emerald"}

def text(pdf, a, b):
    out = subprocess.run(["pdftotext", "-f", str(a), "-l", str(b), pdf, "-"], capture_output=True, text=True).stdout
    return " ".join(re.sub(BYLINE, "", out, flags=re.S).split())

def measure(t):
    words = re.findall(r"[A-Za-z’']+", t); lw = [w.lower() for w in words]; n = len(words)
    sents = [s for s in re.split(r'(?<=[.!?])["”’]?\s+(?=["“A-Z])', t) if s.split()]
    lens = [len(re.findall(r"[A-Za-z’']+", s)) for s in sents]
    k = lambda c: round(c / n * 1000, 1)
    return {"words": n, "mean_sentence_len": round(sum(lens) / len(lens), 1),
            "exclamations_per_1k": k(t.count("!")), "em_dashes_per_1k": k(t.count("—")),
            "I_per_1k": k(lw.count("i")), "color_gem_per_1k": k(sum(w in COLOR for w in lw))}

if __name__ == "__main__":
    pdf = sys.argv[1]
    print(json.dumps({a: measure(text(pdf, *r)) for a, r in RANGES.items()}, indent=1))
