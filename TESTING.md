# SwarmVille Testing Guide

## Overview

SwarmVille uses a comprehensive testing strategy with Vitest for unit and integration tests, Testing Library for React component testing, and ESLint for code quality checks.

## Testing Stack

- **Vitest**: Unit and integration test runner
- **@testing-library/react**: React component testing
- **@testing-library/jest-dom**: DOM assertions
- **jsdom**: DOM simulation for tests
- **TypeScript**: Type-safe test code

## Test Structure

```
src/
├── __tests__/
│   ├── setup.ts                 # Test environment setup
│   ├── lib/
│   │   ├── pathfinding.test.ts  # A* algorithm tests
│   │   └── cli.test.ts          # CLI integration tests
│   ├── stores/
│   │   └── spaceStore.test.ts   # Zustand store tests
│   ├── hooks/
│   │   └── usePixiApp.test.tsx  # React hook tests
│   ├── components/
│   │   └── AgentSpawner.test.tsx # Component tests
│   └── integration/
│       └── space-workflow.test.ts # E2E workflow tests
└── [source files...]
```

## Running Tests

### Run all tests once
```bash
npm test
```

### Watch mode (re-run on file changes)
```bash
npm run test:watch
```

### UI Dashboard
```bash
npm run test:ui
```

### Coverage Report
```bash
npm run test:coverage
```

### Full Quality Check (types + lint + tests)
```bash
npm run test:all
```

## Test Categories

### 1. Unit Tests

Test individual functions and modules in isolation.

**Location**: `src/__tests__/lib/` and `src/__tests__/stores/`

**Examples**:
- **pathfinding.test.ts**: Tests A* algorithm
  - Path finding from start to goal
  - Obstacle avoidance
  - Unreachable goals
  - Large distances

- **cli.test.ts**: Tests CLI integration
  - Model type mapping
  - CLI detection
  - Provider validation

- **spaceStore.test.ts**: Tests Zustand state management
  - Space creation and deletion
  - Agent management
  - Position updates
  - State transitions

### 2. Hook Tests

Test React hooks in isolation using React Testing Library.

**Location**: `src/__tests__/hooks/`

**Examples**:
- **usePixiApp.test.tsx**: Tests Pixi.js app initialization
  - App creation
  - Viewport initialization
  - Canvas management
  - Cleanup on unmount

### 3. Component Tests

Test React components with their dependencies mocked or rendered.

**Location**: `src/__tests__/components/`

**Examples**:
- **AgentSpawner.test.tsx**: Tests agent spawning UI
  - Dialog rendering
  - User input handling
  - Callback execution
  - Dialog visibility

### 4. Integration Tests

Test workflows combining multiple modules.

**Location**: `src/__tests__/integration/`

**Examples**:
- **space-workflow.test.ts**: Tests complete user workflows
  - Create space → Add agents → Move → Interact
  - Multiple spaces management
  - Data consistency
  - State propagation

## Writing Tests

### Basic Test Structure

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest'

describe('Feature Name', () => {
  beforeEach(() => {
    // Setup before each test
  })

  afterEach(() => {
    // Cleanup after each test
  })

  it('should do something', () => {
    // Arrange
    const input = 'test'

    // Act
    const result = doSomething(input)

    // Assert
    expect(result).toBe('expected')
  })
})
```

### Testing React Components

```typescript
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

it('should handle user interaction', async () => {
  const user = userEvent.setup()
  render(<MyComponent />)

  const button = screen.getByRole('button')
  await user.click(button)

  expect(screen.getByText('Clicked')).toBeInTheDocument()
})
```

### Testing Hooks

```typescript
import { renderHook, act } from '@testing-library/react'

it('should update state', () => {
  const { result } = renderHook(() => useMyHook())

  act(() => {
    result.current.setValue('new')
  })

  expect(result.current.value).toBe('new')
})
```

### Testing Zustand Stores

```typescript
import { renderHook, act } from '@testing-library/react'
import { useMyStore } from '@/stores'

