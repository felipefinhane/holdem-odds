import { type Card, rankOf, remainingDeck } from './cards'
import { categoryOf, Category, evaluate, kickersOf } from './evaluate'

export type OutGroup = {
  category: number
  cards: Card[]
}

export type OutsResult = {
  outs: Card[]
  groups: OutGroup[]
  unknown: number
  cardsToCome: number
  // Regra do 2 e do 4: outs × 4 no flop, outs × 2 no turn.
  ruleOfThumb: number
  // Chance exata de sair pelo menos um out até o river.
  exact: number
}

// Outs só fazem sentido no flop (3 cartas) ou no turn (4 cartas).
export function countOuts(hero: Card[], board: Card[]): OutsResult | null {
  if (hero.length !== 2 || (board.length !== 3 && board.length !== 4)) return null

  const current = categoryOf(evaluate([...hero, ...board]))
  const boardNow = categoryOf(evaluate(board))
  const topBoardRank = Math.max(...board.map(rankOf))
  const deck = remainingDeck([...hero, ...board])
  const outs: Card[] = []
  const byCategory = new Map<number, Card[]>()

  for (const card of deck) {
    const nextBoard = [...board, card]
    const nextScore = evaluate([...hero, ...nextBoard])
    const next = categoryOf(nextScore)
    // Melhoria que a mesa entrega a todos (ex.: a mesa formar par) não conta como out:
    // a vantagem da sua mão sobre a mesa precisa aumentar.
    if (next - categoryOf(evaluate(nextBoard)) <= current - boardNow) continue
    // Par abaixo da carta mais alta da mesa raramente vence: não conta como out.
    if (next === Category.Pair && kickersOf(nextScore)[0] < topBoardRank) continue

    outs.push(card)
    byCategory.set(next, [...(byCategory.get(next) ?? []), card])
  }

  const unknown = deck.length
  const cardsToCome = 5 - board.length
  const misses = unknown - outs.length
  const missAll = cardsToCome === 2 ? (misses / unknown) * ((misses - 1) / (unknown - 1)) : misses / unknown

  return {
    outs,
    groups: [...byCategory.entries()]
      .sort(([a], [b]) => b - a)
      .map(([category, cards]) => ({ category, cards })),
    unknown,
    cardsToCome,
    ruleOfThumb: Math.min(1, (outs.length * (cardsToCome === 2 ? 4 : 2)) / 100),
    exact: 1 - missAll,
  }
}
