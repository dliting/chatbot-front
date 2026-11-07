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
