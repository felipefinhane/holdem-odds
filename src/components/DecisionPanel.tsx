import { AlertTriangle, CheckCircle2, Coins, Hand, Lightbulb, Pencil, Rocket, Undo2, Wallet, X, XCircle } from 'lucide-react'
import { type ReactNode, useState } from 'react'
import { type Action, type Advice, planAction } from '../lib/advice'
import { formatChips, formatPercent, parseAmount } from '../lib/format'
import type { PotOddsResult } from '../lib/potOdds'
import { CHIP_COLORS, planBet, roundToChips, sortedChips, type TableConfig, toBigBlinds } from '../lib/table'
import { Chip, ChipStack } from './Chip'
import { Label, PotOddsPanel } from './Panels'

type Field = 'pot' | 'bet'

type Props = {
  advice: Advice
  equity: number
  odds: PotOddsResult | null
  config: TableConfig
  opponents: number
  pot: string
  // Valor do pote quando o campo está vazio antes do flop (os blinds).
  blinds: number | null
  bet: string
  stack: string
  onPotChange: (value: string) => void
  onBetChange: (value: string) => void
  onStackChange: (value: string) => void
}

const formatBB = (amount: number, bigBlind: number) => `${formatChips(toBigBlinds(amount, bigBlind))} BB`

export function DecisionPanel(props: Props) {
  const { advice, equity, odds, config, opponents, pot, bet, blinds, stack, onPotChange, onBetChange, onStackChange } = props
  const [active, setActive] = useState<Field>('pot')
  const [history, setHistory] = useState<{ field: Field; value: string }[]>([])
  const [editingStack, setEditingStack] = useState(false)

  const values = { pot, bet }
  const setters = { pot: onPotChange, bet: onBetChange }
  const potAmount = pot === '' && blinds !== null ? blinds : parseAmount(pot)
  const betAmount = parseAmount(bet)
  const stackAmount = parseAmount(stack)

  const change = (field: Field, value: string) => {
    setHistory([...history, { field, value: values[field] }])
    setters[field](value)
  }
  const addChip = (value: number) => change(active, String(parseAmount(values[active]) + value))
  const undo = () => {
    const last = history.at(-1)
    if (!last) return
    setters[last.field](last.value)
    setHistory(history.slice(0, -1))
  }
  const setBetTo = (value: string) => {
    setActive('bet')
    change('bet', value)
  }

  const quickBets = [
    { label: '½ pote', fraction: 1 / 2 },
    { label: '⅔ pote', fraction: 2 / 3 },
    { label: 'Pote', fraction: 1 },
  ].map(({ label, fraction }) => ({ label, amount: roundToChips(potAmount * fraction, config.chips) }))

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between rounded-lg bg-surface-lowest px-3 py-2 text-xs">
        <span className="flex items-center gap-1.5">
          <Wallet size={15} className="text-gold" />
          <span className="text-secondary">Seu stack:</span>
          {editingStack ? (
            <input
              autoFocus
              inputMode="numeric"
              value={stack}
              onChange={(event) => onStackChange(event.target.value.replace(/\D/g, ''))}
              onBlur={() => setEditingStack(false)}
              className="w-20 rounded bg-surface-high px-2 py-1 font-display font-bold outline-none focus:ring-1 focus:ring-gold"
            />
          ) : (
            <b className="font-display">{formatChips(stackAmount)} fichas</b>
          )}
          <span className="rounded bg-surface-highest px-1.5 py-0.5 font-display text-[10px] font-bold text-gold">
            {formatBB(stackAmount, config.bigBlind)}
          </span>
        </span>
        <button type="button" onClick={() => setEditingStack(!editingStack)} className="flex min-h-8 items-center gap-1 font-bold text-gold">
          <Pencil size={13} /> {editingStack ? 'OK' : 'Ajustar'}
        </button>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <AmountField
          label="Pote antes da aposta"
          value={pot}
          placeholder={blinds !== null ? `${formatChips(blinds)} (blinds)` : '0'}
          active={active === 'pot'}
          bigBlinds={formatBB(potAmount, config.bigBlind)}
          hint={pot === '' && blinds !== null ? 'Só os blinds, por enquanto' : potAmount > 0 ? `${formatChips(potAmount)} fichas no meio` : 'Toque nas fichas abaixo'}
          onFocus={() => setActive('pot')}
          onChange={(value) => change('pot', value)}
        />
        <AmountField
          label="Aposta p/ pagar"
          value={bet}
          placeholder="Sem aposta"
          active={active === 'bet'}
          bigBlinds={formatBB(betAmount, config.bigBlind)}
          hint={betAmount > 0 ? (betAmount >= stackAmount ? 'Pagar = all-in' : `${formatPercent(betAmount / Math.max(potAmount, 1))} do pote`) : 'Ninguém apostou'}
          onFocus={() => setActive('bet')}
          onChange={(value) => change('bet', value)}
        />
      </div>

      <div className="space-y-2 rounded-xl bg-surface-lowest p-3">
        <div className="flex items-center justify-between gap-2">
          <Label>Fichas · somam no {active === 'pot' ? 'pote' : 'campo de aposta'}</Label>
          <div className="flex gap-1.5">
            <TrayButton onClick={undo} disabled={history.length === 0}>
              <Undo2 size={13} /> Desfazer
            </TrayButton>
            <TrayButton onClick={() => change(active, '')} className="text-danger">
              <X size={13} /> Limpar
            </TrayButton>
          </div>
        </div>
        <div className="flex flex-wrap justify-around gap-2">
          {sortedChips(config.chips).map((chip) => (
            <button
              key={chip.color + chip.value}
              type="button"
              onClick={() => addChip(chip.value)}
              className="flex min-w-16 flex-col items-center gap-1 rounded-lg p-1 transition active:scale-90 active:bg-surface-container"
            >
              <Chip color={chip.color} value={chip.value} size="lg" />
              <span className="text-[11px] font-semibold">{CHIP_COLORS[chip.color].name}</span>
              <span className="text-[10px] text-outline">{formatBB(chip.value, config.bigBlind)}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-1.5">
        <QuickBet label="Sem aposta" selected={betAmount === 0} onClick={() => setBetTo('')} />
        {quickBets.map(({ label, amount }) => (
          <QuickBet
            key={label}
            label={label}
            amount={potAmount > 0 ? amount : undefined}
            selected={betAmount > 0 && betAmount === amount}
            disabled={!(potAmount > 0)}
            onClick={() => setBetTo(String(amount))}
          />
        ))}
      </div>

      <ActionBanner advice={advice} bet={betAmount} stack={stackAmount} config={config} />
      <OtherOptions advice={advice} pot={potAmount} bet={betAmount} stack={stackAmount} config={config} />

      <p className="flex gap-2 text-sm">
        <Lightbulb size={18} className="mt-0.5 shrink-0 text-gold" />
        <span>{advice.reason}</span>
      </p>

      <StrengthMeter advice={advice} equity={equity} />

      {advice.note && (
        <p className="flex gap-2 rounded-lg border border-gold/30 bg-gold/10 p-2.5 text-xs text-gold-light">
          <AlertTriangle size={16} className="shrink-0 text-gold" />
          {advice.note}
        </p>
      )}

      {odds && <PotOddsPanel odds={odds} equity={equity} pot={potAmount} bet={betAmount} opponents={opponents} />}
    </div>
  )
}

type AmountFieldProps = {
  label: string
  value: string
  placeholder?: string
  active: boolean
  bigBlinds: string
  hint: string
  onFocus: () => void
  onChange: (value: string) => void
}

function AmountField({ label, value, placeholder = '0', active, bigBlinds, hint, onFocus, onChange }: AmountFieldProps) {
  return (
    <label
      className={`recessed flex flex-col rounded-xl bg-surface-lowest p-2.5 transition ${active ? 'ring-2 ring-gold' : 'ring-1 ring-surface-highest'}`}
      onClick={onFocus}
    >
      <span className={`font-display text-[11px] font-semibold ${active ? 'text-gold' : 'text-outline'}`}>
        {label}
        {active && ' · ativo'}
      </span>
      <span className="mt-0.5 flex items-baseline gap-1">
        <input
          inputMode="numeric"
          value={value}
          placeholder={placeholder}
          onFocus={onFocus}
          onChange={(event) => onChange(event.target.value.replace(/\D/g, ''))}
          className="w-full min-w-0 bg-transparent font-display text-2xl font-bold tabular-nums outline-none placeholder:text-base placeholder:font-semibold placeholder:text-outline"
        />
        <span className={`font-display text-xs font-bold whitespace-nowrap ${active ? 'text-gold' : 'text-outline'}`}>{bigBlinds}</span>
      </span>
      <span className="text-[10px] text-outline">{hint}</span>
    </label>
  )
}

function TrayButton({ children, onClick, disabled, className = '' }: { children: ReactNode; onClick: () => void; disabled?: boolean; className?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`flex min-h-8 items-center gap-1 rounded bg-surface-high px-2 font-display text-[11px] font-semibold active:scale-95 disabled:opacity-30 ${className}`}
    >
      {children}
    </button>
  )
}

type QuickBetProps = { label: string; amount?: number; selected: boolean; disabled?: boolean; onClick: () => void }

function QuickBet({ label, amount, selected, disabled, onClick }: QuickBetProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`min-h-11 flex-1 rounded-lg px-1 font-display text-xs leading-tight font-semibold transition active:scale-95 disabled:opacity-30 ${
        selected ? 'bg-gold text-on-gold' : 'bg-surface-high text-secondary'
      }`}
    >
      {label}
      {amount !== undefined && <span className="block text-[11px] opacity-80">{formatChips(amount)}</span>}
    </button>
  )
}

