import { type Card, RANK_LABELS, rankOf, SUITS, suitOf } from '../lib/cards'
import { SUIT_TEXT } from './suitColors'

const SIZES = {
  sm: 'h-11 w-8 text-sm',
  md: 'h-20 w-14 text-xl',
}

type Props = {
  card: Card
  size?: keyof typeof SIZES
}

export function PlayingCard({ card, size = 'md' }: Props) {
  return (
    <span
      className={`${SIZES[size]} ${SUIT_TEXT[suitOf(card)]} flex flex-col items-center justify-center rounded-lg bg-white font-bold leading-none shadow-md`}
      aria-label={`${RANK_LABELS[rankOf(card)]} de ${SUITS[suitOf(card)].name}`}
    >
      <span>{RANK_LABELS[rankOf(card)]}</span>
      <span className={size === 'sm' ? 'text-base' : 'text-2xl'}>{SUITS[suitOf(card)].symbol}</span>
    </span>
  )
}

type SlotProps = {
  card: Card | null
  label: string
  active: boolean
  disabled?: boolean
  onClick: () => void
}

export function CardSlot({ card, label, active, disabled, onClick }: SlotProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`rounded-lg transition ${active ? 'ring-4 ring-gold' : ''} disabled:opacity-30`}
      aria-label={card === null ? `Escolher carta: ${label}` : `Trocar carta: ${label}`}
    >
      {card === null ? (
        <span className="flex h-20 w-14 items-center justify-center rounded-lg border-2 border-dashed border-white/40 text-xs text-white/60">
          {label}
        </span>
      ) : (
        <PlayingCard card={card} />
      )}
    </button>
  )
}
