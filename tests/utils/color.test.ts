import { describe, it, expect } from 'vitest'
import { mixColor, isValidHex, derivePrimaryVariants, clampFontScale } from '@/utils/color'

describe('isValidHex', () => {
  it('accepts 3-digit and 6-digit hex', () => {
    expect(isValidHex('#fff')).toBe(true)
    expect(isValidHex('#409eff')).toBe(true)
    expect(isValidHex('409eff')).toBe(true)
  })

  it('rejects invalid inputs', () => {
    expect(isValidHex('')).toBe(false)
    expect(isValidHex('red')).toBe(false)
    expect(isValidHex('#ff')).toBe(false)
    expect(isValidHex('#12345')).toBe(false)
    expect(isValidHex('#gggggg')).toBe(false)
  })
})

describe('mixColor', () => {
  it('returns A at ratio 0 and B at ratio 1', () => {
    expect(mixColor('#000000', '#ffffff', 0)).toBe('#000000')
    expect(mixColor('#000000', '#ffffff', 1)).toBe('#ffffff')
  })

  it('interpolates channels linearly (midpoint)', () => {
    expect(mixColor('#000000', '#ffffff', 0.5)).toBe('#808080')
    expect(mixColor('#409eff', '#ffffff', 0.5)).toBe('#a0cfff')
  })

  it('mixes toward white for hover-like variants', () => {
    // #409eff + 25% white
    expect(mixColor('#409eff', '#ffffff', 0.25)).toBe('#70b6ff')
  })

  it('mixes toward black for active-like variants', () => {
    // #409eff + 15% black
    expect(mixColor('#409eff', '#000000', 0.15)).toBe('#3686d9')
  })

  it('normalizes 3-digit hex before mixing', () => {
    expect(mixColor('#0af', '#fff', 1)).toBe('#ffffff')
    expect(mixColor('#0af', '#000', 0)).toBe('#00aaff')
  })

  it('clamps ratio outside [0,1]', () => {
    expect(mixColor('#000000', '#ffffff', -0.5)).toBe('#000000')
    expect(mixColor('#000000', '#ffffff', 1.5)).toBe('#ffffff')
  })
})

describe('derivePrimaryVariants', () => {
  it('derives the five variants with the same relationships as the scss defaults', () => {
    // Designer-picked scss defaults (#66b1ff…) are close to but not exactly the
    // linear mixes — the derived set preserves the light/dark relationships.
    const v = derivePrimaryVariants('#409eff')
    expect(v).toEqual({
      hover: '#70b6ff',      // 25% white
      active: '#3686d9',     // 15% black
      light: '#e2f0ff',      // 85% white
      lightBorder: '#c6e2ff', // 70% white
      dark: '#2d6fb3',       // 30% black
    })
  })

  it('returns null for invalid input', () => {
    expect(derivePrimaryVariants('red')).toBeNull()
    expect(derivePrimaryVariants('')).toBeNull()
  })
})

describe('clampFontScale', () => {
  it('keeps in-range values', () => {
    expect(clampFontScale(1)).toBe(1)
    expect(clampFontScale(0.75)).toBe(0.75)
    expect(clampFontScale(1.5)).toBe(1.5)
  })

  it('clamps out-of-range values', () => {
    expect(clampFontScale(0.5)).toBe(0.75)
    expect(clampFontScale(2)).toBe(1.5)
  })
})
