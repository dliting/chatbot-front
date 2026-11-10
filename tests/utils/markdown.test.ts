/**
 * Unit tests for markdown formatting functions
 */
import { describe, it, expect } from 'vitest'
import { formatMarkdownContent } from '@/utils/helpers'

describe('formatMarkdownContent', () => {
  it('should convert bold text', () => {
    const result = formatMarkdownContent('**bold**')
    expect(result).toContain('<strong>bold</strong>')
  })

  it('should convert italic text', () => {
    const result = formatMarkdownContent('*italic*')
    expect(result).toContain('<em>italic</em>')
  })

  it('should convert code blocks', () => {
    const result = formatMarkdownContent('```js\nconst x = 1\n```')
    expect(result).toContain('<pre>')
    expect(result).toContain('<code')
    expect(result).toContain('hljs')
  })

  it('should convert inline code', () => {
    const result = formatMarkdownContent('`code`')
    expect(result).toContain('<code>')
  })

  it('should convert links', () => {
    const result = formatMarkdownContent('[link](https://example.com)')
    expect(result).toContain('<a href="https://example.com">link</a>')
  })

  it('should convert tables', () => {
    const result = formatMarkdownContent('| a | b |\n| - | - |\n| 1 | 2 |')
    expect(result).toContain('<table>')
    expect(result).toContain('<td>')
  })

  it('should convert lists', () => {
    const result = formatMarkdownContent('- item1\n- item2')
    expect(result).toContain('<ul>')
    expect(result).toContain('<li>')
  })

  it('should escape HTML tags', () => {
    const result = formatMarkdownContent('<script>alert(1)</script>')
    expect(result).not.toContain('<script>')
    expect(result).toContain('&lt;script&gt;')
  })

  it('should handle empty string', () => {
    expect(formatMarkdownContent('')).toBe('')
  })

  it('should handle code block wrapper', () => {
    const result = formatMarkdownContent('```js\nconst x = 1\n```')
    expect(result).toContain('code-block-wrapper')
    expect(result).toContain('markdown-copy-btn')
  })

  it('should place copy button inside wrapper and outside pre', () => {
    const result = formatMarkdownContent('```js\nconsole.log(1)\n```')
    const div = document.createElement('div')
    div.innerHTML = result

    const wrapper = div.querySelector('.code-block-wrapper')
    expect(wrapper).toBeTruthy()

    const btn = wrapper?.querySelector('button.markdown-copy-btn')
    expect(btn).toBeTruthy()

    const pre = wrapper?.querySelector('pre')
    expect(pre).toBeTruthy()

    // Button is a sibling of pre inside the wrapper, never nested inside pre
    expect(btn?.closest('pre')).toBeNull()
  })

  it('should keep highlight.js output intact', () => {
    const result = formatMarkdownContent('```js\nconsole.log(1)\n```')
    expect(result).toContain('hljs language-js')
  })
})

describe('GFM task lists', () => {
  it('renders unchecked task items as disabled checkboxes', () => {
    const result = formatMarkdownContent('- [ ] 待办事项')
    expect(result).toContain('<input')
    expect(result).toContain('type="checkbox"')
    expect(result).toContain('disabled')
    expect(result).toContain('task-list-item')
    expect(result).toContain('待办事项')
  })

  it('renders checked task items as checked', () => {
    const result = formatMarkdownContent('- [x] 已完成事项')
    expect(result).toContain('checked')
    expect(result).toContain('已完成事项')
  })
})

describe('KaTeX math rendering', () => {
  it('renders inline math $...$ into katex spans', () => {
    const result = formatMarkdownContent('能量公式 $E=mc^2$ 很有名')
    expect(result).toContain('class="katex"')
    expect(result).toContain('mathnormal') // glyph spans carry the math font class
  })

  it('renders block math $$...$$ into display mode', () => {
    const result = formatMarkdownContent('$$\\nx = \\\\frac{1}{2}\\n$$')
    expect(result).toContain('katex-display')
  })

  it('does not render dollar amounts as math', () => {
    const result = formatMarkdownContent('它值 $5 and $10 总共')
    expect(result).not.toContain('katex')
    expect(result).toContain('$5')
  })

  it('does not render math inside code blocks', () => {
    const result = formatMarkdownContent('```\n$E=mc^2$\n```')
    expect(result).not.toContain('katex')
  })

  it('shows raw text for invalid LaTeX without throwing', () => {
    const result = formatMarkdownContent('$\frac{1}{$ 无效公式')
    expect(result).toBeTruthy()
  })

  it('katex output survives DOMPurify (classes kept, no script)', () => {
    const result = formatMarkdownContent('公式 $x^2$ 与 $$y$$')
    expect(result).toContain('katex')
    expect(result).not.toContain('<script')
  })
})

describe('KaTeX rule robustness (review fixes)', () => {
  it('preserves trailing text after a same-line $$...$$ pair', () => {
    const result = formatMarkdownContent('$$E=mc^2$$ 这就是质能方程')
    expect(result).toContain('katex-display')
    expect(result).toContain('这就是质能方程')
  })

  it('preserves trailing text inside list items with inline pairs', () => {
    const result = formatMarkdownContent('- $$x$$ item note')
    expect(result).toContain('item note')
    expect(result).not.toContain('$$')
  })

  it('does not let an unclosed $$ swallow a later code fence', () => {
    const result = formatMarkdownContent('$$\necho $$\n```bash\nafter fence\n```')
    expect(result).toContain('<pre>')
    expect(result).toContain('after fence')
  })

  it('does not pull plain lines after a blockquote into math', () => {
    const result = formatMarkdownContent('> $$x\n\nplain $$z')
    expect(result).not.toContain('katex')
  })

  it('rejects whitespace-bounded inline math ($ x $)', () => {
    const result = formatMarkdownContent('$ x $')
    expect(result).not.toContain('katex')
  })

  it('renders math starting with digits ($2x+1$)', () => {
    const result = formatMarkdownContent('$2x+1$ 是多项式')
    expect(result).toContain('katex')
  })

  it('does not pair inline math across newlines', () => {
    const result = formatMarkdownContent('函数 $f(x) 定义见\n附录 $g(y)')
    expect(result).not.toContain('katex')
  })

  it('renders a katex-error span for ParseError block math', () => {
    const result = formatMarkdownContent('$$\n\\frac{1}{\n$$')
    expect(result).toContain('katex-error')
  })

  it('renders \\(...\\) inline math', () => {
    const result = formatMarkdownContent('质能 \\(E=mc^2\\) 方程')
    expect(result).toContain('katex')
  })

  it('renders \\[...\\] block math', () => {
    const result = formatMarkdownContent('\\[\nx^2\n\\]')
    expect(result).toContain('katex-display')
  })
})
