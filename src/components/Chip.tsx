import { CHIP_COLORS, type ChipColor, type ChipCount } from '../lib/table'
import { formatChips } from '../lib/format'

const SIZES = {
  xs: 'h-5 w-5 border text-[9px]',
  md: 'h-11 w-11 border-2 text-sm',
  lg: 'h-12 w-12 border-[3px] text-sm',
}

// Ficha de poker: círculo na cor da ficha com borda tracejada e o valor no centro.
export function Chip({ color, value, size = 'md' }: { color: ChipColor; value: number; size?: keyof typeof SIZES }) {
  const { fill, text, edge } = CHIP_COLORS[color]
  return (
    <span
      className={`${SIZES[size]} flex shrink-0 items-center justify-center rounded-full border-dashed font-display font-bold shadow-md tabular-nums`}
      style={{ backgroundColor: fill, color: text, borderColor: edge }}
    >
      {formatChips(value)}
    </span>
  )
}

// Lista "2× Verde + 4× Vermelha" com as fichas desenhadas.
export function ChipStack({ chips, tone = 'dark' }: { chips: ChipCount[]; tone?: 'dark' | 'light' }) {
  return (
    <span className="flex flex-wrap items-center justify-center gap-1.5">
      {chips.map(({ chip, count }) => (
        <span
          key={chip.color + chip.value}
          className={`flex items-center gap-1.5 rounded-full py-1 pr-2.5 pl-1 text-xs font-bold ${
            tone === 'dark' ? 'bg-surface-lowest/80 text-on-surface' : 'bg-black/20 text-current'
          }`}
        >
          <Chip color={chip.color} value={chip.value} size="xs" />
          {count}× {CHIP_COLORS[chip.color].name}
        </span>
      ))}
    </span>
  )
}
