// Uma carta é um número de 0 a 51: rank = card >> 2 (0 = 2 ... 12 = Ás), naipe = card & 3.
export type Card = number

export const RANK_COUNT = 13
export const DECK_SIZE = 52

export const RANK_LABELS = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A']
export const SUITS = [
  { symbol: '♠', name: 'Espadas' },
  { symbol: '♥', name: 'Copas' },
  { symbol: '♦', name: 'Ouros' },
  { symbol: '♣', name: 'Paus' },
] as const

export const rankOf = (card: Card) => card >> 2
export const suitOf = (card: Card) => card & 3
export const makeCard = (rank: number, suit: number): Card => (rank << 2) | suit

export const cardLabel = (card: Card) => RANK_LABELS[rankOf(card)] + SUITS[suitOf(card)].symbol

// Notação curta para testes e depuração: "Ah", "Td", "7c", "10s".
const SUIT_LETTERS = 'shdc'
export function parseCard(text: string): Card {
  const match = /^(10|[2-9TJQKA])([shdc])$/i.exec(text.trim())
  if (!match) throw new Error(`Carta inválida: ${text}`)
  const rankText = match[1].toUpperCase() === 'T' ? '10' : match[1].toUpperCase()
  return makeCard(RANK_LABELS.indexOf(rankText), SUIT_LETTERS.indexOf(match[2].toLowerCase()))
}

export const parseCards = (text: string): Card[] => (text.trim() ? text.trim().split(/\s+/).map(parseCard) : [])

export function remainingDeck(used: Card[]): Card[] {
  const taken = new Set(used)
  const deck: Card[] = []
  for (let card = 0; card < DECK_SIZE; card++) if (!taken.has(card)) deck.push(card)
  return deck
}
