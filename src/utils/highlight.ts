/**
 * Search-highlight utility with XSS protection.
 * Extracted from TopicListView (was inline, untested).
 */
import { escapeHTML } from './string'

/**
 * Escape HTML in `text`, then wrap case-insensitive `query` matches in <mark>.
 * The query's regex metacharacters are treated literally.
 */
export function highlightText(text: string, query: string): string {
  if (!query.trim()) {
    return escapeHTML(text)
  }
  // First escape HTML to prevent XSS
  const escapedText = escapeHTML(text)
  // Then escape special regex characters in the query
  const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const regex = new RegExp(`(${escapedQuery})`, 'gi')
  return escapedText.replace(regex, '<mark>$1</mark>')
}