beforeEach(() => {
  useMyStore.setState({ /* reset state */ })
})

it('should update store', () => {
  const { result } = renderHook(() => useMyStore())

  act(() => {
    result.current.updateValue('new')
  })

  expect(result.current.value).toBe('new')
})
```

## Test Coverage Goals

| Category | Target | Current |
|----------|--------|---------|
| Statements | 80% | TBD |
| Branches | 75% | TBD |
| Functions | 80% | TBD |
| Lines | 80% | TBD |

## CI/CD Integration

Tests run automatically in GitHub Actions on:
- **Push to main**: Full test suite
- **Pull requests**: Full test suite + coverage check
- **Scheduled**: Daily test run

See `.github/workflows/` for CI configuration.

## Best Practices

### ✅ DO

- Write tests as you write code
- Test behavior, not implementation
- Use descriptive test names
- Keep tests focused and isolated
- Mock external dependencies
- Use Testing Library queries (getByRole > getByTestId > getByText)
- Reset state between tests
- Test edge cases and error conditions

### ❌ DON'T

- Test implementation details
- Write overly complex tests
- Skip tests because they're "too hard"
- Mock everything (test real behavior)
- Use hardcoded values extensively
- Forget to clean up after tests
- Write tests after the fact (usually)

## Common Testing Patterns

### Testing Async Operations

```typescript
it('should handle async operation', async () => {
  const { result } = renderHook(() => useAsync())

  await act(async () => {
    await result.current.fetch()
  })

  expect(result.current.data).toBeDefined()
})
```

### Testing Error Cases

```typescript
it('should handle errors', () => {
  const fn = () => {
    throw new Error('Test error')
  }

  expect(fn).toThrow('Test error')
})
```

### Testing Multiple Scenarios

```typescript
describe.each([
  ['input1', 'output1'],
  ['input2', 'output2'],
])('with %s', (input, output) => {
  it('should work', () => {
    expect(transform(input)).toBe(output)
  })
})
```

## Debugging Tests

### Run specific test file
```bash
npm test -- pathfinding.test.ts
```

### Run specific test
```bash
npm test -- -t "should find path"
```

### Debug in browser (UI mode)
```bash
npm run test:ui
```

### Watch mode with filtering
```bash
npm run test:watch -- pathfinding
```

## Performance Testing

For performance-critical code (e.g., pathfinding, rendering):

```typescript
it('should perform efficiently', () => {
  const start = performance.now()
  const result = expensiveOperation()
  const duration = performance.now() - start

  expect(duration).toBeLessThan(100) // ms
})
```

## Known Limitations

1. **Tauri Integration**: Full Tauri command testing requires mocking
2. **Pixi.js**: Canvas rendering tested indirectly via app initialization
3. **Audio**: STT testing requires mocking Web Audio API
4. **WebGL**: Some Pixi.js features may not fully test in jsdom

## Future Testing Improvements

- [ ] E2E tests with Playwright
- [ ] Visual regression testing
- [ ] Performance benchmarking suite
- [ ] Load testing for agent swarms
- [ ] Accessibility testing with jest-axe
- [ ] Network mocking for API testing

## Troubleshooting

### "Cannot find module" errors
- Ensure TypeScript paths are configured in `tsconfig.json`
- Check test file imports use correct relative paths

### "window.matchMedia is not a function"
- Already mocked in `setup.ts`, check import order

### Tests timing out
- Increase timeout: `it('test', { timeout: 10000 }, () => {})`
- Check for unresolved promises or infinite loops

### State not updating in tests
- Use `act()` wrapper for state changes
- Ensure `beforeEach` resets state properly

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [Testing Library](https://testing-library.com/)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)

## Contributing

When contributing code:

1. Write tests alongside your code
2. Ensure all tests pass: `npm run test:all`
3. Maintain or improve test coverage
4. Include integration tests for new workflows
5. Document complex test scenarios

---

**Last Updated**: Phase 6 - Automated Testing Suite
**Maintained By**: SwarmVille Team
