import { Lock, Trash2, X } from 'lucide-react'
import { useState } from 'react'
import { type Card, DECK_SIZE, makeCard, RANK_LABELS, SUITS } from '../lib/cards'
import { PlayingCard } from './PlayingCard'
import { SUIT_TEXT } from './suitColors'

type Props = {
  title: string
  current: Card | null
  used: Set<Card>
  onPick: (card: Card) => void
  onClear: () => void
  onClose: () => void
}

// Do Ás ao 2, como no seletor do design.
const RANKS_DESC = RANK_LABELS.map((label, rank) => ({ label, rank })).reverse()

// Escolha em dois toques: naipe e valor, em qualquer ordem. A carta entra assim que os dois estão escolhidos.
export function CardPicker({ title, current, used, onPick, onClear, onClose }: Props) {
  const [rank, setRank] = useState<number | null>(null)
  const [suit, setSuit] = useState<number | null>(null)

  const available = (r: number, s: number) => !used.has(makeCard(r, s)) || makeCard(r, s) === current

  const choose = (r: number | null, s: number | null) => {
    setRank(r)
    setSuit(s)
    if (r !== null && s !== null && available(r, s)) {
      setRank(null)
      setSuit(null)
      onPick(makeCard(r, s))
    }
  }

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/60" onClick={onClose}>
      <div
        className="w-full max-w-[430px] rounded-t-3xl bg-surface-container p-4 pb-[max(1rem,env(safe-area-inset-bottom))] shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-surface-highest" />
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="flex items-center gap-2 font-display text-xl font-semibold">
              <span className="h-2 w-2 rounded-full bg-gold" />
              {title}
            </h2>
            <p className="text-sm text-secondary">Toque no naipe e no valor</p>
          </div>
          <div className="flex items-center gap-2">
            {current !== null && <PlayingCard card={current} size="sm" />}
            <button type="button" onClick={onClose} className="flex h-11 w-11 items-center justify-center rounded-lg bg-surface-high" aria-label="Fechar">
              <X size={20} />
            </button>
          </div>
        </div>

        <p className="mt-4 mb-2 font-display text-xs font-semibold tracking-wider text-secondary uppercase">Naipe</p>
        <div className="grid grid-cols-4 gap-2">
          {SUITS.map(({ symbol, name }, s) => {
            const disabled = RANK_LABELS.every((_, r) => !available(r, s)) || (rank !== null && !available(rank, s))
            return (
              <button
                key={name}
                type="button"
                disabled={disabled}
                onClick={() => choose(rank, s)}
                className={`flex h-14 flex-col items-center justify-center rounded-lg bg-white transition active:scale-95 disabled:opacity-20 ${
                  suit === s ? 'shadow-[0_0_16px_rgba(245,197,66,0.6)] ring-3 ring-gold' : ''
                } ${SUIT_TEXT[s]}`}
              >
                <span className="text-2xl leading-none">{symbol}</span>
                <span className="font-display text-[10px] font-semibold tracking-wide text-gray-500 uppercase">{name}</span>
              </button>
            )
          })}
        </div>

        <p className="mt-4 mb-2 font-display text-xs font-semibold tracking-wider text-secondary uppercase">Valor</p>
        <div className="grid grid-cols-7 gap-1.5">
          {RANKS_DESC.map(({ label, rank: r }) => {
            const disabled = SUITS.every((_, s) => !available(r, s)) || (suit !== null && !available(r, suit))
            return (
              <button
                key={label}
                type="button"
                disabled={disabled}
                onClick={() => choose(r, suit)}
                className={`h-12 rounded font-display text-xl font-bold transition active:scale-95 disabled:opacity-20 ${
                  rank === r ? 'bg-gold text-on-gold' : 'bg-surface-high text-on-surface'
                }`}
              >
                {label}
              </button>
            )
          })}
        </div>

        <div className="mt-3 flex items-center justify-between rounded-lg bg-surface-lowest px-3 py-2 text-xs text-secondary">
          <span className="flex items-center gap-2">
            <Lock size={14} /> Cartas em jogo ficam bloqueadas
          </span>
          <span className="font-display font-bold text-gold">{DECK_SIZE - used.size} restantes</span>
        </div>

        {current !== null && (
          <button
            type="button"
            onClick={onClear}
            className="mt-3 flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-surface-high font-display font-semibold text-danger"
          >
            <Trash2 size={18} /> Remover carta
          </button>
        )}
      </div>
    </div>
  )
}
