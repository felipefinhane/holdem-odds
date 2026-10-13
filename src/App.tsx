import { Eye, EyeOff, Lock, Minus, Plus, Settings, Spade, Users } from 'lucide-react'
import { type ReactNode, useCallback, useEffect, useMemo, useState } from 'react'
import { CardPicker } from './components/CardPicker'
import { DecisionPanel } from './components/DecisionPanel'
import { EquityPanel, FinalHandPanel, Label, OutsPanel, Section } from './components/Panels'
import { CardBack, CardSlot } from './components/PlayingCard'
import { SettingsScreen } from './components/SettingsScreen'
import { advise, planAction } from './lib/advice'
import type { Card } from './lib/cards'
import { describeHand, evaluate, HAND_CATEGORIES } from './lib/evaluate'
import { formatChips, formatPercent, parseAmount } from './lib/format'
import { countOuts } from './lib/outs'
import { potOdds } from './lib/potOdds'
import { DEFAULT_CONFIG, isTableConfig } from './lib/table'
import { DEFAULT_PREFERENCES, isPreferences, type RevealGesture } from './lib/preferences'
import { useEquity } from './lib/useEquity'
import { useAutoHide, useRevealGesture } from './lib/useReveal'
import { useStoredState } from './lib/useStoredState'

// Posições: 0-1 sua mão, 2-4 flop, 5 turn, 6 river.
const SLOT_LABELS = ['Carta 1', 'Carta 2', 'Flop', 'Flop', 'Flop', 'Turn', 'River']
const STREETS = [
  [0, 1],
  [2, 3, 4],
  [5],
  [6],
]
const EMPTY: (Card | null)[] = Array(7).fill(null)

const filled = (cards: (Card | null)[]) => cards.filter((card): card is Card => card !== null)

