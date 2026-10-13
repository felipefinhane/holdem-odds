import { type Card, rankOf, suitOf, RANK_COUNT } from './cards'

// Categorias em ordem crescente de força.
export const HAND_CATEGORIES = [
  'Carta alta',
  'Par',
  'Dois pares',
  'Trinca',
  'Sequência',
  'Flush',
  'Full house',
  'Quadra',
  'Straight flush',
] as const

export const Category = {
  HighCard: 0,
  Pair: 1,
  TwoPair: 2,
  Trips: 3,
  Straight: 4,
  Flush: 5,
  FullHouse: 6,
  Quads: 7,
  StraightFlush: 8,
} as const

// Pontuação comparável: categoria nos bits 20+, depois até 5 ranks de desempate (4 bits cada).
function score(category: number, kickers: number[]): number {
  let value = category
  for (let i = 0; i < 5; i++) value = (value << 4) | (kickers[i] ?? 0)
  return value
}

export const categoryOf = (handScore: number) => handScore >> 20
export const kickersOf = (handScore: number) => [16, 12, 8, 4, 0].map((shift) => (handScore >> shift) & 15)

// Rank mais alto de uma sequência dentro da máscara de bits, ou -1. A roda (A-2-3-4-5) tem topo 3 (o 5).
function straightHigh(mask: number): number {
  for (let high = 12; high >= 4; high--) {
    const run = 0b11111 << (high - 4)
    if ((mask & run) === run) return high
  }
  const wheel = (1 << 12) | 0b1111
  return (mask & wheel) === wheel ? 3 : -1
}

function topRanks(mask: number, count: number): number[] {
  const ranks: number[] = []
  for (let rank = 12; rank >= 0 && ranks.length < count; rank--) if (mask & (1 << rank)) ranks.push(rank)
  return ranks
}

// Avalia a melhor mão possível com 1 a 7 cartas. Mãos com menos de 5 cartas não formam sequência nem flush.
export function evaluate(cards: Card[]): number {
  const rankCounts = new Array<number>(RANK_COUNT).fill(0)
  const suitMasks = [0, 0, 0, 0]
  const suitCounts = [0, 0, 0, 0]
  let rankMask = 0
  for (const card of cards) {
    const rank = rankOf(card)
    const suit = suitOf(card)
    rankCounts[rank]++
    suitMasks[suit] |= 1 << rank
    suitCounts[suit]++
    rankMask |= 1 << rank
  }

  const flushSuit = suitCounts.findIndex((count) => count >= 5)
  if (flushSuit >= 0) {
    const high = straightHigh(suitMasks[flushSuit])
    if (high >= 0) return score(Category.StraightFlush, [high])
  }

  let quads = -1
  const trips: number[] = []
  const pairs: number[] = []
  for (let rank = 12; rank >= 0; rank--) {
    if (rankCounts[rank] === 4) quads = rank
    else if (rankCounts[rank] === 3) trips.push(rank)
    else if (rankCounts[rank] === 2) pairs.push(rank)
  }

  if (quads >= 0) return score(Category.Quads, [quads, ...topRanks(rankMask & ~(1 << quads), 1)])

  if (trips.length > 0 && trips.length + pairs.length >= 2) {
    const pairRank = Math.max(trips[1] ?? -1, pairs[0] ?? -1)
    return score(Category.FullHouse, [trips[0], pairRank])
  }

  if (flushSuit >= 0) return score(Category.Flush, topRanks(suitMasks[flushSuit], 5))

  const high = straightHigh(rankMask)
  if (high >= 0) return score(Category.Straight, [high])

  if (trips.length > 0) return score(Category.Trips, [trips[0], ...topRanks(rankMask & ~(1 << trips[0]), 2)])

  if (pairs.length >= 2) {
    const [top, second] = pairs
    return score(Category.TwoPair, [top, second, ...topRanks(rankMask & ~(1 << top) & ~(1 << second), 1)])
  }

  if (pairs.length === 1) return score(Category.Pair, [pairs[0], ...topRanks(rankMask & ~(1 << pairs[0]), 3)])

  return score(Category.HighCard, topRanks(rankMask, 5))
}

const RANK_NAMES = ['Dois', 'Três', 'Quatro', 'Cinco', 'Seis', 'Sete', 'Oito', 'Nove', 'Dez', 'Valete', 'Dama', 'Rei', 'Ás']
const RANK_PLURALS = ['Dois', 'Três', 'Quatros', 'Cincos', 'Seis', 'Setes', 'Oitos', 'Noves', 'Dez', 'Valetes', 'Damas', 'Reis', 'Ases']

export function describeHand(handScore: number): string {
  const [a, b] = kickersOf(handScore)
  switch (categoryOf(handScore)) {
    case Category.StraightFlush:
      return a === 12 ? 'Royal flush' : `Straight flush até o ${RANK_NAMES[a]}`
    case Category.Quads:
      return `Quadra de ${RANK_PLURALS[a]}`
    case Category.FullHouse:
      return `Full house: ${RANK_PLURALS[a]} com ${RANK_PLURALS[b]}`
    case Category.Flush:
      return `Flush, ${RANK_NAMES[a]} alto`
    case Category.Straight:
      return `Sequência até o ${RANK_NAMES[a]}`
    case Category.Trips:
      return `Trinca de ${RANK_PLURALS[a]}`
    case Category.TwoPair:
      return `Dois pares: ${RANK_PLURALS[a]} e ${RANK_PLURALS[b]}`
    case Category.Pair:
      return `Par de ${RANK_PLURALS[a]}`
    default:
      return `Carta alta: ${RANK_NAMES[a]}`
  }
}
