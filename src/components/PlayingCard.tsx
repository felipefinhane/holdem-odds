import { type Card, RANK_LABELS, rankOf, SUITS, suitOf } from '../lib/cards'
import { SUIT_TEXT } from './suitColors'

const SIZES = {
  sm: { box: 'h-11 w-8 rounded', rank: 'text-sm', center: 'text-base', corners: false },
  md: { box: 'h-[84px] w-[60px] rounded-md', rank: 'text-base', center: 'text-3xl', corners: true },
  lg: { box: 'h-[112px] w-20 rounded-md', rank: 'text-xl', center: 'text-4xl', corners: true },
}

type Size = keyof typeof SIZES

export function PlayingCard({ card, size = 'md' }: { card: Card; size?: Size }) {
  const style = SIZES[size]
  const rank = RANK_LABELS[rankOf(card)]
  const suit = SUITS[suitOf(card)]
  const index = (
    <span className={`flex flex-col items-center leading-none ${style.rank}`}>
      <span>{rank}</span>
      <span className="text-[0.8em]">{suit.symbol}</span>
    </span>
  )

  if (!style.corners)
    return (
      <span
        className={`${style.box} ${SUIT_TEXT[suitOf(card)]} flex flex-col items-center justify-center border border-gray-200 bg-white font-display font-bold leading-none shadow`}
        aria-label={`${rank} de ${suit.name}`}
      >
        <span className={style.rank}>{rank}</span>
        <span className={style.center}>{suit.symbol}</span>
      </span>
    )

  return (
    <span
      className={`${style.box} ${SUIT_TEXT[suitOf(card)]} relative block border border-gray-200 bg-white font-display font-bold shadow-[0_4px_12px_rgba(4,26,19,0.6)]`}
      aria-label={`${rank} de ${suit.name}`}
    >
      <span className="absolute top-1 left-1.5">{index}</span>
      <span className={`absolute inset-0 flex items-center justify-center ${style.center}`}>{suit.symbol}</span>
      <span className="absolute right-1.5 bottom-1 rotate-180">{index}</span>
    </span>
  )
}

type SlotProps = {
  card: Card | null
  label: string
  active: boolean
  size?: Size
  disabled?: boolean
  onClick: () => void
}

export function CardSlot({ card, label, active, size = 'md', disabled, onClick }: SlotProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`rounded-md transition active:scale-95 disabled:opacity-35 ${active ? 'shadow-[0_0_16px_rgba(245,197,66,0.45)] ring-2 ring-gold' : ''}`}
      aria-label={card === null ? `Escolher carta: ${label}` : `Trocar carta: ${label}`}
    >
      {card === null ? (
        <span
          className={`${SIZES[size].box} recessed flex flex-col items-center justify-center gap-1 border-[1.5px] border-dashed border-gold/30 bg-surface-container font-display text-[11px] font-semibold text-secondary/60 uppercase`}
        >
          <span className="text-lg leading-none text-gold/50">+</span>
          {label}
        </span>
      ) : (
        <PlayingCard card={card} size={size} />
      )}
    </button>
  )
}
