# MiniReact Test Suite

## Overview
Comprehensive test suite for MiniReact framework covering unit and integration tests.

## Structure

```
tests/
├── unit/              # Unit tests for individual modules
│   ├── vdom/         # Virtual DOM tests
│   ├── core/         # Core functionality tests  
│   ├── hooks/        # React hooks tests
│   └── component.js  # Class component tests
├── integration/       # Integration tests
│   ├── rendering.js  # Rendering scenarios
│   └── events.js     # Event handling
├── testUtils.js      # Testing utilities
└── setup.js          # Jest setup
```

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run with coverage report
npm run test:coverage

# Run specific test file
npm test -- tests/unit/vdom/createElement.test.js
```

## Test Coverage Goals

- Line coverage: >90%
- Branch coverage: >85%  
- Function coverage: >95%
- Critical paths: 100%

## Test Categories

### Unit Tests

#### Virtual DOM (`vdom/`)
- **createElement.test.js**: Element creation, props, children handling
- **updateDom.test.js**: DOM updates, property changes, event handling

#### Core (`core/`)
- **fiber.test.js**: Fiber architecture, work loop, scheduling
- **reconciler.test.js**: Child reconciliation, keyed lists
- **commit.test.js**: DOM mutations, effect execution

#### Hooks (`hooks/`)
- **useState.test.js**: State management, updates, batching
- **useEffect.test.js**: Effects, cleanup, dependencies
- **useReducer.test.js**: Reducer pattern, dispatch
- **useMemo.test.js**: Memoization, dependency tracking
- **useCallback.test.js**: Callback memoization

#### Components
- **component.test.js**: Class components, lifecycle, setState

### Integration Tests

- **rendering.test.js**: Complete rendering scenarios, lists, fragments
- **events.test.js**: Event handling, forms, user interactions

## Testing Utilities

The `testUtils.js` file provides helpers:
- `createContainer()`: Create test DOM container
- `act()`: Flush updates and effects
- `fireEvent()`: Simulate DOM events
- `getByText()`: Query elements by text content
- `waitFor()`: Wait for async updates

## Known Issues

Some tests may timeout due to the async nature of the fiber architecture. These can be addressed by:
1. Increasing timeout values
2. Properly mocking requestIdleCallback
3. Using act() to flush updates

## Future Improvements

1. Add performance benchmarks
2. Implement snapshot testing for component output
3. Add accessibility testing
4. Create visual regression tests
5. Add error boundary testing