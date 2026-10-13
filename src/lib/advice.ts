import { formatPercent } from './format'
import { potOdds } from './potOdds'

export type Action = 'fold' | 'check' | 'call' | 'bet' | 'raise'
export type Strength = 'strong' | 'medium' | 'weak'

export type AdviceInput = {
  equity: number
  opponents: number
  // Cartas na mesa: 0 (pré-flop), 3 (flop), 4 (turn) ou 5 (river).
  boardSize: number
  pot: number
  // Valor a pagar; 0 quando ninguém apostou.
  bet: number
  outs: number
}

export type Advice = {
  action: Action
  title: string
  continueHand: boolean
  strength: Strength
  // Parte justa do pote: o que cada jogador ganharia se todos fossem iguais.
  fairShare: number
  reason: string
  sizing: { label: string; amount: number | null } | null
  note: string | null
}

const TITLES: Record<Action, string> = {
  fold: 'FOLD',
  check: 'CHECK',
  call: 'PAGUE',
  bet: 'APOSTE',
  raise: 'AUMENTE',
}

// Forte: bem acima da parte justa (35% do caminho até 100%). Média: um pouco acima (10%).
export function classifyStrength(equity: number, opponents: number) {
  const fairShare = 1 / (opponents + 1)
  const strength: Strength =
    equity >= fairShare + 0.35 * (1 - fairShare) ? 'strong' : equity >= fairShare + 0.1 * (1 - fairShare) ? 'medium' : 'weak'
  return { fairShare, strength }
}

// Um draw de 8+ outs com no máximo 2 adversários pode apostar como semi-blefe: ganha se todos desistirem ou se completar.
const canSemiBluff = ({ outs, boardSize, opponents }: AdviceInput) => outs >= 8 && boardSize >= 3 && boardSize < 5 && opponents <= 2

const potFraction = (pot: number, fraction: number) => (pot > 0 ? Math.round(pot * fraction) : null)

export function advise(input: AdviceInput): Advice {
  const { equity, opponents, pot, bet, boardSize } = input
  const { fairShare, strength } = classifyStrength(equity, opponents)
  const make = (action: Action, rest: Pick<Advice, 'reason'> & Partial<Pick<Advice, 'sizing' | 'note'>>): Advice => ({
    action,
    title: TITLES[action],
    continueHand: action !== 'fold',
    strength,
    fairShare,
    sizing: null,
    note: null,
    ...rest,
  })

  if (!(bet > 0)) {
    if (strength === 'strong')
      return make('bet', {
        reason: 'Sua mão está bem acima da média da mesa. Aposte para cobrar de quem tem mão pior.',
        sizing: { label: '⅔ do pote', amount: potFraction(pot, 2 / 3) },
      })
    if (canSemiBluff(input))
      return make('bet', {
        reason: `Semi-blefe: com ${input.outs} outs, você ganha se todos desistirem ou se completar a mão depois.`,
        sizing: { label: '½ do pote', amount: potFraction(pot, 1 / 2) },
        note: 'Se aumentarem muito, reavalie com o valor que precisar pagar.',
      })
    if (strength === 'medium')
      return make('check', {
        reason: 'Mão razoável, mas não forte o bastante para apostar. Veja a próxima carta de graça.',
        note: 'Se apostarem, informe o valor da aposta para ver se vale pagar.',
      })
    return make('check', {
      reason: 'Mão fraca. Passe e veja a próxima carta sem gastar fichas.',
      note: 'Se apostarem, o mais provável é desistir.',
    })
  }

  const odds = potOdds(pot, bet, equity)!
  if (odds.verdict === 'fold') {
    const close = odds.required - equity < 0.05 && boardSize >= 3 && boardSize < 5 && input.outs >= 8
    return make('fold', {
      reason: `Você precisa vencer ${formatPercent(odds.required)} das vezes para o call compensar e tem ${formatPercent(equity)}.`,
      note: close ? 'Está perto: se o adversário costuma pagar quando você completa o draw (implied odds), um call é aceitável.' : null,
    })
  }

  if (strength === 'strong')
    return make('raise', {
      reason: 'Você é favorito na mão. Aumente para colocar mais fichas no pote enquanto está na frente.',
      sizing: { label: '3× a aposta', amount: Math.round(bet * 3) },
      note: 'Se não quiser arriscar mais, pagar também é lucrativo.',
    })

  return make('call', {
    reason: `O preço compensa: você precisa de ${formatPercent(odds.required)} e tem ${formatPercent(equity)}.`,
    note: strength === 'weak' ? 'Sua mão ainda não é forte. Se vier outra aposta grande, refaça a conta.' : null,
  })
}
