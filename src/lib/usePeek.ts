import { type KeyboardEvent, type MouseEvent, type PointerEvent, useCallback, useEffect, useState } from 'react'

// "Segurar para espiar": fica true enquanto o dedo (ou mouse, ou tecla) está pressionado.
// A soltura é ouvida na janela inteira, porque o conteúdo muda de lugar ao aparecer e o dedo
// pode terminar fora do botão.
export function usePeek() {
  const [peeking, setPeeking] = useState(false)

  useEffect(() => {
    if (!peeking) return
    const stop = () => setPeeking(false)
    const events = ['pointerup', 'pointercancel', 'blur', 'keyup'] as const
    events.forEach((event) => window.addEventListener(event, stop))
    document.addEventListener('visibilitychange', stop)
    return () => {
      events.forEach((event) => window.removeEventListener(event, stop))
      document.removeEventListener('visibilitychange', stop)
    }
  }, [peeking])

  const start = useCallback(() => setPeeking(true), [])

  // Propriedades para o botão de espiar.
  const handlers = {
    onPointerDown: (event: PointerEvent) => {
      event.preventDefault()
      start()
    },
    onKeyDown: (event: KeyboardEvent) => {
      if (event.key === ' ' || event.key === 'Enter') {
        event.preventDefault()
        start()
      }
    },
    onContextMenu: (event: MouseEvent) => event.preventDefault(),
  }

  return { peeking, handlers }
}
