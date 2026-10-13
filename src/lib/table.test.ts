import { describe, expect, it } from 'vitest'
import { chipBreakdown, chipsTotal, DEFAULT_CONFIG, planBet, roundToChips, toBigBlinds, type ChipType } from './table'

const { chips } = DEFAULT_CONFIG
const describeChips = (amount: number, types: ChipType[] = chips) =>
  chipBreakdown(amount, types)?.map(({ chip, count }) => `${count}×${chip.value}`)

describe('configuração padrão', () => {
  it('as fichas somam o stack inicial', () => {
    expect(chipsTotal(chips)).toBe(DEFAULT_CONFIG.startingStack)
  })
})

describe('chipBreakdown', () => {
  it('monta o valor com o menor número de fichas, da maior para a menor', () => {
    expect(describeChips(50)).toEqual(['2×25'])
    expect(describeChips(70)).toEqual(['2×25', '4×5'])
    expect(describeChips(342)).toEqual(['3×100', '1×25', '3×5', '2×1'])
  })

  it('acha a melhor combinação mesmo quando o guloso erraria', () => {
    const odd: ChipType[] = [1, 3, 4].map((value) => ({ color: 'verde', value, quantity: 10 }))
    expect(describeChips(6, odd)).toEqual(['2×3'])
  })

  it('devolve null quando o valor não fecha com as fichas', () => {
    const noOnes = chips.filter((chip) => chip.value >= 5)
    expect(chipBreakdown(7, noOnes)).toBeNull()
  })
})

describe('roundToChips', () => {
  it('arredonda para múltiplo da menor ficha', () => {
    const noOnes = chips.filter((chip) => chip.value >= 5)
    expect(roundToChips(67, noOnes)).toBe(65)
    expect(roundToChips(68, noOnes)).toBe(70)
    expect(roundToChips(1, noOnes)).toBe(5)
  })
})

describe('planBet', () => {
  it('converte em BB e fichas', () => {
    const plan = planBet(66.7, 1000, DEFAULT_CONFIG)
    expect(plan).toMatchObject({ amount: 67, bigBlinds: 6.7, allIn: false })
    expect(plan.chips?.map(({ count }) => count)).toEqual([2, 3, 2])
  })

  it('vira all-in quando passa do stack', () => {
    expect(planBet(500, 340, DEFAULT_CONFIG)).toMatchObject({ amount: 340, allIn: true, bigBlinds: 34 })
  })

  it('aposta exatamente igual ao stack também é all-in', () => {
    expect(planBet(340, 340, DEFAULT_CONFIG).allIn).toBe(true)
  })
})

describe('toBigBlinds', () => {
  it('divide pelo big blind', () => {
    expect(toBigBlinds(100, 10)).toBe(10)
    expect(toBigBlinds(100, 0)).toBe(0)
  })
})
