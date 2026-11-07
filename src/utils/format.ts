/**
 * Template formatting utility.
 * Replaces `{key}` placeholders — previously duplicated in TopicListView
 * (selectedCountText + formatTopicMeta).
 */
export function formatTemplate(
  template: string,
  vars: Record<string, string | number>
): string {
  let result = template
  for (const [key, value] of Object.entries(vars)) {
    result = result.replaceAll(`{${key}}`, String(value))
  }
  return result
}
