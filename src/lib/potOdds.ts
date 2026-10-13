export type PotOddsResult = {
  finalPot: number
  // Fichas que entram no pote vindas dos adversários (a aposta de cada um).
  opponentsMoney: number
  // Chance mínima de vencer para o call empatar no longo prazo.
  required: number
  // Lucro médio do call, em fichas (positivo = call lucrativo).
  expectedValue: number
  // Maior aposta que ainda valeria pagar com essa equity (Infinity = qualquer valor).
  maxCall: number
  verdict: 'call' | 'fold'
}

// pot = pote antes da aposta; bet = valor que você precisa pagar.
// A equity é simulada com todos os adversários indo até o fim, então a conta considera que cada um
// deles também coloca a aposta no pote. Com 1 adversário é o pot odds clássico.
export function potOdds(pot: number, bet: number, equity: number, opponents = 1): PotOddsResult | null {
  if (!(pot >= 0) || !(bet > 0) || opponents < 1) return null

  const opponentsMoney = bet * opponents
  const finalPot = pot + opponentsMoney + bet
  const required = bet / finalPot
  const expectedValue = equity * (pot + opponentsMoney) - (1 - equity) * bet
  // EV = 0 quando equity × (pote + aposta × adversários) = (1 − equity) × aposta.
  const margin = 1 - equity - equity * opponents
  const maxCall = margin <= 0 ? Infinity : (equity * pot) / margin

  return {
    finalPot,
    opponentsMoney,
    required,
    expectedValue,
    maxCall,
    verdict: equity >= required ? 'call' : 'fold',
  }
}