export default function App() {
  const [config, setConfig] = useStoredState('holdem-odds:config', DEFAULT_CONFIG, isTableConfig)
  const [showSettings, setShowSettings] = useState(false)
  const [slots, setSlots] = useState(EMPTY)
  const [active, setActive] = useState<number | null>(0)
  const [opponents, setOpponents] = useState(1)
  const [pot, setPot] = useState('')
  const [bet, setBet] = useState('')
  const [stack, setStack] = useState(String(config.startingStack))
  // Modo "esconder": protege suas cartas e probabilidades quando o celular fica na mesa.
  // Mostrar usa o gesto escolhido nas configurações; esconder é sempre um toque.
  const [preferences, setPreferences] = useStoredState('holdem-odds:preferences', DEFAULT_PREFERENCES, isPreferences)
  const [hidden, setHidden] = useStoredState('holdem-odds:hidden', false, (value) => typeof value === 'boolean')
  const hide = useCallback(() => setHidden(true), [setHidden])
  const reveal = useRevealGesture(preferences.revealGesture, () => setHidden(false))
  useAutoHide(!hidden, preferences.autoHideSeconds, hide)

  // Esconde sozinho quando a tela apaga ou você troca de app.
  useEffect(() => {
    const hideOnLeave = () => document.hidden && hide()
    document.addEventListener('visibilitychange', hideOnLeave)
    return () => document.removeEventListener('visibilitychange', hideOnLeave)
  }, [hide])

  const eyeButton = hidden ? reveal.handlers : { onClick: hide }
  const hint = REVEAL_HINTS[preferences.revealGesture]

  const hero = filled(slots.slice(0, 2))
  const flop = filled(slots.slice(2, 5))
  const flopComplete = flop.length === 3
  const turnComplete = flopComplete && slots[5] !== null
  const board = flopComplete ? filled(slots.slice(2, turnComplete ? 7 : 6)) : []
  const used = useMemo(() => new Set(filled(slots)), [slots])

  const { result, loading } = useEquity(hero.length === 2 ? hero : [], board, opponents)
  const outs = hero.length === 2 ? countOuts(hero, board) : null
  const handScore = hero.length === 2 ? evaluate([...hero, ...board]) : null
  // Antes do flop o pote nunca está vazio: com o campo em branco, valem os blinds.
  const blinds = board.length === 0 ? config.smallBlind + config.bigBlind : null
  const potAmount = pot === '' && blinds !== null ? blinds : parseAmount(pot)
  const betAmount = parseAmount(bet)
  const odds = result ? potOdds(potAmount, betAmount, result.equity, opponents) : null
  const advice = result
    ? advise({ equity: result.equity, opponents, boardSize: board.length, pot: potAmount, bet: betAmount, outs: outs?.outs.length ?? 0 })
    : null
  const actionPlan = advice ? planAction(advice, betAmount, parseAmount(stack), config) : null

  const slotDisabled = (index: number) => (index === 5 && !flopComplete) || (index === 6 && !turnComplete)

  const pick = (card: Card) => {
    if (active === null) return
    const next = slots.with(active, card)
    setSlots(next)
    // Avança para a próxima carta vazia da mesma rua (ex.: as 3 cartas do flop seguidas).
    const street = STREETS.find((street) => street.includes(active))!
    setActive(street.find((index) => next[index] === null) ?? null)
  }

  const clear = () => {
    if (active === null) return
    // Remover uma carta do flop ou turn invalida as ruas seguintes.
    setSlots(slots.map((card, index) => (index === active || (active >= 2 && index > Math.max(active, 4)) ? null : card)))
    setActive(null)
  }

  const newHand = () => {
    setSlots(EMPTY)
    setPot('')
    setBet('')
    setActive(0)
  }

  const drawSummary = outs?.groups.length
    ? `${outs.outs.length} outs: ${outs.groups.map(({ category, cards }) => `${HAND_CATEGORIES[category]} (${cards.length})`).join(', ')}`
    : null

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-30 bg-surface/90 pt-[env(safe-area-inset-top)] shadow-[0_4px_16px_rgba(0,18,11,0.5)] backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-[430px] items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <span className="hidden h-9 w-9 items-center justify-center rounded-lg bg-surface-container text-gold min-[400px]:flex">
              <Spade size={20} />
            </span>
            <div>
              <p className="font-display text-xl leading-tight font-semibold">
                Holdem <span className="text-gold">Odds</span>
              </p>
              <p className="flex items-center gap-1 font-display text-[10px] font-semibold tracking-wide whitespace-nowrap text-secondary">
                <span className="h-1.5 w-1.5 rounded-full bg-gold" />
                Stack: {formatChips(parseAmount(stack))} · Blinds {formatChips(config.smallBlind)}/{formatChips(config.bigBlind)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              {...eyeButton}
              className={`relative flex h-11 w-11 items-center justify-center overflow-hidden rounded-lg transition select-none active:scale-95 ${
                hidden ? `bg-gold/15 text-gold ring-1 ring-gold/60 ${GESTURE_TOUCH[preferences.revealGesture]}` : 'text-secondary active:bg-surface-container'
              } ${hidden && reveal.armed ? 'ring-2' : ''}`}
              aria-label={hidden ? hint.label : 'Esconder informações'}
              aria-pressed={!hidden}
            >
              {hidden && reveal.armed && preferences.revealGesture === 'long-press' && <span className="press-fill absolute inset-0 bg-gold/40" />}
              <span className="relative">{hidden ? <EyeOff size={20} /> : <Eye size={20} />}</span>
            </button>
            <button
              type="button"
              onClick={newHand}
              className="flex min-h-11 items-center gap-1 rounded-lg bg-gold px-2.5 font-display text-sm font-bold whitespace-nowrap text-on-gold shadow-[0_0_12px_rgba(245,197,66,0.3)] active:scale-95"
            >
              <Plus size={16} /> Nova mão
            </button>
            <button
              type="button"
              onClick={() => setShowSettings(true)}
              className="flex h-11 w-11 items-center justify-center rounded-lg text-secondary active:bg-surface-container"
              aria-label="Configuração da mesa"
            >
              <Settings size={20} />
            </button>
          </div>
        </div>
        {hidden ? (
          <div className="mx-auto flex max-w-[430px] items-center gap-2 px-4 pb-2 font-display text-xs font-bold text-gold">
            <Lock size={14} /> {reveal.armed ? hint.armed : hint.header}
            <span className="ml-auto flex items-center gap-1 text-secondary">
              <Users size={14} /> {opponents} {opponents === 1 ? 'oponente' : 'oponentes'}
            </span>
          </div>
        ) : advice && result && (
          <div className="mx-auto flex max-w-[430px] items-center gap-2 px-4 pb-2 font-display text-xs font-bold">
            <span className={`rounded px-2 py-1 ${actionPlan?.allIn ? 'bg-danger text-white' : SUMMARY_STYLES[advice.action]}`}>
              {actionPlan?.allIn ? 'ALL-IN' : advice.title}
              {actionPlan && ` ${formatChips(actionPlan.amount)}`}
            </span>
            <span className="rounded border border-success/40 px-2 py-1 text-success">{formatPercent(result.equity)} chance</span>
            <span className="ml-auto flex items-center gap-1 text-secondary">
              <Users size={14} /> {opponents} {opponents === 1 ? 'oponente' : 'oponentes'}
            </span>
          </div>
        )}
      </header>

      <main className={`mx-auto flex max-w-[430px] flex-col gap-3 px-4 pb-10 ${advice || hidden ? 'pt-28' : 'pt-20'}`}>
        <Section title="Sua mão">
          <div className="flex gap-3">
            <div className="flex gap-2">
              {[0, 1].map((index) =>
                hidden && slots[index] !== null ? (
                  <CardBack key={index} size="lg" />
                ) : (
                <CardSlot
                  key={index}
                  size="lg"
                  card={slots[index]}
                  label={SLOT_LABELS[index]}
                  active={active === index}
                  onClick={() => setActive(index)}
                />
                ),
              )}
            </div>
            <div className="min-w-0 flex-1">
              <Label>Combinação atual</Label>
              {hidden ? (
                <p className="flex items-center gap-1.5 font-display text-lg leading-tight font-semibold text-secondary">
                  <Lock size={16} /> Oculta
                </p>
              ) : (
                <>
                  <p className="font-display text-lg leading-tight font-semibold text-gold">
                    {handScore !== null ? describeHand(handScore) : 'Escolha suas 2 cartas'}
                  </p>
                  {drawSummary && <p className="mt-1 text-xs text-secondary">{drawSummary}</p>}
                </>
              )}
            </div>
          </div>
        </Section>

        <Section
          title="Mesa"
          aside={
            potAmount > 0 && (
              <span className="font-display text-sm text-secondary">
                Pote: <b className="text-gold">{formatChips(potAmount)}</b>
              </span>
            )
          }
        >
          <div className="flex gap-1.5">
            {[2, 3, 4, 5, 6].map((index) => (
              <div key={index} className={index === 5 ? 'ml-1.5' : ''}>
                <CardSlot
                  card={slots[index]}
                  label={SLOT_LABELS[index]}
                  active={active === index}
                  disabled={slotDisabled(index)}
                  onClick={() => setActive(index)}
                />
              </div>
            ))}
          </div>
          {flop.length > 0 && !flopComplete && <p className="mt-2 text-xs text-gold">Complete as 3 cartas do flop para usá-las no cálculo.</p>}
        </Section>

        <Section title="Adversários na mão" subtitle="Mais adversários reduzem sua chance">
          <div className="-mt-1 flex items-center justify-end gap-3">
            <StepperButton label="Menos adversários" disabled={opponents === 1} onClick={() => setOpponents(opponents - 1)}>
              <Minus size={20} />
            </StepperButton>
            <span className="w-10 text-center font-display text-4xl font-bold text-gold tabular-nums">{opponents}</span>
            <StepperButton label="Mais adversários" disabled={opponents === 8} onClick={() => setOpponents(opponents + 1)}>
              <Plus size={20} />
            </StepperButton>
          </div>
        </Section>

        {hidden ? (
          <section className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-gold/40 bg-surface-container px-4 py-8 text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-gold/15 text-gold">
              <EyeOff size={28} />
            </span>
            <p className="font-display text-lg font-semibold">Suas cartas e probabilidades estão ocultas</p>
            <p className="text-sm text-secondary">Seguro para deixar o celular na mesa. A mesa e os adversários continuam visíveis.</p>
            <button
              type="button"
              {...reveal.handlers}
              className={`relative mt-1 flex h-12 items-center gap-2 overflow-hidden rounded-xl bg-gold px-6 font-display font-bold text-on-gold select-none active:scale-95 ${GESTURE_TOUCH[preferences.revealGesture]}`}
            >
              {reveal.armed && preferences.revealGesture === 'long-press' && <span className="press-fill absolute inset-0 bg-on-gold/25" />}
              <Eye size={20} className="relative" />
              <span className="relative">{reveal.armed ? hint.armed : hint.button}</span>
            </button>
          </section>
        ) : result === null || advice === null ? (
          <p className="py-6 text-center text-secondary">Escolha as suas 2 cartas para ver as probabilidades.</p>
        ) : (
          <>
            <Section title="Probabilidade" aside={loading && <span className="text-xs text-secondary">calculando…</span>}>
              <EquityPanel result={result} loading={loading} opponents={opponents} />
            </Section>

            <Section title={<span className="text-2xl text-gold">Decisão</span>} className="ring-1 ring-gold/25">
              <DecisionPanel
                advice={advice}
                equity={result.equity}
                odds={odds}
                config={config}
                opponents={opponents}
                pot={pot}
                blinds={blinds}
                bet={bet}
                stack={stack}
                onPotChange={setPot}
                onBetChange={setBet}
                onStackChange={setStack}
              />
            </Section>

            {outs && (
              <Section
                title="Outs disponíveis"
                aside={
                  <span className="rounded bg-success/15 px-2 py-0.5 font-display text-xs font-bold text-success">
                    {outs.outs.length} cartas vivas
                  </span>
                }
              >
                <OutsPanel outs={outs} />
              </Section>
            )}

            <Section title={board.length === 5 ? 'Sua mão final' : 'Chance de terminar com'} aside={<Label>até o river</Label>}>
              <FinalHandPanel result={result} />
            </Section>

            <p className="text-center text-xs text-secondary/70">
              Simulação com {result.iterations.toLocaleString('pt-BR')} mãos aleatórias · margem de erro ≈ 0,5%
              <br />
              Os adversários recebem cartas aleatórias. Quem continua apostando costuma ter mão melhor, então seja mais conservador.
            </p>
          </>
        )}
      </main>

      {/* Escondido, só abre o seletor de uma carta sua se o espaço estiver vazio (não revela nada). */}
      {active !== null && !(hidden && active < 2 && slots[active] !== null) && (
        <CardPicker
          key={active}
          title={`Escolher: ${active < 2 ? 'sua ' + SLOT_LABELS[active].toLowerCase() : SLOT_LABELS[active]}`}
          current={slots[active]}
          used={used}
          onPick={pick}
          onClear={clear}
          onClose={() => setActive(null)}
        />
      )}

      {showSettings && (
        <SettingsScreen
          config={config}
          preferences={preferences}
          onClose={() => setShowSettings(false)}
          onSave={(next, nextPreferences) => {
            setConfig(next)
            setPreferences(nextPreferences)
            setStack(String(next.startingStack))
            setShowSettings(false)
          }}
        />
      )}
    </>
  )
}

