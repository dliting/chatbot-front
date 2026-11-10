/**
 * Markdown utility functions
 */

import MarkdownIt from 'markdown-it'
import hljs from 'highlight.js'
import DOMPurify from 'dompurify'
import katex from 'katex'
import 'katex/dist/katex.min.css'
import markdownItTaskLists from 'markdown-it-task-lists'

// Markdown-it instance with security options
const markdownParser = new MarkdownIt({
  html: false, // Disable HTML tags
  linkify: true, // Convert URLs to links
  typographer: true, // Smart quotes and dashes
  breaks: true, // Convert \n to <br>
})

// GFM task lists (- [ ] / - [x]) — read-only checkboxes
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- ambient declaration loosened for plugin signature variance
markdownParser.use(markdownItTaskLists as any, { enabled: false })

function tryRenderTex(src: string, displayMode: boolean): string | null {
  try {
    return katex.renderToString(src, {
      throwOnError: false,
      displayMode,
      output: 'html',
      strict: false,
    })
  } catch {
    return null
  }
}

function isNonSpace(ch: string | undefined): boolean {
  return ch !== undefined && !/\s/.test(ch)
}

/**
 * Inline math: handles $...$ (inline) and same-line $$...$$ (display).
 * Pandoc-style two-sided non-whitespace boundaries; single-line only
 * (no pairing across newlines); currency like "$5 and $10" is rejected
 * because the closing delimiter is preceded by a space.
 */
markdownParser.inline.ruler.before('escape', 'katex_inline', (state, silent) => {
  const src = state.src
  const pos = state.pos
  if (src[pos] !== '$') return false
  const isDisplay = src[pos + 1] === '$'
  const delimLen = isDisplay ? 2 : 1

  // Same-line pairing only
  const lineEnd = src.indexOf('\n', pos)
  const searchEnd = lineEnd === -1 ? src.length : lineEnd

  const close = src.indexOf(isDisplay ? '$$' : '$', pos + delimLen)
  if (close === -1 || close >= searchEnd) return false

  const tex = src.slice(pos + delimLen, close)
  if (!tex.trim()) return false
  // Two-sided non-whitespace boundaries (currency/whitespace protection)
  if (!isNonSpace(tex[0]) || !isNonSpace(tex[tex.length - 1])) return false

  const rendered = tryRenderTex(tex, isDisplay)
  if (rendered === null) return false

  if (!silent) {
    const token = state.push('html_inline', '', 0)
    token.content = rendered
  }
  state.pos = close + delimLen
  return true
})

/**
 * Inline \(...\) math (same line)
 */
markdownParser.inline.ruler.before('escape', 'katex_paren_inline', (state, silent) => {
  const src = state.src
  const pos = state.pos
  if (src.slice(pos, pos + 2) !== '\\(') return false
  const close = src.indexOf('\\)', pos + 2)
  if (close === -1) return false
  const tex = src.slice(pos + 2, close)
  if (!tex.trim()) return false
  const rendered = tryRenderTex(tex, false)
  if (rendered === null) return false
  if (!silent) {
    const token = state.push('html_inline', '', 0)
    token.content = rendered
  }
  state.pos = close + 2
  return true
})

/**
 * Block math $$...$$: the opening line starts with $$ and the closing line
 * is exactly $$. A same-line pair falls through to the inline rule so any
 * trailing text on that line is preserved.
 */
