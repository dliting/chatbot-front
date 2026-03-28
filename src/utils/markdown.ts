/**
 * Markdown utility functions
 */

import MarkdownIt from 'markdown-it'
import hljs from 'highlight.js'
import DOMPurify from 'dompurify'

// Markdown-it instance with security options
const markdownParser = new MarkdownIt({
  html: false,        // Disable HTML tags
  linkify: true,      // Convert URLs to links
  typographer: true,  // Smart quotes and dashes
  breaks: true,      // Convert \n to <br>
})

// Highlight code blocks with highlight.js
function highlightCodeBlocks(html: string): string {
  return html.replace(/<pre><code(?:\s+class="language-(\w+)")?>([\s\S]*?)<\/code><\/pre>/g, (match, lang, code) => {
    // Decode HTML entities that markdown-it may have created
    const decodedCode = code
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")

    const language = lang && hljs.getLanguage(lang) ? lang : 'plaintext'
    const highlighted = hljs.highlight(decodedCode.trim(), { language }).value
    return `<div class="code-block-wrapper"><pre><code class="hljs language-${language}">${highlighted}</code></pre><button class="code-copy-btn" type="button">复制</button></div>`
  })
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

/**
 * Convert markdown to simple HTML (basic implementation)
 * For production, consider using a proper markdown library
 */
export function markdownToHTML(markdown: string): string {
  return markdown
    .replace(/```(\w+)?\n([\s\S]*?)```/g, '<pre><code>$2</code></pre>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>')
    .replace(/\n/g, '<br>')
}
