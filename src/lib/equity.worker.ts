import { type EquityRequest, simulateEquity } from './equity'

self.onmessage = (event: MessageEvent<EquityRequest & { key: string }>) => {
  const { key, ...request } = event.data
  self.postMessage({ key, result: simulateEquity(request) })
}
