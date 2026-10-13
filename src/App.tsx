import { useMemo, useState } from 'react'
import { CardPicker } from './components/CardPicker'
import { EquityPanel, FinalHandPanel, OutsPanel, PotOddsPanel, Section } from './components/Panels'
import { CardSlot } from './components/PlayingCard'
import type { Card } from './lib/cards'
import { describeHand, evaluate } from './lib/evaluate'
import { countOuts } from './lib/outs'
import { potOdds } from './lib/potOdds'
import { useEquity } from './lib/useEquity'

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
const parseAmount = (text: string) => Number(text.replace(',', '.'))

export default function App() {
  const [slots, setSlots] = useState(EMPTY)
  const [active, setActive] = useState<number | null>(0)
  const [opponents, setOpponents] = useState(1)
  const [pot, setPot] = useState('')
  const [bet, setBet] = useState('')

  const hero = filled(slots.slice(0, 2))
  const flop = filled(slots.slice(2, 5))
  const flopComplete = flop.length === 3
  const turnComplete = flopComplete && slots[5] !== null
  const board = flopComplete ? filled(slots.slice(2, turnComplete ? 7 : 6)) : []
  const used = useMemo(() => new Set(filled(slots)), [slots])

  const { result, loading } = useEquity(hero.length === 2 ? hero : [], board, opponents)
  const outs = hero.length === 2 ? countOuts(hero, board) : null
  const handScore = hero.length === 2 ? evaluate([...hero, ...board]) : null
  const odds = result ? potOdds(parseAmount(pot || '0'), parseAmount(bet), result.equity) : null

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

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col gap-3 px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-10">
      <header className="flex items-center justify-between">
        <h1 className="text-xl font-bold">
          Holdem <span className="text-gold">Odds</span>
        </h1>
        <button type="button" onClick={newHand} className="rounded-lg bg-white/10 px-3 py-1.5 text-sm active:bg-white/20">
          Nova mão
        </button>
      </header>

      <Section title="Sua mão" aside={handScore !== null && <span className="text-sm text-gold">{describeHand(handScore)}</span>}>
        <div className="flex gap-2">
          {[0, 1].map((index) => (
            <CardSlot key={index} card={slots[index]} label={SLOT_LABELS[index]} active={active === index} onClick={() => setActive(index)} />
          ))}
        </div>
      </Section>

      <Section title="Mesa">
        <div className="flex gap-1.5">
          {[2, 3, 4, 5, 6].map((index) => (
            <div key={index} className={index === 5 ? 'ml-2' : index === 6 ? 'ml-1' : ''}>
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
        {flop.length > 0 && !flopComplete && <p className="mt-2 text-xs text-amber-200">Complete as 3 cartas do flop para usá-las no cálculo.</p>}
      </Section>

      <Section title="Adversários">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => setOpponents(Math.max(1, opponents - 1))}
            disabled={opponents === 1}
            className="h-11 w-11 rounded-full bg-white/10 text-2xl disabled:opacity-30"
            aria-label="Menos adversários"
          >
            −
          </button>
          <p className="text-center">
            <span className="text-3xl font-bold">{opponents}</span>
            <span className="block text-xs text-white/60">ainda na mão</span>
          </p>
          <button
            type="button"
            onClick={() => setOpponents(Math.min(8, opponents + 1))}
            disabled={opponents === 8}
            className="h-11 w-11 rounded-full bg-white/10 text-2xl disabled:opacity-30"
            aria-label="Mais adversários"
          >
            +
          </button>
        </div>
      </Section>

      {result === null ? (
        <p className="py-6 text-center text-white/70">Escolha as suas 2 cartas para ver as probabilidades.</p>
      ) : (
        <>
          <Section title="Probabilidade" aside={loading && <span className="text-xs text-white/50">calculando…</span>}>
            <EquityPanel result={result} loading={loading} opponents={opponents} />
          </Section>

          <Section title="Pote">
            <div className="grid grid-cols-2 gap-2">
              <AmountInput label="Pote antes da aposta" value={pot} onChange={setPot} />
              <AmountInput label="Aposta para pagar" value={bet} onChange={setBet} />
            </div>
            {parseAmount(pot) > 0 && (
              <div className="mt-2 flex gap-2">
                {[
                  ['½ pote', 0.5],
                  ['⅔ pote', 2 / 3],
                  ['Pote', 1],
                ].map(([label, fraction]) => (
                  <button
                    key={label}
                    type="button"
                    onClick={() => setBet(String(Math.round(parseAmount(pot) * (fraction as number))))}
                    className="flex-1 rounded-lg bg-white/10 py-2 text-sm active:bg-white/20"
                  >
                    {label}
                  </button>
                ))}
              </div>
            )}
            <div className="mt-3">
              {odds ? (
                <PotOddsPanel odds={odds} equity={result.equity} pot={parseAmount(pot || '0')} bet={parseAmount(bet)} />
              ) : (
                <p className="text-sm text-white/60">Informe o pote e a aposta para saber se o call vale a pena.</p>
              )}
            </div>
          </Section>

          {outs && (
            <Section title="Outs">
              <OutsPanel outs={outs} />
            </Section>
          )}

          <Section title={board.length === 5 ? 'Sua mão final' : 'Chance de terminar com'}>
            <FinalHandPanel result={result} />
          </Section>

          <p className="text-center text-xs text-white/40">
            Simulação com {result.iterations.toLocaleString('pt-BR')} mãos aleatórias · margem de erro ≈ 0,5%
            <br />
            Os adversários recebem cartas aleatórias. Quem continua apostando costuma ter mão melhor, então seja mais conservador.
          </p>
        </>
      )}

      {active !== null && (
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
    </main>
  )
}

function AmountInput({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="block">
      <span className="text-xs text-white/60">{label}</span>
      <input
        type="text"
        inputMode="decimal"
        placeholder="0"
        value={value}
        onChange={(event) => onChange(event.target.value.replace(/[^\d.,]/g, ''))}
        className="mt-1 w-full rounded-lg bg-black/30 px-3 py-2.5 text-lg font-semibold tabular-nums ring-1 ring-white/15 outline-none focus:ring-gold"
      />
    </label>
  )
}
