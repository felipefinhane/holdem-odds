export const CHIP_COLORS = {
  branca: { name: 'Branca', fill: '#f8fafc', text: '#111827', edge: '#9ca3af' },
  vermelha: { name: 'Vermelha', fill: '#ef4444', text: '#ffffff', edge: '#ffffff' },
  azul: { name: 'Azul', fill: '#2563eb', text: '#ffffff', edge: '#ffffff' },
  verde: { name: 'Verde', fill: '#22c55e', text: '#ffffff', edge: '#ffffff' },
  preta: { name: 'Preta', fill: '#171717', text: '#f5c542', edge: '#f5c542' },
  roxa: { name: 'Roxa', fill: '#7c3aed', text: '#ffffff', edge: '#ffffff' },
  amarela: { name: 'Amarela', fill: '#eab308', text: '#111827', edge: '#ffffff' },
} as const

export type ChipColor = keyof typeof CHIP_COLORS

export type ChipType = {
  color: ChipColor
  value: number
  // Quantas fichas desse tipo cada jogador recebe no início.
  quantity: number
}

export type TableConfig = {
  startingStack: number
  smallBlind: number
  bigBlind: number
  chips: ChipType[]
}

export const DEFAULT_CONFIG: TableConfig = {
  startingStack: 1000,
  smallBlind: 5,
  bigBlind: 10,
  chips: [
    { color: 'branca', value: 1, quantity: 50 },
    { color: 'vermelha', value: 5, quantity: 20 },
    { color: 'verde', value: 25, quantity: 10 },
    { color: 'preta', value: 100, quantity: 6 },
  ],
}

export const sortedChips = (chips: ChipType[]) => [...chips].sort((a, b) => a.value - b.value)

export const chipsTotal = (chips: ChipType[]) => chips.reduce((total, chip) => total + chip.value * chip.quantity, 0)

export const toBigBlinds = (amount: number, bigBlind: number) => (bigBlind > 0 ? amount / bigBlind : 0)

// Arredonda para um valor que dá para montar com as fichas (múltiplo da menor ficha).
export function roundToChips(amount: number, chips: ChipType[]): number {
  const smallest = Math.min(...chips.map((chip) => chip.value).filter((value) => value > 0))
  if (!Number.isFinite(smallest)) return Math.round(amount)
  return Math.max(smallest, Math.round(amount / smallest) * smallest)
}

export type ChipCount = { chip: ChipType; count: number }

// Menor número de fichas que soma exatamente o valor (programação dinâmica, funciona com qualquer
// combinação de valores). Devolve null se não houver combinação exata.
export function chipBreakdown(amount: number, chips: ChipType[]): ChipCount[] | null {
  const types = sortedChips(chips).filter((chip) => chip.value > 0 && Number.isInteger(chip.value))
  if (amount <= 0 || types.length === 0 || !Number.isInteger(amount)) return amount === 0 ? [] : null

  const unit = types.map((chip) => chip.value).reduce(gcd)
  if (amount % unit !== 0) return null
  const target = amount / unit
  if (target > 200_000) return null

  const fewest = new Array<number>(target + 1).fill(Infinity)
  const lastChip = new Array<number>(target + 1).fill(-1)
  fewest[0] = 0
  for (let total = 1; total <= target; total++) {
    for (let i = 0; i < types.length; i++) {
      const step = types[i].value / unit
      if (step <= total && fewest[total - step] + 1 < fewest[total]) {
        fewest[total] = fewest[total - step] + 1
        lastChip[total] = i
      }
    }
  }
  if (fewest[target] === Infinity) return null

  const counts = new Array<number>(types.length).fill(0)
  for (let total = target; total > 0; total -= types[lastChip[total]].value / unit) counts[lastChip[total]]++
  return types.map((chip, i) => ({ chip, count: counts[i] })).filter(({ count }) => count > 0).reverse()
}

const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b))

export type BetPlan = {
  amount: number
  bigBlinds: number
  allIn: boolean
  chips: ChipCount[] | null
}

// Transforma um valor sugerido numa aposta real: arredondada para as fichas e limitada ao seu stack.
export function planBet(amount: number, stack: number, config: TableConfig): BetPlan {
  const rounded = roundToChips(amount, config.chips)
  const allIn = stack > 0 && rounded >= stack
  const finalAmount = allIn ? stack : rounded
  return {
    amount: finalAmount,
    bigBlinds: toBigBlinds(finalAmount, config.bigBlind),
    allIn,
    chips: chipBreakdown(finalAmount, config.chips),
  }
}

export function isTableConfig(value: unknown): value is TableConfig {
  if (typeof value !== 'object' || value === null) return false
  const config = value as TableConfig
  return (
    [config.startingStack, config.smallBlind, config.bigBlind].every((n) => typeof n === 'number' && n >= 0) &&
    Array.isArray(config.chips) &&
    config.chips.every((chip) => chip.color in CHIP_COLORS && typeof chip.value === 'number' && typeof chip.quantity === 'number')
  )
}
