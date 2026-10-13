import { describe, expect, it } from 'vitest'
import { parseCards } from './cards'
import { simulateEquity, seededRandom } from './equity'
import { Category, categoryOf, describeHand, evaluate } from './evaluate'
import { countOuts } from './outs'
import { potOdds } from './potOdds'

const score = (text: string) => evaluate(parseCards(text))

describe('evaluate', () => {
  it.each([
    ['Ah Kh Qh Jh Th 2c 3d', Category.StraightFlush, 'Royal flush'],
    ['9s 9h 9d 9c 2h 3h 4h', Category.Quads, 'Quadra de Noves'],
    ['Ks Kh Kd 7c 7h 2s 3s', Category.FullHouse, 'Full house: Reis com Setes'],
    ['Ks Kh Kd 7c 7h 7s 3s', Category.FullHouse, 'Full house: Reis com Setes'],
    ['Ah 9h 6h 4h 2h Kc Kd', Category.Flush, 'Flush, Ás alto'],
    ['Ah 2c 3d 4s 5h Kc Qd', Category.Straight, 'Sequência até o Cinco'],
    ['9h 8c 7d 6s 5h 2c 2d', Category.Straight, 'Sequência até o Nove'],
    ['7h 7c 7d As Kh 2c 3d', Category.Trips, 'Trinca de Setes'],
    ['Ah Ac Kd Ks 2h 2c 9d', Category.TwoPair, 'Dois pares: Ases e Reis'],
    ['Qh Qc 9d 7s 2h', Category.Pair, 'Par de Damas'],
    ['Ah Jc 9d 7s 2h', Category.HighCard, 'Carta alta: Ás'],
  ])('%s → %s', (cards, category, description) => {
    expect(categoryOf(score(cards))).toBe(category)
    expect(describeHand(score(cards))).toBe(description)
  })

  it('compara mãos da mesma categoria pelo desempate', () => {
    expect(score('Ah Ac Kd 7s 2h')).toBeGreaterThan(score('Ah Ac Qd 7s 2h'))
    expect(score('6h 5c 4d 3s 2h')).toBeGreaterThan(score('5h 4c 3d 2s Ah'))
    expect(score('Ah Ac Kd Ks 2h 2c 9d')).toBe(score('Ah Ac Kd Ks 9h 3c 4d'))
  })

  it('flush vence sequência e full house vence flush', () => {
    expect(score('Ah 9h 6h 4h 2h')).toBeGreaterThan(score('Ts 9h 8d 7c 6h'))
    expect(score('2h 2c 2d 3s 3h')).toBeGreaterThan(score('Ah Kh Qh Jh 9h'))
  })
})

describe('countOuts', () => {
  it.each([
    ['flush draw', '5h 4h', 'Kh 9h 2c', 9],
    ['sequência aberta', '9d 8s', '7c 6h Ks', 8],
    ['gutshot', '9d 8s', '6c 5h Ks', 4],
    ['par para trinca', '7s 7d', 'Ac Kd 4h', 2],
    ['flush + sequência', 'Jh Th', 'Qh 9c 2h', 15],
  ])('%s', (_, hero, board, expected) => {
    expect(countOuts(parseCards(hero), parseCards(board))?.outs).toHaveLength(expected)
  })

  it('não conta a mesa formando par como out', () => {
    const result = countOuts(parseCards('Ah Kd'), parseCards('Ks 7c 2d'))
    expect(result?.outs.map((card) => card >> 2)).not.toContain(5)
  })

  it('calcula a chance exata e a regra do 4 para o flush draw no flop', () => {
    const result = countOuts(parseCards('5h 4h'), parseCards('Kh 9h 2c'))!
    expect(result.unknown).toBe(47)
    expect(result.ruleOfThumb).toBeCloseTo(0.36)
    expect(result.exact).toBeCloseTo(0.3497, 3)
  })

  it('usa a regra do 2 no turn', () => {
    const result = countOuts(parseCards('5h 4h'), parseCards('Kh 9h 2c Js'))!
    expect(result.ruleOfThumb).toBeCloseTo(0.18)
    expect(result.exact).toBeCloseTo(9 / 46)
  })

  it('não calcula outs antes do flop nem no river', () => {
    expect(countOuts(parseCards('Ah Kh'), [])).toBeNull()
    expect(countOuts(parseCards('Ah Kh'), parseCards('2c 3d 4s 5h 9c'))).toBeNull()
  })
})

describe('simulateEquity', () => {
  const equity = (hero: string, board: string, opponents: number) =>
    simulateEquity({ hero: parseCards(hero), board: parseCards(board), opponents, iterations: 40_000 }, seededRandom(42))

  it('AA contra uma mão aleatória vence cerca de 85%', () => {
    expect(equity('Ah As', '', 1).equity).toBeCloseTo(0.852, 1)
  })

  it('72 offsuit contra uma mão aleatória fica perto de 35%', () => {
    expect(equity('7h 2c', '', 1).equity).toBeCloseTo(0.346, 1)
  })

  it('a equity cai com mais adversários', () => {
    expect(equity('Ah As', '', 4).equity).toBeLessThan(equity('Ah As', '', 1).equity)
  })

  it('royal flush na mesa sempre empata', () => {
    const result = equity('2c 3d', 'Ah Kh Qh Jh Th', 2)
    expect(result.tie).toBe(1)
    expect(result.equity).toBeCloseTo(1 / 3)
  })

  it('a distribuição da mão final soma 100%', () => {
    const total = equity('9h 8h', 'Th 7c 2h', 1).finalHand.reduce((a, b) => a + b, 0)
    expect(total).toBeCloseTo(1)
  })
})

describe('potOdds', () => {
  it('reproduz o exemplo da nota: pote 100, aposta 50 → precisa de 25%', () => {
    const result = potOdds(100, 50, 0.196)!
    expect(result.finalPot).toBe(200)
    expect(result.required).toBe(0.25)
    expect(result.verdict).toBe('fold')
    expect(result.expectedValue).toBeLessThan(0)
  })

  it('aposta pequena vira call', () => {
    const result = potOdds(100, 20, 0.196)!
    expect(result.verdict).toBe('call')
    expect(result.expectedValue).toBeGreaterThan(0)
  })

  it('o maior call possível tem EV zero', () => {
    const result = potOdds(100, 20, 0.2)!
    expect(potOdds(100, result.maxCall, 0.2)!.expectedValue).toBeCloseTo(0)
  })

  it('ignora aposta vazia', () => {
    expect(potOdds(100, 0, 0.5)).toBeNull()
  })
})
