# Font Subset Maintenance

The project bundles Noto Sans SC as local woff2 subsets (offline deployment —
no CDN). Full TTFs are ~10.5 MB per weight; the subsets are ~550 KB while
covering every character the UI can render:

- all static source text of the library and the chatapp example
- **GB2312 level-1** (the 3755 most common Chinese characters) — user and
  assistant chat messages, topic titles, etc.
- ASCII printable, common CJK punctuation, fullwidth forms

Characters outside the subset fall back to system fonts via the `font-family`
stack (`'Noto Sans SC', -apple-system, ... PingFang SC, Microsoft YaHei`),
so rare characters still render — just not in Noto.

## Regenerating the subsets

Needed when UI copy changes or the font is upgraded:

1. Put the four source TTFs (`NotoSansSC-{Light,Regular,Medium,Bold}.ttf`)
   into `scripts/fonts/src/` (gitignored). Download them from the official
   [Noto Sans SC release](https://github.com/notofonts/noto-cjk/releases) —
   offline environments can transfer the release archive manually.
2. Run from the repo root (requires `fonttools` + `brotli` for woff2):

   ```bash
   python scripts/fonts/subset-fonts.py
   ```

   This regenerates the woff2 files in both `public/fonts/noto-sans-sc/` and
   `examples/chatapp/frontend/public/fonts/noto-sans-sc/` (kept identical).

3. Verify in a browser (`npm run dev`, then in a second terminal):

   ```bash
   node tests/verify-fonts.cjs
   ```
