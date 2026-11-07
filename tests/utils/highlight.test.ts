import { describe, it, expect } from 'vitest'
import { highlightText } from '@/utils/highlight'

describe('highlightText', () => {
  it('wraps case-insensitive matches in <mark>', () => {
    expect(highlightText('Hello World', 'world')).toBe('Hello <mark>World</mark>')
  })

  it('escapes HTML in the source text (XSS protection)', () => {
    const result = highlightText('<script>alert(1)</script>topic', 'topic')
    expect(result).not.toContain('<script>')
    expect(result).toContain('&lt;script&gt;')
    expect(result).toContain('<mark>topic</mark>')
  })

  it('treats regex metacharacters in the query literally', () => {
    expect(highlightText('a(b)c text', 'a(b)c')).toBe('<mark>a(b)c</mark> text')
    expect(highlightText('dots... here', '...')).toBe('dots<mark>...</mark> here')
  })

  it('returns escaped text unchanged when query is blank', () => {
    expect(highlightText('<b>bold</b>', '   ')).toBe('&lt;b&gt;bold&lt;/b&gt;')
  })

  it('escapes the query itself before matching (no HTML from query)', () => {
    const result = highlightText('x <b>y</b>', '<b>')
    expect(result).not.toContain('<b>y')
    expect(result).toContain('&lt;b&gt;')
  })
})
