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

// KaTeX math rules: block $$...$$ before inline rules so display math wins.
// Inline requires a non-space char after the opening $ (currency protection);
// escaped \$ and code spans are handled by markdown-it's own rules first.
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

function isValidTex(candidate: string): boolean {
  const trimmed = candidate.trim()
  if (!trimmed) return false
  // A digit immediately after the closing $ means this was likely currency
  return true
}

markdownParser.inline.ruler.before('escape', 'katex_inline', (state, silent) => {
  const src = state.src
  const start = state.pos
  if (src[start] !== '$') return false
  if (src[start + 1] === '$') return false // block delimiter
  const end = src.indexOf('$', start + 1)
  if (end === -1 || end === start + 1) return false
  // Currency protection: "$5 and $10" — a digit right after the opening $
  if (/\d/.test(src[start + 1])) return false
  const tex = src.slice(start + 1, end)
  if (!isValidTex(tex)) return false
  const rendered = tryRenderTex(tex, false)
  if (rendered === null) return false
  if (!silent) {
    const token = state.push('html_inline', '', 0)
    token.content = rendered
  }
  state.pos = end + 1
  return true
})

markdownParser.block.ruler.before('fence', 'katex_block', (state, startLine, endLine, silent) => {
  const startPos = state.bMarks[startLine] + state.tShift[startLine]
  const src = state.src
  if (src.slice(startPos, startPos + 2) !== '$$') return false
  // Find closing $$ (may span lines)
  const contentStart = startPos + 2
  const endIdx = src.indexOf('$$', contentStart)
  if (endIdx === -1) return false
  if (silent) return true
  const tex = src.slice(contentStart, endIdx).replace(/^\n+|\n+$/g, '')
  const rendered = tryRenderTex(tex, true)
  const token = state.push('html_block', '', 0)
  token.content = rendered ?? ''
  token.map = [startLine, endLine]
  const closeLine = src.slice(0, endIdx).split('\n').length - 1
  state.line = closeLine + 1
  return true
})

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
