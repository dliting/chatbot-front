/**
 * Color utilities for theme derivation (cross-platform pure functions).
 *
 * derivePrimaryVariants reproduces the SCSS default variants of
 * --theme-primary (chatbot.scss) so a host-configured primaryColor keeps
 * the same hover/active/light relationships.
 */

/** Expand #abc → #aabbcc; returns lowercase 6-digit hex or null when invalid */
export function normalizeHex(input: string): string | null {
  let hex = input.trim().replace(/^#/, '').toLowerCase()
  if (hex.length === 3) hex = hex.replace(/(.)/g, '$1$1')
  if (!/^[0-9a-f]{6}$/.test(hex)) return null
  return `#${hex}`
}

export function isValidHex(input: string): boolean {
  return normalizeHex(input) !== null
}

function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

function rgbToHex(r: number, g: number, b: number): string {
  const to2 = (v: number) => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, '0')
  return `#${to2(r)}${to2(g)}${to2(b)}`
}

/** Linear interpolation between two hex colors; ratio 0 → a, 1 → b (clamped) */
export function mixColor(hexA: string, hexB: string, ratio: number): string {
  const a = normalizeHex(hexA)
  const b = normalizeHex(hexB)
  if (!a || !b) return hexA
  const r = Math.max(0, Math.min(1, ratio))
  const [ar, ag, ab] = hexToRgb(a)
  const [br, bg, bb] = hexToRgb(b)
  return rgbToHex(ar + (br - ar) * r, ag + (bg - ag) * r, ab + (bb - ab) * r)
}

export interface PrimaryVariants {
  hover: string
  active: string
  light: string
  lightBorder: string
  dark: string
}

/** Derive the five --theme-primary-* variants from a base primary color */
export function derivePrimaryVariants(primary: string): PrimaryVariants | null {
  const base = normalizeHex(primary)
  if (!base) return null
  return {
    hover: mixColor(base, '#ffffff', 0.25),
    active: mixColor(base, '#000000', 0.15),
    light: mixColor(base, '#ffffff', 0.85),
    lightBorder: mixColor(base, '#ffffff', 0.7),
    dark: mixColor(base, '#000000', 0.3),
  }
}

const FONT_SCALE_MIN = 0.75
const FONT_SCALE_MAX = 1.5

/** Clamp a host-provided font scale into the supported range */
export function clampFontScale(value: number): number {
  if (!Number.isFinite(value)) return 1
  return Math.max(FONT_SCALE_MIN, Math.min(FONT_SCALE_MAX, value))
}
