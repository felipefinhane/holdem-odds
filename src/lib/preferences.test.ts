import { describe, expect, it } from 'vitest'
import { DEFAULT_PREFERENCES, isPreferences } from './preferences'
import { DOUBLE_TAP_MS, isDoubleTap } from './reveal'

describe('isPreferences', () => {
  it('aceita os gestos e tempos válidos', () => {
    expect(isPreferences(DEFAULT_PREFERENCES)).toBe(true)
    expect(isPreferences({ revealGesture: 'long-press', autoHideSeconds: 30 })).toBe(true)
  })

  it('rejeita valores inválidos e o formato antigo (volta ao padrão)', () => {
    expect(isPreferences(null)).toBe(false)
    expect(isPreferences({ revealGesture: 'tap', autoHideSeconds: 7 })).toBe(false)
    expect(isPreferences({ revealMode: 'hold' })).toBe(false)
  })
})

describe('isDoubleTap', () => {
  it('dois toques rápidos contam como toque duplo', () => {
    expect(isDoubleTap(1000, 1000 + DOUBLE_TAP_MS - 50)).toBe(true)
  })

  it('toques espaçados ou o primeiro toque não contam', () => {
    expect(isDoubleTap(1000, 1000 + DOUBLE_TAP_MS + 50)).toBe(false)
    expect(isDoubleTap(0, 500)).toBe(false)
  })
})
