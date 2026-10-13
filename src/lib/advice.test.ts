import { describe, expect, it } from 'vitest'
import { advise, classifyStrength, planAction } from './advice'
import { DEFAULT_CONFIG } from './table'

const base = { opponents: 1, boardSize: 3, pot: 100, bet: 0, outs: 0 }

describe('classifyStrength', () => {
  it('a parte justa cai com mais adversários', () => {
    expect(classifyStrength(0.5, 1).fairShare).toBe(0.5)
    expect(classifyStrength(0.25, 3).fairShare).toBe(0.25)
  })

  it('a mesma equity é forte contra muitos adversários e fraca contra um', () => {
    expect(classifyStrength(0.5, 1).strength).toBe('weak')
    expect(classifyStrength(0.5, 4).strength).toBe('strong')
  })
})

describe('advise sem aposta para pagar', () => {
  it('mão forte: aposta ⅔ do pote', () => {
    const advice = advise({ ...base, equity: 0.8 })
    expect(advice.action).toBe('bet')
    expect(advice.sizing?.amount).toBe(67)
  })

  it('draw forte contra um adversário: semi-blefe de ½ pote', () => {
    const advice = advise({ ...base, equity: 0.45, outs: 9 })
    expect(advice.action).toBe('bet')
    expect(advice.sizing?.amount).toBe(50)
  })

  it('não faz semi-blefe no river nem contra muitos adversários', () => {
    expect(advise({ ...base, equity: 0.3, outs: 9, boardSize: 5 }).action).toBe('check')
    expect(advise({ ...base, equity: 0.2, outs: 9, opponents: 4 }).action).toBe('check')
  })

  it('mão média ou fraca: check', () => {
    expect(advise({ ...base, equity: 0.58 }).action).toBe('check')
    expect(advise({ ...base, equity: 0.3 }).action).toBe('check')
  })

  it('sem pote informado, sugere o tamanho só em fração', () => {
    expect(advise({ ...base, equity: 0.8, pot: 0 }).sizing).toEqual({ label: '⅔ do pote', amount: null })
  })
})

describe('advise com aposta para pagar', () => {
  it('preço ruim: fold (exemplo da nota)', () => {
    const advice = advise({ ...base, boardSize: 4, equity: 0.196, bet: 50, outs: 9 })
    expect(advice.action).toBe('fold')
    expect(advice.continueHand).toBe(false)
  })

  it('fold por pouco com draw avisa sobre implied odds', () => {
    expect(advise({ ...base, equity: 0.22, bet: 50, outs: 9 }).note).toMatch(/implied odds/)
    expect(advise({ ...base, equity: 0.1, bet: 50, outs: 9 }).note).toBeNull()
  })

  it('preço bom com mão comum: call', () => {
    expect(advise({ ...base, boardSize: 4, equity: 0.196, bet: 20, outs: 9 }).action).toBe('call')
  })

  it('JJ pré-flop pagando 1 BB não é fold, mesmo contra muitos adversários', () => {
    // Equities simuladas do JJ contra 1, 3, 5 e 8 mãos aleatórias.
    for (const [opponents, equity] of [[1, 0.774], [3, 0.488], [5, 0.338], [8, 0.214]]) {
      expect(advise({ ...base, boardSize: 0, opponents, equity, pot: 15, bet: 10 }).continueHand).toBe(true)
    }
  })

  it('favorito com preço bom: aumenta para 3× a aposta', () => {
    const advice = advise({ ...base, equity: 0.85, bet: 30 })
    expect(advice.action).toBe('raise')
    expect(advice.sizing?.amount).toBe(90)
  })
})

describe('planAction', () => {
  it('aposta sugerida vira fichas reais', () => {
    const plan = planAction(advise({ ...base, equity: 0.8 }), 0, 1000, DEFAULT_CONFIG)
    expect(plan).toMatchObject({ amount: 67, bigBlinds: 6.7, allIn: false })
  })

  it('aumento maior que o stack vira all-in', () => {
    const plan = planAction(advise({ ...base, equity: 0.85, bet: 200 }), 200, 340, DEFAULT_CONFIG)
    expect(plan).toMatchObject({ amount: 340, allIn: true })
  })

  it('call usa o valor da aposta', () => {
    const plan = planAction(advise({ ...base, boardSize: 4, equity: 0.196, bet: 20, outs: 9 }), 20, 1000, DEFAULT_CONFIG)
    expect(plan?.amount).toBe(20)
  })

  it('fold e check não colocam fichas', () => {
    expect(planAction(advise({ ...base, equity: 0.3 }), 0, 1000, DEFAULT_CONFIG)).toBeNull()
  })
})
