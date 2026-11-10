// Ambient declarations for untyped vendor packages (no @types available)

declare module 'markdown-it-task-lists' {
  import type MarkdownIt from 'markdown-it'
  interface TaskListsOptions {
    /** Render checkboxes as disabled (read-only display) */
    enabled?: boolean
    label?: boolean
  }
  const taskLists: (options?: TaskListsOptions) => any
  export default taskLists
}
