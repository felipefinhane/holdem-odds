export type PotOddsResult = {
  finalPot: number
  // Chance mínima de vencer para o call empatar no longo prazo.
  required: number
  // Lucro médio do call, em fichas (positivo = call lucrativo).
  expectedValue: number
  // Maior aposta que ainda valeria pagar com essa equity (Infinity = qualquer valor).
  maxCall: number
  verdict: 'call' | 'fold'
}

// pot = pote antes da aposta do adversário; bet = valor que você precisa pagar.
export function potOdds(pot: number, bet: number, equity: number): PotOddsResult | null {
  if (!(pot >= 0) || !(bet > 0)) return null

  const finalPot = pot + bet + bet
  const required = bet / finalPot
  const expectedValue = equity * (pot + bet) - (1 - equity) * bet
  const maxCall = equity >= 0.5 ? Infinity : (equity * pot) / (1 - 2 * equity)

  return {
    finalPot,
    required,
    expectedValue,
    maxCall,
    verdict: equity >= required ? 'call' : 'fold',
  }
}
