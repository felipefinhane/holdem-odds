import { ChevronDown } from 'lucide-react'
import type { ReactNode } from 'react'
import type { EquityResult } from '../lib/equity'
import { HAND_CATEGORIES } from '../lib/evaluate'
import { formatChips, formatPercent, formatSignedChips } from '../lib/format'
import type { OutsResult } from '../lib/outs'
import type { PotOddsResult } from '../lib/potOdds'
import { PlayingCard } from './PlayingCard'

type SectionProps = { title: ReactNode; subtitle?: ReactNode; aside?: ReactNode; children: ReactNode; className?: string }

export function Section({ title, subtitle, aside, children, className = '' }: SectionProps) {
  return (
    <section
      className={`rounded-xl border-t border-white/8 bg-surface-container p-4 shadow-[0_4px_12px_rgba(4,26,19,0.6)] ${className}`}
    >
      <div className="mb-3 flex items-start justify-between gap-2">
        <div>
          <h2 className="font-display text-lg font-semibold">{title}</h2>
          {subtitle && <p className="text-xs text-secondary">{subtitle}</p>}
        </div>
        {aside}
      </div>
      {children}
    </section>
  )
}

export const Label = ({ children, className = '' }: { children: ReactNode; className?: string }) => (
  <span className={`font-display text-[11px] font-semibold tracking-wider text-secondary uppercase ${className}`}>{children}</span>
)

export function EquityPanel({ result, loading, opponents }: { result: EquityResult; loading: boolean; opponents: number }) {
  return (
    <div className={`transition-opacity ${loading ? 'opacity-60' : ''}`}>
      <div className="flex items-start justify-between">
        <Label className="text-success">Equity real</Label>
        <span className="text-right text-xs text-secondary">
          vs {opponents} {opponents === 1 ? 'adversário' : 'adversários'}
          <br />
          aleatório{opponents === 1 ? '' : 's'}
        </span>
      </div>
      <p className="mt-1 flex items-baseline gap-2">
        <span className="font-display text-5xl font-bold tracking-tight text-success tabular-nums">{formatPercent(result.equity)}</span>
        <span className="text-sm text-secondary">chance de vencer</span>
      </p>
      <div className="mt-3 flex h-3 overflow-hidden rounded-sm bg-surface-lowest">
        <div className="bg-success" style={{ width: `${result.win * 100}%` }} />
        <div className="bg-gold" style={{ width: `${result.tie * 100}%` }} />
        <div className="bg-danger" style={{ width: `${result.lose * 100}%` }} />
      </div>
      <div className="mt-2 flex justify-between font-display text-xs font-semibold tabular-nums">
        <Legend color="bg-success" label="Vence" value={result.win} />
        <Legend color="bg-gold" label="Empata" value={result.tie} />
        <Legend color="bg-danger" label="Perde" value={result.lose} />
      </div>
    </div>
  )
}

const Legend = ({ color, label, value }: { color: string; label: string; value: number }) => (
  <span className="flex items-center gap-1.5">
    <span className={`h-2 w-2 rounded-full ${color}`} />
    {label} {formatPercent(value)}
  </span>
)

export const Stat = ({ label, value, tone = 'text-on-surface' }: { label: string; value: ReactNode; tone?: string }) => (
  <div className="rounded-lg bg-surface-lowest p-2.5 text-center">
    <p className="text-[11px] text-secondary">{label}</p>
    <p className={`font-display text-xl font-bold tabular-nums ${tone}`}>{value}</p>
  </div>
)

type PotOddsProps = { odds: PotOddsResult; equity: number; pot: number; bet: number }

