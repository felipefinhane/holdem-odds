import { describe, expect, it } from 'vitest'
import { DEFAULT_PREFERENCES, isPreferences } from './preferences'

describe('isPreferences', () => {
  it('aceita os dois modos de privacidade', () => {
    expect(isPreferences(DEFAULT_PREFERENCES)).toBe(true)
    expect(isPreferences({ revealMode: 'hold' })).toBe(true)
  })

  it('rejeita valores salvos inválidos', () => {
    expect(isPreferences(null)).toBe(false)
    expect(isPreferences({ revealMode: 'sempre' })).toBe(false)
  })
})