const BANNERS: Record<Action, { style: string; icon: typeof Hand; subtitle: string }> = {
  fold: { style: 'bg-danger text-white', icon: XCircle, subtitle: 'Desista da mão · não coloque mais fichas' },
  check: { style: 'bg-surface-highest text-on-surface', icon: Hand, subtitle: 'Passe a vez sem colocar fichas' },
  call: { style: 'bg-success text-surface-lowest', icon: CheckCircle2, subtitle: 'Pague a aposta' },
  bet: { style: 'bg-gradient-to-br from-gold via-gold-light to-gold text-on-gold', icon: Coins, subtitle: '' },
  raise: { style: 'bg-gradient-to-br from-gold via-gold-light to-gold text-on-gold', icon: Rocket, subtitle: '' },
}

function ActionBanner({ advice, bet, stack, config }: { advice: Advice; bet: number; stack: number; config: TableConfig }) {
  const plan = planAction(advice, bet, stack, config)
  const allIn = plan?.allIn ?? false
  const banner = BANNERS[advice.action]
  const Icon = allIn ? AlertTriangle : banner.icon

  return (
    <div
      className={`relative overflow-hidden rounded-2xl p-5 text-center shadow-xl ${
        allIn ? 'bg-gradient-to-br from-[#93000a] to-danger text-white' : banner.style
      }`}
    >
      <Icon size={110} className="absolute -right-5 -bottom-5 opacity-10" />
      <div className="flex items-center justify-center gap-2">
        <span className="font-display text-[11px] font-bold tracking-widest uppercase opacity-80">Ação recomendada</span>
        <span className="rounded-full bg-black/15 px-2 py-0.5 font-display text-[10px] font-bold">
          Continuar: {advice.continueHand ? 'SIM' : 'NÃO'}
        </span>
      </div>
      <p className="font-display text-5xl leading-tight font-bold tracking-tight">{allIn ? 'ALL-IN' : advice.title}</p>
      <p className="font-display text-lg font-bold">
        {plan
          ? `${formatChips(plan.amount)} fichas · ${formatChips(plan.bigBlinds)} BB${advice.sizing && !allIn ? ` (${advice.sizing.label})` : ''}`
          : advice.sizing
            ? advice.sizing.label
            : banner.subtitle}
      </p>
      {allIn && <p className="mt-1 text-sm opacity-90">A jogada usa todas as suas fichas.</p>}
      {plan?.chips && plan.chips.length > 0 && (
        <div className="mt-3 border-t border-current/15 pt-2.5">
          <p className="mb-1.5 font-display text-[11px] font-bold tracking-wider uppercase opacity-80">Fichas para colocar no pote</p>
          <ChipStack chips={plan.chips} />
        </div>
      )}
    </div>
  )
}

