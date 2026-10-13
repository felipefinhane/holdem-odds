import { useState } from 'react'
import { type Card, makeCard, RANK_LABELS, rankOf, SUITS, suitOf } from '../lib/cards'
import { SUIT_TEXT } from './suitColors'

type Props = {
  title: string
  current: Card | null
  used: Set<Card>
  onPick: (card: Card) => void
  onClear: () => void
  onClose: () => void
}

// Escolha em dois toques: valor e naipe, em qualquer ordem.
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
    <div className="fixed inset-0 z-20 flex items-end justify-center bg-black/50" onClick={onClose}>
      <div
        className="w-full max-w-md rounded-t-2xl bg-felt-dark p-4 pb-[max(1rem,env(safe-area-inset-bottom))] shadow-2xl ring-1 ring-white/10"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-semibold">{title}</h2>
          <div className="flex gap-2">
            {current !== null && (
              <button type="button" onClick={onClear} className="rounded-lg px-3 py-1.5 text-sm text-red-300 ring-1 ring-red-300/40">
                Remover
              </button>
            )}
            <button type="button" onClick={onClose} className="rounded-lg px-3 py-1.5 text-sm ring-1 ring-white/30">
              Fechar
            </button>
          </div>
        </div>

        <p className="mb-2 text-xs text-white/60">Valor</p>
        <div className="grid grid-cols-7 gap-1.5">
          {RANK_LABELS.map((label, r) => {
            const disabled = SUITS.every((_, s) => !available(r, s)) || (suit !== null && !available(r, suit))
            return (
              <button
                key={label}
                type="button"
                disabled={disabled}
                onClick={() => choose(r, suit)}
                className={`h-11 rounded-lg text-lg font-bold transition disabled:opacity-25 ${
                  rank === r ? 'bg-gold text-felt-dark' : 'bg-white/10 active:bg-white/20'
                }`}
              >
                {label}
              </button>
            )
          })}
        </div>

        <p className="mt-4 mb-2 text-xs text-white/60">Naipe</p>
        <div className="grid grid-cols-4 gap-2">
          {SUITS.map(({ symbol, name }, s) => {
            const disabled = RANK_LABELS.every((_, r) => !available(r, s)) || (rank !== null && !available(rank, s))
            return (
              <button
                key={name}
                type="button"
                disabled={disabled}
                onClick={() => choose(rank, s)}
                className={`flex h-14 flex-col items-center justify-center rounded-lg bg-white transition disabled:opacity-25 ${
                  suit === s ? 'ring-4 ring-gold' : ''
                } ${SUIT_TEXT[s]}`}
              >
                <span className="text-2xl leading-none">{symbol}</span>
                <span className="text-[10px] text-slate-500">{name}</span>
              </button>
            )
          })}
        </div>

        {current !== null && (
          <p className="mt-3 text-center text-xs text-white/50">
            Atual: {RANK_LABELS[rankOf(current)]}
            {SUITS[suitOf(current)].symbol}
          </p>
        )}
      </div>
    </div>
  )
}