export function PotOddsPanel({ odds, equity, pot, bet }: PotOddsProps) {
  const favorable = odds.verdict === 'call'
  return (
    <div className="space-y-3 rounded-xl bg-surface-lowest p-3">
      <div className="flex items-center justify-between gap-2">
        <p className="font-display text-sm font-semibold">Pagar a aposta</p>
        <span className={`rounded px-2 py-0.5 font-display text-[11px] font-bold ${favorable ? 'bg-success/20 text-success' : 'bg-danger/20 text-danger'}`}>
          {favorable ? '+EV favorável' : 'EV negativo'}
        </span>
      </div>
      <p className="text-sm text-secondary">
        Você tem <b className="text-on-surface">{formatPercent(equity)}</b> e precisa de no mínimo{' '}
        <b className="text-gold">{formatPercent(odds.required)}</b>.
      </p>
      <div className="relative h-3 rounded-sm bg-surface-high">
        <div className={`h-full rounded-sm ${favorable ? 'bg-success' : 'bg-danger'}`} style={{ width: `${Math.min(equity, 1) * 100}%` }} />
        <div className="absolute -top-1 h-5 w-0.5 bg-gold" style={{ left: `${odds.required * 100}%` }} />
      </div>
      <div className="flex justify-between text-[11px] text-secondary">
        <span>0%</span>
        <span className="text-gold">| mínimo {formatPercent(odds.required)}</span>
        <span>100%</span>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Stat label="Lucro médio (call)" value={`${formatSignedChips(odds.expectedValue)}`} tone={odds.expectedValue >= 0 ? 'text-success' : 'text-danger'} />
        <Stat label="Vale pagar até" value={odds.maxCall === Infinity ? 'qualquer' : formatChips(odds.maxCall)} tone="text-gold" />
      </div>
      <details className="group text-sm text-secondary">
        <summary className="flex cursor-pointer list-none items-center justify-between font-display font-semibold text-on-surface">
          Como foi calculado <ChevronDown size={16} className="transition group-open:rotate-180" />
        </summary>
        <ol className="mt-2 list-decimal space-y-1 pl-5">
          <li>
            Pote final = {formatChips(pot)} + {formatChips(bet)} (aposta) + {formatChips(bet)} (seu call) ={' '}
            <b className="text-on-surface">{formatChips(odds.finalPot)}</b>
          </li>
          <li>
            Chance mínima = {formatChips(bet)} ÷ {formatChips(odds.finalPot)} = <b className="text-on-surface">{formatPercent(odds.required)}</b>
          </li>
          <li>
            Lucro médio = {formatPercent(equity)} × {formatChips(pot + bet)} − {formatPercent(1 - equity)} × {formatChips(bet)} ={' '}
            <b className="text-on-surface">{formatSignedChips(odds.expectedValue)}</b>
          </li>
        </ol>
        <p className="mt-2 text-xs">
          Considera que você vê todas as cartas até o river. Apostas futuras (implied odds) podem justificar um call um pouco abaixo da
          conta.
        </p>
      </details>
    </div>
  )
}

export function OutsPanel({ outs }: { outs: OutsResult }) {
  const multiplier = outs.cardsToCome === 2 ? 4 : 2
  const count = outs.outs.length
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-2">
        <Stat label="Total de outs" value={count} tone="text-gold" />
        <Stat label={`Regra (${count} × ${multiplier})`} value={formatPercent(outs.ruleOfThumb)} />
        <Stat label="Cálculo exato" value={formatPercent(outs.exact)} tone="text-success" />
      </div>
      <p className="text-xs text-secondary">
        Chance de sair pelo menos um out {outs.cardsToCome === 2 ? 'no turn ou no river' : 'no river'} ({outs.unknown} cartas
        desconhecidas).
        {count > 12 && multiplier === 4 && ' Com mais de 12 outs a regra do 4 exagera: use outs × 3 + 8.'}
      </p>
      {outs.groups.map(({ category, cards }) => (
        <div key={category}>
          <p className="mb-1.5 font-display text-sm font-semibold">
            {HAND_CATEGORIES[category]} <span className="text-secondary">({cards.length} outs)</span>
          </p>
          <div className="flex flex-wrap gap-1">
            {cards.map((card) => (
              <PlayingCard key={card} card={card} size="sm" />
            ))}
          </div>
        </div>
      ))}
      {count === 0 && <p className="text-sm text-secondary">Nenhuma carta melhora sua mão de forma relevante.</p>}
      <p className="text-xs text-secondary/70">
        Outs são cartas que melhoram a sua mão, mas não garantem a vitória. A equity acima já considera as cartas dos adversários.
      </p>
    </div>
  )
}

export function FinalHandPanel({ result }: { result: EquityResult }) {
  const rows = HAND_CATEGORIES.map((name, category) => ({ name, chance: result.finalHand[category] }))
    .filter(({ chance }) => chance >= 0.0005)
    .sort((a, b) => b.chance - a.chance)
  const max = Math.max(...rows.map(({ chance }) => chance))
  return (
    <ul className="space-y-2.5">
      {rows.map(({ name, chance }, i) => (
        <li key={name}>
          <div className="flex justify-between text-sm">
            <span className={i === 0 ? 'font-semibold text-success' : ''}>{name}</span>
            <span className="font-display font-semibold tabular-nums">{formatPercent(chance)}</span>
          </div>
          <div className="mt-1 h-1.5 rounded-sm bg-surface-lowest">
            <div className={`h-full rounded-sm ${i === 0 ? 'bg-success' : 'bg-gold'}`} style={{ width: `${(chance / max) * 100}%` }} />
          </div>
        </li>
      ))}
    </ul>
  )
}
