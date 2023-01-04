import { initModularia } from '../src'
import { createMockProvider } from './helpers/createMockProvider'

test('it works', () => {
  // Arrange
  const provider = createMockProvider()

  // Act
  const modularia = initModularia(provider)

  // Assert
  // expect(modularia).toBeDefined()
})
