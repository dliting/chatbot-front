export interface ResolvedIcon {
  type: 'builtin' | 'path' | 'letter'
  value: string
}

const BUILTIN_ICON_NAMES = [
  'write',
  'analyze',
  'translate',
  'code',
  'search',
  'chat',
  'brain',
  'tool',
] as const
export type BuiltinIconName = (typeof BUILTIN_ICON_NAMES)[number]

export function isBuiltinIconName(name: string): name is BuiltinIconName {
  return (BUILTIN_ICON_NAMES as readonly string[]).includes(name)
}

export function resolveQuickActionIcon(icon: string | undefined, iconBase?: string): ResolvedIcon {
  if (!icon) return { type: 'letter', value: '' }
  if (isBuiltinIconName(icon)) return { type: 'builtin', value: icon }
  if (icon.startsWith('/') || icon.startsWith('http')) return { type: 'path', value: icon }
  if (iconBase) return { type: 'path', value: `${iconBase.replace(/\/$/, '')}/${icon}` }
  return { type: 'letter', value: '' }
}
