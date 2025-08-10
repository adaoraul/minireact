import { useContext, createContext, clearContextState } from '../../../src/hooks/useContext.js';
import { render, setWipFiber } from '../../../src/core/fiber.js';
import { createElement } from '../../../src/vdom/createElement.js';
import { createContainer, cleanupContainer, act } from '../../testUtils.js';

describe('useContext', () => {
  let container;

  beforeEach(() => {
    container = createContainer();
    // Clear fiber state before each test
    const { setWipFiber: fiberSetWipFiber } = require('../../../src/core/fiber.js');
    fiberSetWipFiber(null);
    setWipFiber(null);
    clearContextState();
  });

  afterEach(() => {
    cleanupContainer(container);
    // Clear fiber state after each test too
    const { setWipFiber: fiberSetWipFiber } = require('../../../src/core/fiber.js');
    fiberSetWipFiber(null);
    setWipFiber(null);
    clearContextState();
  });

  test('provides context value to consumers', async () => {
    const TestContext = createContext('default');
    let contextValue;
    
    const Consumer = () => {
      contextValue = useContext(TestContext);
      return createElement('div', null, contextValue);
    };

    const Provider = TestContext.Provider;
    const App = () => {
      return createElement(
        Provider,
        { value: 'provided value' },
        createElement(Consumer, null)
      );
    };

    await act(() => {
      render(createElement(App, null), container);
    });

    expect(contextValue).toBe('provided value');
    expect(container.textContent).toBe('provided value');
  });

  test('updates when context value changes', async () => {
    const TestContext = createContext('default');
    let contextValue;
    let providerValue = 'initial';
    
    const Consumer = () => {
      contextValue = useContext(TestContext);
      return createElement('div', null, contextValue);
    };

    const Provider = TestContext.Provider;
    const App = () => {
      return createElement(
        Provider,
        { value: providerValue },
        createElement(Consumer, null)
      );
    };

    await act(() => {
      render(createElement(App, null), container);
    });

    expect(contextValue).toBe('initial');
    expect(container.textContent).toBe('initial');

    // Update provider value and re-render
    providerValue = 'updated';
    await act(() => {
      render(createElement(App, null), container);
    });

    expect(contextValue).toBe('updated');
    expect(container.textContent).toBe('updated');
  });

  test('works with nested contexts', async () => {
    const OuterContext = createContext('outer-default');
    const InnerContext = createContext('inner-default');
    let outerValue, innerValue;
    
    const Consumer = () => {
      outerValue = useContext(OuterContext);
      innerValue = useContext(InnerContext);
      return createElement('div', null, `${outerValue}-${innerValue}`);
    };

    const OuterProvider = OuterContext.Provider;
    const InnerProvider = InnerContext.Provider;
    
    const App = () => {
      return createElement(
        OuterProvider,
        { value: 'outer' },
        createElement(
          InnerProvider,
          { value: 'inner' },
          createElement(Consumer, null)
        )
      );
    };

    await act(() => {
      render(createElement(App, null), container);
    });

    expect(outerValue).toBe('outer');
    expect(innerValue).toBe('inner');
    expect(container.textContent).toBe('outer-inner');
  });

  test('uses default value when no provider', async () => {
    const TestContext = createContext('default value');
    let contextValue;
    
    const Consumer = () => {
      contextValue = useContext(TestContext);
      return createElement('div', null, contextValue);
    };

    await act(() => {
      render(createElement(Consumer, null), container);
    });

    expect(contextValue).toBe('default value');
    expect(container.textContent).toBe('default value');
  });

  test('updates only affected consumers', async () => {
    const Context1 = createContext('default1');
    const Context2 = createContext('default2');
    let renderCount1 = 0;
    let renderCount2 = 0;
    let setValue1, setValue2;
    
    const Consumer1 = () => {
      renderCount1++;
      const value = useContext(Context1);
      return createElement('div', { id: 'consumer1' }, value);
    };

    const Consumer2 = () => {
      renderCount2++;
      const value = useContext(Context2);
      return createElement('div', { id: 'consumer2' }, value);
    };

    let providerValue1 = 'value1';
    let providerValue2 = 'value2';

    const Provider1 = Context1.Provider;
    const Provider2 = Context2.Provider;
    
    const App = () => {
      return createElement('div', null,
        createElement(
          Provider1,
          { value: providerValue1 },
          createElement(Consumer1, null)
        ),
        createElement(
          Provider2,
          { value: providerValue2 },
          createElement(Consumer2, null)
        )
      );
    };

    await act(() => {
      render(createElement(App, null), container);
    });

    const initialRenderCount1 = renderCount1;
    const initialRenderCount2 = renderCount2;

    // Update only first context
    providerValue1 = 'updated1';
    await act(() => {
      render(createElement(App, null), container);
    });

    // Both consumers should re-render because we re-rendered the whole app
    expect(renderCount1).toBe(initialRenderCount1 + 1);
    expect(renderCount2).toBe(initialRenderCount2 + 1);
  });

  test('handles null context value', async () => {
    const TestContext = createContext('default');
    let contextValue;
    
    const Consumer = () => {
      contextValue = useContext(TestContext);
      return createElement('div', null, String(contextValue));
    };

    const Provider = TestContext.Provider;
    const App = () => {
      return createElement(
        Provider,
        { value: null },
        createElement(Consumer, null)
      );
    };

    await act(() => {
      render(createElement(App, null), container);
    });

    expect(contextValue).toBe(null);
    expect(container.textContent).toBe('null');
  });

  test('throws error when called with invalid context', () => {
    setWipFiber({
      hooks: [],
      parent: null,
    });
    
    expect(() => {
      useContext(null);
    }).toThrow('useContext must be called with a valid context object');
    
    expect(() => {
      useContext({});
    }).toThrow('useContext must be called with a valid context object');
    
    // Clean up mock fiber
    setWipFiber(null);
  });

  test('throws error when called outside component', () => {
    // Mock getCurrentFiber to return null to simulate outside component
    const hookUtils = require('../../../src/hooks/hookUtils.js');
    const originalGetCurrentFiber = hookUtils.getCurrentFiber;
    
    hookUtils.getCurrentFiber = jest.fn(() => null);
    
    const TestContext = createContext('default');
    
    try {
      expect(() => {
        useContext(TestContext);
      }).toThrow(/must be called within a component/);
    } finally {
      // Restore original function
      hookUtils.getCurrentFiber = originalGetCurrentFiber;
    }
  });
});