type OptionsProps = { advice: Advice; pot: number; bet: number; stack: number; config: TableConfig }

function OtherOptions({ advice, pot, bet, stack, config }: OptionsProps) {
  const options =
    advice.action === 'bet' && pot > 0
      ? [
          { label: '½ pote', amount: pot / 2 },
          { label: '⅔ pote', amount: (pot * 2) / 3 },
          { label: 'Pote', amount: pot },
        ]
      : advice.action === 'raise'
        ? [
            { label: '2,5×', amount: bet * 2.5 },
            { label: '3×', amount: bet * 3 },
            { label: '4×', amount: bet * 4 },
          ]
        : []
  // Quando a jogada recomendada já é all-in, as outras opções seriam todas all-in também.
  if (options.length === 0 || planAction(advice, bet, stack, config)?.allIn) return null

  return (
    <div>
      <Label>Outras opções</Label>
      <div className="mt-1.5 grid grid-cols-3 gap-2">
        {options.map(({ label, amount }) => {
          const plan = planBet(amount, stack, config)
          return (
            <div key={label} className="rounded-lg bg-surface-lowest p-2">
              <p className="flex justify-between font-display text-[11px] font-semibold text-gold">
                <span>{label}</span>
                <span className="text-outline">{formatChips(plan.bigBlinds)} BB</span>
              </p>
              <p className="font-display text-lg font-bold tabular-nums">{plan.allIn ? 'All-in' : formatChips(plan.amount)}</p>
              <div className="mt-1 flex flex-wrap gap-0.5">
                {plan.chips?.flatMap(({ chip, count }) =>
                  Array.from({ length: Math.min(count, 4) }, (_, i) => <Chip key={chip.color + i} color={chip.color} value={chip.value} size="xs" />),
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

const STRENGTH_STEPS = [
  { key: 'weak', label: 'Fraca' },
  { key: 'medium', label: 'Média' },
  { key: 'strong', label: 'Forte' },
] as const

function StrengthMeter({ advice, equity }: { advice: Advice; equity: number }) {
  const level = STRENGTH_STEPS.findIndex(({ key }) => key === advice.strength)
  return (
    <div>
      <div className="flex justify-between text-xs">
        <Label>Força relativa</Label>
        <span className="font-display font-semibold text-gold">
          {STRENGTH_STEPS[level].label} ({formatPercent(equity)} vs {formatPercent(advice.fairShare)} justa)
        </span>
      </div>
      <div className="mt-1.5 grid grid-cols-3 gap-1">
        {STRENGTH_STEPS.map(({ key, label }, i) => (
          <div key={key}>
            <div className={`h-1.5 rounded-sm ${i <= level ? 'bg-gold' : 'bg-surface-highest'}`} />
            <p className={`mt-1 text-center text-[10px] ${i === level ? 'font-bold text-gold' : 'text-outline'}`}>{label}</p>
          </div>
        ))}
      </div>
      <p className="mt-1 text-[11px] text-outline">Parte justa = o que cada jogador teria se todos fossem iguais.</p>
    </div>
  )
}
