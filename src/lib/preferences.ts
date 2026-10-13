// Como as informações escondidas voltam a aparecer:
// 'toggle' = um toque esconde e outro mostra; 'hold' = só aparecem enquanto você segura o botão.
export type RevealMode = 'toggle' | 'hold'

export type Preferences = {
  revealMode: RevealMode
}

export const DEFAULT_PREFERENCES: Preferences = { revealMode: 'toggle' }

export function isPreferences(value: unknown): value is Preferences {
  return typeof value === 'object' && value !== null && ['toggle', 'hold'].includes((value as Preferences).revealMode)
}