const REVEAL_HINTS: Record<RevealGesture, { label: string; header: string; button: string; armed: string }> = {
  tap: { label: 'Mostrar informações', header: 'Toque no olho para ver', button: 'Mostrar', armed: 'Mostrar' },
  'double-tap': {
    label: 'Toque duas vezes para mostrar',
    header: 'Toque 2× no olho para ver',
    button: 'Toque 2× para mostrar',
    armed: 'Toque de novo…',
  },
  'long-press': {
    label: 'Segure para mostrar',
    header: 'Segure o olho para ver',
    button: 'Segure para mostrar',
    armed: 'Continue segurando…',
  },
}

// Toque duplo não pode virar zoom; segurar não pode virar rolagem.
const GESTURE_TOUCH: Record<RevealGesture, string> = { tap: '', 'double-tap': 'touch-manipulation', 'long-press': 'touch-none' }

const SUMMARY_STYLES = {
  fold: 'bg-danger text-white',
  check: 'bg-surface-highest text-on-surface',
  call: 'bg-success text-surface-lowest',
  bet: 'bg-gold text-on-gold',
  raise: 'bg-gold text-on-gold',
}

function StepperButton({ children, label, disabled, onClick }: { children: ReactNode; label: string; disabled: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className="flex h-12 w-12 items-center justify-center rounded-lg bg-surface-high active:scale-95 disabled:opacity-30"
    >
      {children}
    </button>
  )
}
