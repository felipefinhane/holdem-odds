import { useEffect, useState } from 'react'

// Estado salvo no navegador. Se o armazenamento falhar (aba anônima, bloqueio), funciona só em memória.
export function useStoredState<T>(key: string, initial: T, isValid: (value: unknown) => value is T) {
  const [value, setValue] = useState<T>(() => {
    try {
      const stored: unknown = JSON.parse(localStorage.getItem(key) ?? 'null')
      return isValid(stored) ? stored : initial
    } catch {
      return initial
    }
  })

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value))
    } catch {
      // Sem armazenamento: o valor vale só nesta sessão.
    }
  }, [key, value])

  return [value, setValue] as const
}
