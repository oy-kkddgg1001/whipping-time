import '@testing-library/jest-dom/vitest'
import 'vitest-axe/extend-expect'
import { server } from '../mocks/server'

// Start MSW server before all tests
beforeAll(() => server.listen({ onUnhandledRequest: 'warn' }))

// Reset handlers after each test to avoid state leakage
afterEach(() => server.resetHandlers())

// Close MSW server after all tests
afterAll(() => server.close())