markdownParser.block.ruler.before(
  'fence',
  'katex_block',
  (state, startLine, endLine, silent) => {
    const startPos = state.bMarks[startLine] + state.tShift[startLine]
    const src = state.src
    const openingLine = src.slice(startPos, state.eMarks[startLine]).trim()
    if (!openingLine.startsWith('$$')) return false
    // Same-line pair → the inline rule renders it with trailing text intact
    if (openingLine.length > 2 && openingLine.slice(2).includes('$$')) return false

    // Scan forward (within the container) for a closing line that is exactly $$
    for (let line = startLine + 1; line < endLine; line++) {
      const lineStart = state.bMarks[line] + state.tShift[line]
      if (src.slice(lineStart, state.eMarks[line]).trim() === '$$') {
        if (silent) return true
        const contentLines: string[] = []
        for (let l = startLine + 1; l < line; l++) {
          contentLines.push(src.slice(state.bMarks[l] + state.tShift[l], state.eMarks[l]))
        }
        const tex = contentLines.join('\n').trim()
        const rendered = tryRenderTex(tex, true)
        if (rendered === null) return false // let it fall back to literal text
        const token = state.push('html_block', '', 0)
        token.content = rendered
        token.map = [startLine, line + 1]
        state.line = line + 1
        return true
      }
    }
    return false
  },
  { alt: ['paragraph', 'reference', 'blockquote', 'list'] }
)

/**
 * Block \[...\] math: opening line ends with \[ (or is exactly \[);
 * closing line starts with \] (or is exactly \]).
 */
markdownParser.block.ruler.before(
  'fence',
  'katex_bracket_block',
  (state, startLine, endLine, silent) => {
    const startPos = state.bMarks[startLine] + state.tShift[startLine]
    const src = state.src
    const openingLine = src.slice(startPos, state.eMarks[startLine]).trim()
    if (!openingLine.endsWith('\\[')) return false

    for (let line = startLine + 1; line < endLine; line++) {
      const lineStart = state.bMarks[line] + state.tShift[line]
      const lineText = src.slice(lineStart, state.eMarks[line]).trim()
      if (!lineText.endsWith('\\]')) continue
      if (silent) return true

      const contentLines: string[] = []
      const first = src.slice(
        state.bMarks[startLine] + state.tShift[startLine],
        state.eMarks[startLine]
      )
      contentLines.push(first.slice(0, first.length - 2).trim())
      for (let l = startLine + 1; l < line; l++) {
        contentLines.push(src.slice(state.bMarks[l] + state.tShift[l], state.eMarks[l]))
      }
      const last = src.slice(lineStart, state.eMarks[line])
      contentLines.push(last.slice(0, last.length - 2).trim())
      const tex = contentLines.filter(Boolean).join('\n')
      const rendered = tryRenderTex(tex, true)
      if (rendered === null) return false
      const token = state.push('html_block', '', 0)
      token.content = rendered
      token.map = [startLine, line + 1]
      state.line = line + 1
      return true
    }
    return false
  },
  { alt: ['paragraph', 'reference', 'blockquote', 'list'] }
)

// Highlight code blocks with highlight.js
function highlightCodeBlocks(html: string): string {
  return html.replace(
    /<pre><code(?:\s+class="language-(\w+)")?>([\s\S]*?)<\/code><\/pre>/g,
    (_match, lang, code) => {
      // Decode HTML entities that markdown-it may have created
      const decodedCode = code
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&amp;/g, '&')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")

      const language = lang && hljs.getLanguage(lang) ? lang : 'plaintext'
      const highlighted = hljs.highlight(decodedCode.trim(), { language }).value
      return `<div class="code-block-wrapper"><pre><code class="hljs language-${language}">${highlighted}</code></pre><button class="markdown-copy-btn" type="button" aria-label="copy">Copy</button></div>`
    }
  )
}

/**
 * Format markdown content with syntax highlighting
 *预留 Mermaid 扩展接口
 */
export function formatMarkdownContent(content: string): string {
  if (!content) return ''

  // Parse markdown (markdown-it with html: false prevents raw HTML)
  let html = markdownParser.render(content)

  // Sanitize with DOMPurify for XSS protection
  html = DOMPurify.sanitize(html)

  // Highlight code blocks and decode HTML entities
  html = highlightCodeBlocks(html)

  // Future extension: renderMermaid(html)

  return html
}
