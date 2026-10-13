import { AlertTriangle, ArrowLeft, ArrowLeftRight, CheckCircle2, Coins, Eye, Hand, Plus, RotateCcw, ShieldCheck, Trash2, Wallet } from 'lucide-react'
import { type ReactNode, useState } from 'react'
import { formatChips, parseAmount } from '../lib/format'
import { DEFAULT_PREFERENCES, type Preferences, type RevealMode } from '../lib/preferences'
import { CHIP_COLORS, type ChipColor, chipsTotal, DEFAULT_CONFIG, type TableConfig, toBigBlinds } from '../lib/table'
import { Chip } from './Chip'

type Props = {
  config: TableConfig
  preferences: Preferences
  onSave: (config: TableConfig, preferences: Preferences) => void
  onClose: () => void
}

export function SettingsScreen({ config, preferences, onSave, onClose }: Props) {
  const [draft, setDraft] = useState(config)
  const [draftPreferences, setDraftPreferences] = useState(preferences)
  const [adding, setAdding] = useState(false)
  const update = (patch: Partial<TableConfig>) => setDraft({ ...draft, ...patch })
  const updateChip = (index: number, patch: Partial<TableConfig['chips'][number]>) =>
    update({ chips: draft.chips.map((chip, i) => (i === index ? { ...chip, ...patch } : chip)) })

  const total = chipsTotal(draft.chips)
  const difference = draft.startingStack - total
  const freeColors = (Object.keys(CHIP_COLORS) as ChipColor[]).filter((color) => !draft.chips.some((chip) => chip.color === color))

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-surface">
      <div className="mx-auto max-w-[430px] px-4 pt-[max(0.75rem,env(safe-area-inset-top))] pb-10">
        <header className="flex h-14 items-center gap-3">
          <button type="button" onClick={onClose} className="flex h-11 w-11 items-center justify-center rounded-lg" aria-label="Voltar">
            <ArrowLeft size={24} />
          </button>
          <h1 className="font-display text-xl font-semibold">Configuração da mesa</h1>
        </header>
        <p className="mb-4 text-secondary">Defina o stack inicial e o valor das fichas para calcular o pote e as apostas em fichas reais.</p>

        <div className="space-y-3">
          <Card icon={<Wallet size={20} />} title="Stack inicial" aside={<Pill>= {formatChips(toBigBlinds(draft.startingStack, draft.bigBlind))} BB</Pill>}>
            <label className="recessed flex items-baseline justify-between rounded-lg bg-surface-lowest px-4 py-3">
              <input
                inputMode="numeric"
                value={draft.startingStack || ''}
                placeholder="0"
                onChange={(event) => update({ startingStack: parseAmount(event.target.value) })}
                className="w-full min-w-0 bg-transparent font-display text-4xl font-bold text-gold-light tabular-nums outline-none"
                aria-label="Stack inicial"
              />
              <span className="font-display font-semibold text-secondary">fichas</span>
            </label>
            <div className="mt-2 grid grid-cols-3 gap-2">
              {[100, 500, 1000].map((step) => (
                <button
                  key={step}
                  type="button"
                  onClick={() => update({ startingStack: draft.startingStack + step })}
                  className="h-11 rounded-lg bg-surface-high font-display font-semibold active:scale-95"
                >
                  +{formatChips(step)}
                </button>
              ))}
            </div>
          </Card>

          <Card icon={<ArrowLeftRight size={20} />} title="Blinds">
            <div className="grid grid-cols-2 gap-2">
              <BlindInput label="Small blind" suffix="SB" value={draft.smallBlind} onChange={(smallBlind) => update({ smallBlind })} />
              <BlindInput label="Big blind" suffix="BB" value={draft.bigBlind} onChange={(bigBlind) => update({ bigBlind })} />
            </div>
            <p className="mt-2 text-xs text-secondary">O big blind é a referência dos tamanhos de aposta (ex.: 50 fichas = 5 BB).</p>
          </Card>

          <Card icon={<Coins size={20} />} title="Fichas da mesa" aside={<Pill>{draft.chips.length} tipos</Pill>}>
            <div className="space-y-2">
              {draft.chips.map((chip, index) => (
                <div key={chip.color} className="flex items-center gap-2 rounded-lg bg-surface-lowest p-2">
                  <Chip color={chip.color} value={chip.value} size="lg" />
                  <div className="min-w-0 flex-1">
                    <p className="font-display text-sm font-semibold">{CHIP_COLORS[chip.color].name}</p>
                    <p className="flex items-center gap-1 text-xs text-secondary">
                      vale
                      <input
                        inputMode="numeric"
                        value={chip.value || ''}
                        onChange={(event) => updateChip(index, { value: parseAmount(event.target.value) })}
                        className="w-11 rounded bg-surface-high px-1 py-0.5 text-center font-display text-sm font-bold text-gold outline-none focus:ring-1 focus:ring-gold"
                        aria-label={`Valor da ficha ${CHIP_COLORS[chip.color].name}`}
                      />
                    </p>
                    <p className="text-[11px] text-outline">= {formatChips(chip.value * chip.quantity)} no stack</p>
                  </div>
                  <div className="flex items-center">
                    <StepButton onClick={() => updateChip(index, { quantity: Math.max(0, chip.quantity - 1) })} label="Menos fichas">
                      −
                    </StepButton>
                    <span className="w-8 text-center font-display font-bold tabular-nums">{chip.quantity}</span>
                    <StepButton onClick={() => updateChip(index, { quantity: chip.quantity + 1 })} label="Mais fichas">
                      +
                    </StepButton>
                  </div>
                  <button
                    type="button"
                    onClick={() => update({ chips: draft.chips.filter((_, i) => i !== index) })}
                    className="flex h-10 w-9 items-center justify-center rounded text-danger"
                    aria-label={`Remover ficha ${CHIP_COLORS[chip.color].name}`}
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}

              {adding ? (
                <div className="rounded-lg bg-surface-lowest p-3">
                  <p className="mb-2 text-sm text-secondary">Escolha a cor da nova ficha:</p>
                  <div className="flex flex-wrap gap-2">
                    {freeColors.map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => {
                          update({ chips: [...draft.chips, { color, value: 1, quantity: 0 }] })
                          setAdding(false)
                        }}
                        className="flex flex-col items-center gap-1"
                      >
                        <Chip color={color} value={0} size="md" />
                        <span className="text-[11px]">{CHIP_COLORS[color].name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                freeColors.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setAdding(true)}
                    className="flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-surface-high font-display font-semibold text-gold"
                  >
                    <Plus size={18} /> Adicionar tipo de ficha
                  </button>
                )
              )}
            </div>

            <div className="mt-3 rounded-lg bg-surface-lowest p-3">
              <p className="flex justify-between font-display">
                <span>Total por jogador:</span>
                <b className="text-gold">
                  {formatChips(total)} fichas ({formatChips(toBigBlinds(total, draft.bigBlind))} BB)
                </b>
              </p>
              <p
                className={`mt-2 flex items-center gap-2 rounded px-2 py-1.5 text-sm ${
                  difference === 0 ? 'bg-success/15 text-success' : 'bg-gold/10 text-gold'
                }`}
              >
                {difference === 0 ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
                {difference === 0
                  ? 'Confere com o stack inicial'
                  : difference > 0
                    ? `Faltam ${formatChips(difference)} para o stack inicial`
                    : `Passa ${formatChips(-difference)} do stack inicial`}
              </p>
            </div>
          </Card>

          <Card icon={<ShieldCheck size={20} />} title="Privacidade">
            <p className="mb-2 text-sm text-secondary">Como o botão de olho mostra suas cartas e probabilidades escondidas:</p>
            <div className="space-y-2" role="radiogroup" aria-label="Modo de privacidade">
              {REVEAL_MODES.map(({ mode, icon, title, description }) => {
                const selected = draftPreferences.revealMode === mode
                return (
                  <button
                    key={mode}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    onClick={() => setDraftPreferences({ ...draftPreferences, revealMode: mode })}
                    className={`flex w-full items-start gap-3 rounded-lg p-3 text-left transition ${
                      selected ? 'bg-gold/10 ring-2 ring-gold' : 'bg-surface-lowest ring-1 ring-surface-highest'
                    }`}
                  >
                    <span className={`mt-0.5 ${selected ? 'text-gold' : 'text-secondary'}`}>{icon}</span>
                    <span className="flex-1">
                      <span className="block font-display font-semibold">{title}</span>
                      <span className="block text-xs text-secondary">{description}</span>
                    </span>
                    <span
                      className={`mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${selected ? 'border-gold' : 'border-outline'}`}
                    >
                      {selected && <span className="h-2.5 w-2.5 rounded-full bg-gold" />}
                    </span>
                  </button>
                )
              })}
            </div>
          </Card>

          <button
            type="button"
            onClick={() => onSave(draft, draftPreferences)}
            disabled={draft.bigBlind <= 0 || draft.chips.length === 0}
            className="flex h-14 w-full items-center justify-center gap-2 rounded-xl bg-gold font-display text-lg font-bold text-on-gold shadow-[0_0_16px_rgba(245,197,66,0.35)] active:scale-[0.98] disabled:opacity-40"
          >
            <CheckCircle2 size={22} /> Salvar configuração
          </button>
          <button
            type="button"
            onClick={() => {
              setDraft(DEFAULT_CONFIG)
              setDraftPreferences(DEFAULT_PREFERENCES)
            }}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-surface-container font-display font-semibold text-secondary"
          >
            <RotateCcw size={18} /> Restaurar padrão
          </button>
        </div>
      </div>
    </div>
  )
}

const REVEAL_MODES: { mode: RevealMode; icon: ReactNode; title: string; description: string }[] = [
  {
    mode: 'toggle',
    icon: <Eye size={22} />,
    title: 'Tocar para mostrar/esconder',
    description: 'Um toque esconde, outro mostra. Esconde sozinho quando a tela apaga.',
  },
  {
    mode: 'hold',
    icon: <Hand size={22} />,
    title: 'Segurar para espiar',
    description: 'Fica sempre escondido e só aparece enquanto você segura o olho. Ao soltar, esconde de novo.',
  },
]

function Card({ icon, title, aside, children }: { icon: ReactNode; title: string; aside?: ReactNode; children: ReactNode }) {
  return (
    <section className="rounded-xl border-t border-white/8 bg-surface-container p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="flex items-center gap-2 font-display text-lg font-semibold">
          <span className="text-gold">{icon}</span>
          {title}
        </h2>
        {aside}
      </div>
      {children}
    </section>
  )
}

const Pill = ({ children }: { children: ReactNode }) => (
  <span className="rounded-full bg-success/15 px-2.5 py-0.5 font-display text-xs font-bold text-success">{children}</span>
)

function BlindInput({ label, suffix, value, onChange }: { label: string; suffix: string; value: number; onChange: (value: number) => void }) {
  return (
    <label className="recessed block rounded-lg bg-surface-lowest px-3 py-2">
      <span className="font-display text-[11px] font-semibold tracking-wider text-secondary uppercase">{label}</span>
      <span className="flex items-baseline justify-between">
        <input
          inputMode="numeric"
          value={value || ''}
          placeholder="0"
          onChange={(event) => onChange(parseAmount(event.target.value))}
          className="w-full min-w-0 bg-transparent font-display text-2xl font-bold tabular-nums outline-none"
        />
        <span className="text-xs text-secondary">{suffix}</span>
      </span>
    </label>
  )
}

function StepButton({ children, onClick, label }: { children: ReactNode; onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex h-10 w-9 items-center justify-center rounded bg-surface-high font-display text-lg active:scale-90"
      aria-label={label}
    >
      {children}
    </button>
  )
}
