// Ambient declarations for untyped vendor packages (no @types available)

declare module 'markdown-it-task-lists' {
  interface TaskListsOptions {
    /** Render checkboxes as disabled (read-only display) */
    enabled?: boolean
    label?: boolean
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- plugin signature variance vs markdown-it's typed .use()
  const taskLists: (options?: TaskListsOptions) => any
  export default taskLists
}
