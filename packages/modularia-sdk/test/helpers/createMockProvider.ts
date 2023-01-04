import { Provider } from '@ethersproject/abstract-provider'

export function createMockProvider(): Provider {
  // Just mock the functions that we need
  const provider: Partial<Provider> = {}

  return provider as Provider
}
