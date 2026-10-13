import type { ReactNode } from 'react'
import type { EquityResult } from '../lib/equity'
import { HAND_CATEGORIES } from '../lib/evaluate'
import { formatChips, formatPercent, formatSignedChips } from '../lib/format'
import type { OutsResult } from '../lib/outs'
import type { PotOddsResult } from '../lib/potOdds'
import { PlayingCard } from './PlayingCard'

export function Section({ title, children, aside }: { title: string; children: ReactNode; aside?: ReactNode }) {
  return (
    <section className="rounded-2xl bg-felt p-4 shadow-lg ring-1 ring-white/10">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold tracking-wide text-white/70 uppercase">{title}</h2>
        {aside}
      </div>
      {children}
    </section>
  )
}

export function EquityPanel({ result, loading, opponents }: { result: EquityResult; loading: boolean; opponents: number }) {
  return (
    <div className={`transition-opacity ${loading ? 'opacity-60' : ''}`}>
      <div className="flex items-baseline justify-between">
        <p className="text-5xl font-bold tabular-nums">{formatPercent(result.equity)}</p>
        <p className="text-right text-xs text-white/60">
          chance de vencer
          <br />
          contra {opponents} {opponents === 1 ? 'adversário' : 'adversários'}
        </p>
      </div>
      <div className="mt-3 flex h-3 overflow-hidden rounded-full bg-white/10">
        <div className="bg-emerald-400" style={{ width: `${result.win * 100}%` }} />
        <div className="bg-amber-300" style={{ width: `${result.tie * 100}%` }} />
        <div className="bg-red-400" style={{ width: `${result.lose * 100}%` }} />
      </div>
      <div className="mt-2 flex justify-between text-xs text-white/70 tabular-nums">
        <span>
          <span className="text-emerald-300">●</span> Vence {formatPercent(result.win)}
        </span>
        <span>
          <span className="text-amber-200">●</span> Empata {formatPercent(result.tie)}
        </span>
        <span>
          <span className="text-red-300">●</span> Perde {formatPercent(result.lose)}
        </span>
      </div>
    </div>
  )
}

export function PotOddsPanel({ odds, equity, pot, bet }: { odds: PotOddsResult; equity: number; pot: number; bet: number }) {
  const isCall = odds.verdict === 'call'
  return (
    <div className="space-y-3">
      <div className={`rounded-xl p-3 text-center ${isCall ? 'bg-emerald-500' : 'bg-red-500'}`}>
        <p className="text-3xl font-black tracking-wider">{isCall ? 'CALL' : 'FOLD'}</p>
        <p className="text-sm">
          Você tem {formatPercent(equity)} e precisa de {formatPercent(odds.required)}
        </p>
      </div>

      <div className="relative h-4 rounded-full bg-white/10">
        <div className="h-full rounded-full bg-sky-400" style={{ width: `${Math.min(equity, 1) * 100}%` }} />
        <div className="absolute -top-1 h-6 w-0.5 bg-gold" style={{ left: `${odds.required * 100}%` }} />
      </div>
      <div className="flex justify-between text-xs text-white/60">
        <span className="text-sky-300">■ sua chance</span>
        <span className="text-gold">| chance mínima</span>
      </div>

      <dl className="grid grid-cols-2 gap-2 text-sm">
        <Stat label="Lucro médio do call" value={`${formatSignedChips(odds.expectedValue)} fichas`} />
        <Stat label="Vale pagar até" value={odds.maxCall === Infinity ? 'qualquer valor' : `${formatChips(odds.maxCall)} fichas`} />
      </dl>

      <details className="rounded-lg bg-black/20 p-3 text-sm text-white/80">
        <summary className="cursor-pointer font-medium text-white">Como foi calculado</summary>
        <ol className="mt-2 list-decimal space-y-1 pl-5">
          <li>
            Pote final = {formatChips(pot)} + {formatChips(bet)} (aposta) + {formatChips(bet)} (seu call) ={' '}
            <b>{formatChips(odds.finalPot)}</b>
          </li>
          <li>
            Chance mínima = {formatChips(bet)} ÷ {formatChips(odds.finalPot)} = <b>{formatPercent(odds.required)}</b>
          </li>
          <li>
            Lucro médio = {formatPercent(equity)} × {formatChips(pot + bet)} − {formatPercent(1 - equity)} × {formatChips(bet)} ={' '}
            <b>{formatSignedChips(odds.expectedValue)}</b>
          </li>
        </ol>
        <p className="mt-2 text-xs text-white/60">
          Considera que você vê todas as cartas até o river. Apostas futuras (implied odds) podem justificar um call um pouco abaixo da
          conta.
        </p>
      </details>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-black/20 p-2">
      <dt className="text-xs text-white/60">{label}</dt>
      <dd className="font-semibold tabular-nums">{value}</dd>
    </div>
  )
}

export function OutsPanel({ outs }: { outs: OutsResult }) {
  const multiplier = outs.cardsToCome === 2 ? 4 : 2
  const count = outs.outs.length
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="rounded-lg bg-black/20 p-2">
          <p className="text-2xl font-bold">{count}</p>
          <p className="text-xs text-white/60">outs</p>
        </div>
        <div className="rounded-lg bg-black/20 p-2">
          <p className="text-2xl font-bold tabular-nums">{formatPercent(outs.ruleOfThumb)}</p>
          <p className="text-xs text-white/60">
            regra: {count} × {multiplier}
          </p>
        </div>
        <div className="rounded-lg bg-black/20 p-2">
          <p className="text-2xl font-bold tabular-nums">{formatPercent(outs.exact)}</p>
          <p className="text-xs text-white/60">exato</p>
        </div>
      </div>
      <p className="text-xs text-white/60">
        Chance de sair pelo menos um out {outs.cardsToCome === 2 ? 'no turn ou no river' : 'no river'} ({outs.unknown} cartas
        desconhecidas).
        {count > 12 && multiplier === 4 && ' Com mais de 12 outs a regra do 4 exagera: use outs × 3 + 8.'}
      </p>
      {outs.groups.map(({ category, cards }) => (
        <div key={category}>
          <p className="mb-1 text-sm font-medium">
            {HAND_CATEGORIES[category]} <span className="text-white/50">({cards.length})</span>
          </p>
          <div className="flex flex-wrap gap-1">
            {cards.map((card) => (
              <PlayingCard key={card} card={card} size="sm" />
            ))}
          </div>
        </div>
      ))}
      {count === 0 && <p className="text-sm text-white/70">Nenhuma carta melhora sua mão de forma relevante.</p>}
      <p className="text-xs text-white/50">
        Outs são as cartas que melhoram a sua mão. Eles não garantem a vitória: a chance de vencer acima já considera as cartas
        dos adversários.
      </p>
    </div>
  )
}

export function FinalHandPanel({ result }: { result: EquityResult }) {
  const rows = HAND_CATEGORIES.map((name, category) => ({ name, chance: result.finalHand[category] }))
    .filter(({ chance }) => chance >= 0.0005)
    .reverse()
  const max = Math.max(...rows.map(({ chance }) => chance))
  return (
    <ul className="space-y-1.5">
      {rows.map(({ name, chance }) => (
        <li key={name} className="grid grid-cols-[7.5rem_1fr_3.5rem] items-center gap-2 text-sm">
          <span>{name}</span>
          <span className="h-2.5 rounded-full bg-white/10">
            <span className="block h-full rounded-full bg-gold" style={{ width: `${(chance / max) * 100}%` }} />
          </span>
          <span className="text-right tabular-nums text-white/80">{formatPercent(chance)}</span>
        </li>
      ))}
    </ul>
  )
}
