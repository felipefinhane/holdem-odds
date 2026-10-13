import { useEffect, useRef, useState } from 'react'
import type { Card } from './cards'
import type { EquityResult } from './equity'

const ITERATIONS = 40_000

const toKey = (hero: Card[], board: Card[], opponents: number) => `${hero.join(',')}|${board.join(',')}|${opponents}`
const parseList = (text: string) => (text ? text.split(',').map(Number) : [])

// Roda a simulação num Web Worker para não travar a tela. Enquanto o novo cálculo não chega,
// devolve o último resultado com loading = true.
export function useEquity(hero: Card[], board: Card[], opponents: number) {
  const workerRef = useRef<Worker | null>(null)
  const [latest, setLatest] = useState<{ key: string; result: EquityResult } | null>(null)
  const key = toKey(hero, board, opponents)
  const ready = hero.length === 2

  useEffect(() => {
    const worker = new Worker(new URL('./equity.worker.ts', import.meta.url), { type: 'module' })
    worker.onmessage = (event: MessageEvent<{ key: string; result: EquityResult }>) => setLatest(event.data)
    workerRef.current = worker
    return () => worker.terminate()
  }, [])

  useEffect(() => {
    const [heroText, boardText, opponentsText] = key.split('|')
    const request = { key, hero: parseList(heroText), board: parseList(boardText), opponents: Number(opponentsText) }
    if (request.hero.length < 2) return
    const timer = setTimeout(() => workerRef.current?.postMessage({ ...request, iterations: ITERATIONS }), 100)
    return () => clearTimeout(timer)
  }, [key])

  return {
    result: ready ? (latest?.result ?? null) : null,
    loading: ready && latest?.key !== key,
  }
}
