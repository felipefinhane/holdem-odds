import { type KeyboardEvent, type MouseEvent, type PointerEvent, useEffect, useRef, useState } from 'react'
import type { RevealGesture } from './preferences'
import { DOUBLE_TAP_MS, isDoubleTap, LONG_PRESS_MS } from './reveal'

// Liga o gesto escolhido (toque, toque duplo ou segurar) ao botão de mostrar.
// "armed" indica que o gesto começou (primeiro toque, ou dedo pressionado) para dar retorno visual.
export function useRevealGesture(gesture: RevealGesture, reveal: () => void) {
  const [armed, setArmed] = useState(false)
  const lastTap = useRef(0)
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined)

  useEffect(() => () => clearTimeout(timer.current), [])

  const disarm = () => {
    clearTimeout(timer.current)
    setArmed(false)
  }
  const keyboard = {
    onKeyDown: (event: KeyboardEvent) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault()
        reveal()
      }
    },
  }

  if (gesture === 'double-tap')
    return {
      armed,
      handlers: {
        ...keyboard,
        onClick: () => {
          const now = Date.now()
          if (isDoubleTap(lastTap.current, now)) {
            lastTap.current = 0
            disarm()
            reveal()
            return
          }
          lastTap.current = now
          setArmed(true)
          clearTimeout(timer.current)
          timer.current = setTimeout(() => setArmed(false), DOUBLE_TAP_MS)
        },
      },
    }

  if (gesture === 'long-press')
    return {
      armed,
      handlers: {
        ...keyboard,
        onPointerDown: (event: PointerEvent) => {
          event.preventDefault()
          setArmed(true)
          clearTimeout(timer.current)
          timer.current = setTimeout(() => {
            setArmed(false)
            reveal()
          }, LONG_PRESS_MS)
        },
        onPointerUp: disarm,
        onPointerLeave: disarm,
        onPointerCancel: disarm,
        onContextMenu: (event: MouseEvent) => event.preventDefault(),
      },
    }

  return { armed, handlers: { onClick: reveal } }
}

// Esconde depois de alguns segundos sem tocar, rolar ou digitar. Qualquer interação recomeça a contagem.
export function useAutoHide(visible: boolean, seconds: number, hide: () => void) {
  useEffect(() => {
    if (!visible || seconds <= 0) return
    let timer = setTimeout(hide, seconds * 1000)
    const restart = () => {
      clearTimeout(timer)
      timer = setTimeout(hide, seconds * 1000)
    }
    const events = ['pointerdown', 'keydown', 'scroll', 'input'] as const
    events.forEach((event) => window.addEventListener(event, restart, { capture: true, passive: true }))
    return () => {
      clearTimeout(timer)
      events.forEach((event) => window.removeEventListener(event, restart, { capture: true }))
    }
  }, [visible, seconds, hide])
}
