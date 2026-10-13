# Holdem Odds

Calculadora de probabilidades de **Texas Hold'em** feita para usar no celular, durante o jogo.

Você escolhe as suas cartas e as da mesa, e o app mostra:

- **Chance de vencer** (equity) contra 1 a 8 adversários, com a divisão entre vitória, empate e derrota
- **Pot odds**: com o pote e a aposta, diz se é **CALL** ou **FOLD**, o lucro médio do call e até quanto vale pagar
- **Outs**: as cartas que melhoram sua mão, agrupadas por jogada, com a regra do 2 e do 4 lado a lado com a conta exata
- **Chance de terminar com** cada tipo de mão (par, trinca, flush…) até o river
- O passo a passo de cada conta, para aprender enquanto joga

## Como os cálculos funcionam

| O quê | Como |
|---|---|
| Equity | Simulação de Monte Carlo: 40.000 mãos completando a mesa e dando cartas aleatórias aos adversários (margem de erro ≈ 0,5%). Roda num Web Worker para não travar a tela. |
| Outs | Cada carta restante é testada: é out se aumenta a vantagem da sua mão sobre a mesa. Se a mesa formar par, isso não conta, e par abaixo da carta mais alta da mesa também não. |
| Chance exata dos outs | `1 − (não-outs / desconhecidas) × (não-outs − 1) / (desconhecidas − 1)` no flop; `outs / 46` no turn. |
| Pot odds | Chance mínima = `aposta ÷ (pote + aposta + seu call)`. Lucro médio = `equity × (pote + aposta) − (1 − equity) × aposta`. |

> Os adversários recebem mãos **aleatórias**. Na prática, quem continua apostando costuma ter uma mão acima da média, então leia a equity como um teto.

## Stack

- [Vite](https://vite.dev) + React 19 + TypeScript
- Tailwind CSS v4
- Vitest
- 100% client-side, sem backend

## Rodando localmente

```bash
pnpm install
pnpm dev        # http://localhost:5173
pnpm test       # testes do motor de cálculo
pnpm build      # build de produção em dist/
pnpm lint
```

## Estrutura

```
src/
├── lib/                 # motor de cálculo (TypeScript puro, sem React)
│   ├── cards.ts         # representação das cartas (0–51) e baralho
│   ├── evaluate.ts      # avaliador de mãos de 5 a 7 cartas
│   ├── equity.ts        # simulação de Monte Carlo
│   ├── outs.ts          # contagem de outs e regra do 2/4
│   ├── potOdds.ts       # pot odds, EV e call máximo
│   ├── equity.worker.ts # roda a simulação fora da thread principal
│   ├── useEquity.ts     # hook React que conversa com o worker
│   └── poker.test.ts
├── components/          # cartas, seletor de cartas e painéis de resultado
└── App.tsx
```

## Deploy

O deploy é feito na [Vercel](https://vercel.com), que detecta o Vite sozinha. Cada push na `main` publica uma nova versão.
