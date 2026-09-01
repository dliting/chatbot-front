# Font subset maintenance: build the subset character set and regenerate the
# woff2 subsets for the four Noto Sans SC weights, writing them to BOTH font
# locations (library public/ and chatapp example public/) so the two stay in
# sync. Run from the repo root:
#   python scripts/fonts/subset-fonts.py
#
# charset = extracted static source text + GB2312 level-1 (3755 most common
# Chinese chars) + ASCII printable + common CJK punctuation + fullwidth forms.
# Source TTFs live in scripts/fonts/src/ (gitignored — obtain them from the
# official Noto Sans SC release if regenerating on a fresh clone).
import subprocess
import sys
from pathlib import Path

REPO = Path(__file__).resolve().parents[2]
HERE = REPO / "scripts/fonts"
SRC_DIR = HERE / "src"
FONT_DIRS = [
    REPO / "public/fonts/noto-sans-sc",
    REPO / "examples/chatapp/frontend/public/fonts/noto-sans-sc",
]
WEIGHTS = ["Light", "Regular", "Medium", "Bold"]


def gb2312_level1():
    chars = []
    for hi in range(0xB0, 0xD8):
        for lo in range(0xA1, 0xFF):
            try:
                chars.append(bytes([hi, lo]).decode("gb2312"))
            except UnicodeDecodeError:
                pass
    return "".join(chars)


def main():
    subprocess.run(
        ["node", str(HERE / "extract-chars.mjs")],
        check=True, cwd=REPO,
    )
    extracted = (HERE / "extracted-chars.txt").read_text(encoding="utf-8")

    ascii_printable = "".join(chr(c) for c in range(0x20, 0x7F))
    cjk_punct = "，。、；：？！“”‘’（）《》〈〉【】〔〕—…－·～￥％Ｆ＋①②③④⑤⑥⑦⑧⑨⑩°×÷≈≠≤≥±∞→←↑↓⇒■●▲◆★☆✓✗♥♦★"
    fullwidth_forms = "".join(chr(c) for c in range(0xFF01, 0xFF5F))

    charset = "".join(sorted(set(extracted + gb2312_level1() + ascii_printable + cjk_punct + fullwidth_forms)))
    charset_file = HERE / "subset-chars.txt"
    charset_file.write_text(charset, encoding="utf-8")

    print(f"charset: {len(charset)} unique chars")
    for w in WEIGHTS:
        src = SRC_DIR / f"NotoSansSC-{w}.ttf"
        if not src.exists():
            sys.exit(f"missing source font: {src} (see scripts/fonts/README.md)")
        outs = []
        for font_dir in FONT_DIRS:
            out = font_dir / f"NotoSansSC-{w}.woff2"
            subprocess.run([
                sys.executable, "-m", "fontTools.subset", str(src),
                f"--text-file={charset_file}",
                "--flavor=woff2",
                "--layout-features=*",
                "--no-hinting", "--desubroutinize",
                f"--output-file={out}",
            ], check=True)
            outs.append(f"{out.relative_to(REPO)}: {out.stat().st_size/1e3:.0f}KB")
        print(f"{w}: {src.stat().st_size/1e6:.1f}MB -> " + ", ".join(outs))


if __name__ == "__main__":
    main()
