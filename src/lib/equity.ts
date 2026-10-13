import { type Card, remainingDeck } from './cards'
import { categoryOf, evaluate, HAND_CATEGORIES } from './evaluate'

export type EquityRequest = {
  hero: Card[]
  board: Card[]
  opponents: number
  iterations: number
}

export type EquityResult = {
  iterations: number
  win: number
  tie: number
  lose: number
  // Fatia média do pote que é sua (empates dividem o pote): é a sua chance "real".
  equity: number
  // Chance de terminar no river com cada categoria de mão (índice = Category).
  finalHand: number[]
}

export type Random = () => number

// Gerador determinístico para testes reproduzíveis.
export function seededRandom(seed: number): Random {
  let state = seed >>> 0
  return () => {
    state = (state + 0x6d2b79f5) >>> 0
    let t = state
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// Simulação de Monte Carlo: completa a mesa e dá cartas aleatórias aos adversários milhares de vezes.
export function simulateEquity(
  { hero, board, opponents, iterations }: EquityRequest,
  random: Random = Math.random,
): EquityResult {
  const deck = remainingDeck([...hero, ...board])
  const missingBoard = 5 - board.length
  const toDeal = missingBoard + opponents * 2
  const finalHand = new Array<number>(HAND_CATEGORIES.length).fill(0)
  const fullBoard = [...board, 0, 0, 0, 0, 0].slice(0, 5)
  const heroHand: Card[] = [...hero, ...fullBoard]
  const opponentHand: Card[] = new Array(7).fill(0)
  let win = 0
  let tie = 0
  let equity = 0

  for (let i = 0; i < iterations; i++) {
    // Fisher-Yates parcial: só embaralha as cartas que vão ser distribuídas.
    for (let j = 0; j < toDeal; j++) {
      const k = j + Math.floor(random() * (deck.length - j))
      const swap = deck[j]
      deck[j] = deck[k]
      deck[k] = swap
    }
    for (let j = 0; j < missingBoard; j++) fullBoard[board.length + j] = deck[j]
    for (let j = 0; j < 5; j++) heroHand[2 + j] = fullBoard[j]

    const heroScore = evaluate(heroHand)
    finalHand[categoryOf(heroScore)]++

    let best = 0
    let tiedWithHero = 0
    for (let o = 0; o < opponents; o++) {
      opponentHand[0] = deck[missingBoard + o * 2]
      opponentHand[1] = deck[missingBoard + o * 2 + 1]
      for (let j = 0; j < 5; j++) opponentHand[2 + j] = fullBoard[j]
      const opponentScore = evaluate(opponentHand)
      if (opponentScore > best) best = opponentScore
      if (opponentScore === heroScore) tiedWithHero++
    }

    if (heroScore > best) {
      win++
      equity += 1
    } else if (heroScore === best) {
      tie++
      equity += 1 / (tiedWithHero + 1)
    }
  }

  return {
    iterations,
    win: win / iterations,
    tie: tie / iterations,
    lose: (iterations - win - tie) / iterations,
    equity: equity / iterations,
    finalHand: finalHand.map((count) => count / iterations),
  }
}
