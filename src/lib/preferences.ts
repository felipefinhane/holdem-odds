// Gesto no botão de olho para mostrar as informações escondidas. Esconder é sempre um toque.
export type RevealGesture = 'tap' | 'double-tap' | 'long-press'

export type Preferences = {
  revealGesture: RevealGesture
  // Esconde sozinho depois desse tempo sem mexer no celular (0 = nunca).
  autoHideSeconds: number
}

export const AUTO_HIDE_OPTIONS = [0, 15, 30, 60]

export const DEFAULT_PREFERENCES: Preferences = { revealGesture: 'tap', autoHideSeconds: 0 }

export function isPreferences(value: unknown): value is Preferences {
  if (typeof value !== 'object' || value === null) return false
  const preferences = value as Preferences
  return (
    ['tap', 'double-tap', 'long-press'].includes(preferences.revealGesture) && AUTO_HIDE_OPTIONS.includes(preferences.autoHideSeconds)
  )
}
