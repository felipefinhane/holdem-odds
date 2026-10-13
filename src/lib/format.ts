const percent = new Intl.NumberFormat('pt-BR', { style: 'percent', maximumFractionDigits: 1, minimumFractionDigits: 1 })
const number = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 })

export const formatPercent = (value: number) => percent.format(value)
export const formatChips = (value: number) => number.format(value)
export const formatSignedChips = (value: number) => (value > 0 ? '+' : value < 0 ? '−' : '') + number.format(Math.abs(value))
