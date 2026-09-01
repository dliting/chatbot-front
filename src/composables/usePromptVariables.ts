import type { PromptVariableResolver } from '@/types/config'

export interface UsePromptVariablesOptions {
  customResolvers?: Record<string, PromptVariableResolver>
}

export function usePromptVariables(options?: UsePromptVariablesOptions) {
  const builtInResolvers: Record<string, PromptVariableResolver> = {
    date: () => new Date().toLocaleDateString(),
    time: () =>
      new Date().toLocaleTimeString(undefined, {
        hour: '2-digit',
        minute: '2-digit',
      }),
    datetime: () => new Date().toLocaleString(),
    weekday: () => new Date().toLocaleDateString(undefined, { weekday: 'long' }),
  }

  const resolvers: Record<string, PromptVariableResolver> = {
    ...builtInResolvers,
    ...options?.customResolvers,
  }

  async function resolve(prompt: string): Promise<string> {
    const matches = prompt.matchAll(/\{\{(\w+)\}\}/g)
    let result = prompt
    for (const match of matches) {
      const varName = match[1]
      const resolver = resolvers[varName]
      if (resolver) {
        try {
          const value = await resolver(varName)
          result = result.replaceAll(`{{${varName}}}`, value)
        } catch {
          // Resolver failed — leave variable as-is (consistent with unresolved variable behavior)
        }
      }
    }
    return result
  }

  return { resolve }
}
