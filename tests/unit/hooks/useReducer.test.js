import { useReducer } from '../../../src/hooks/useReducer.js';
import { render, setWipFiber } from '../../../src/core/fiber.js';
import { createElement } from '../../../src/vdom/createElement.js';
import { createContainer, cleanupContainer, act } from '../../testUtils.js';

describe('useReducer', () => {
  let container;

  beforeEach(() => {
    container = createContainer();
  });

  afterEach(() => {
    cleanupContainer(container);
    // Reset fiber state for next test
    setWipFiber(null);
  });

  test('returns initial state and dispatch', async () => {
    const reducer = (state, action) => {
      switch (action.type) {
        case 'increment':
          return state + 1;
        case 'decrement':
          return state - 1;
        default:
          return state;
      }
    };

    let stateValue, dispatchFunc;

    const Component = () => {
      const [state, dispatch] = useReducer(reducer, 0);
      stateValue = state;
      dispatchFunc = dispatch;
      return createElement('div', null, `Count: ${state}`);
    };

    await act(() => {
      render(createElement(Component, null), container);
    });

    expect(stateValue).toBe(0);
    expect(typeof dispatchFunc).toBe('function');
    expect(container.textContent).toBe('Count: 0');
  });

  test('updates state through dispatch', async () => {
    const reducer = (state, action) => {
      switch (action.type) {
        case 'increment':
          return state + action.payload;
        case 'decrement':
          return state - action.payload;
        case 'reset':
          return 0;
        default:
          return state;
      }
    };

    let dispatchFunc;

    const Component = () => {
      const [state, dispatch] = useReducer(reducer, 10);
      dispatchFunc = dispatch;
      return createElement('div', null, `Value: ${state}`);
    };

    await act(() => {
      render(createElement(Component, null), container);
    });

    expect(container.textContent).toBe('Value: 10');

    await act(() => {
      dispatchFunc({ type: 'increment', payload: 5 });
    });

    expect(container.textContent).toBe('Value: 15');

    await act(() => {
      dispatchFunc({ type: 'decrement', payload: 3 });
    });

    expect(container.textContent).toBe('Value: 12');

    await act(() => {
      dispatchFunc({ type: 'reset' });
    });

    expect(container.textContent).toBe('Value: 0');
  });

  test('handles complex state objects', async () => {
    const reducer = (state, action) => {
      switch (action.type) {
        case 'setName':
          return { ...state, name: action.payload };
        case 'setAge':
          return { ...state, age: action.payload };
        case 'incrementAge':
          return { ...state, age: state.age + 1 };
        default:
          return state;
      }
    };

    let dispatchFunc;
    const initialState = { name: 'John', age: 25 };

    const Component = () => {
      const [state, dispatch] = useReducer(reducer, initialState);
      dispatchFunc = dispatch;
      return createElement('div', null, `${state.name} is ${state.age}`);
    };

    await act(() => {
      render(createElement(Component, null), container);
    });

    expect(container.textContent).toBe('John is 25');

    await act(() => {
      dispatchFunc({ type: 'setName', payload: 'Jane' });
    });

    expect(container.textContent).toBe('Jane is 25');

    await act(() => {
      dispatchFunc({ type: 'incrementAge' });
    });

    expect(container.textContent).toBe('Jane is 26');
  });

  test('preserves dispatch reference across renders', async () => {
    const reducer = (state, action) => state + action;
    const dispatches = [];

    const Component = ({ prop }) => {
      const [state, dispatch] = useReducer(reducer, 0);
      dispatches.push(dispatch);
      return createElement('div', null, `${prop}: ${state}`);
    };

    await act(() => {
      render(createElement(Component, { prop: 'A' }), container);
    });

    await act(() => {
      render(createElement(Component, { prop: 'B' }), container);
    });

    await act(() => {
      render(createElement(Component, { prop: 'C' }), container);
    });

    expect(dispatches[0]).toBe(dispatches[1]);
    expect(dispatches[1]).toBe(dispatches[2]);
  });

  test('batches multiple dispatches', async () => {
    let renderCount = 0;
    const reducer = (state, action) => state + action;
    let dispatchFunc;

    const Component = () => {
      renderCount++;
      const [state, dispatch] = useReducer(reducer, 0);
      dispatchFunc = dispatch;
      return createElement('div', null, `Sum: ${state}`);
    };

    await act(() => {
      render(createElement(Component, null), container);
    });

    const initialRenderCount = renderCount;

    await act(() => {
      dispatchFunc(1);
      dispatchFunc(2);
      dispatchFunc(3);
    });

    expect(container.textContent).toBe('Sum: 6');
    expect(renderCount).toBe(initialRenderCount + 1);
  });

  test('handles array state', async () => {
    const reducer = (state, action) => {
      switch (action.type) {
        case 'add':
          return [...state, action.payload];
        case 'remove':
          return state.filter((_, i) => i !== action.index);
        case 'clear':
          return [];
        default:
          return state;
      }
    };

    let dispatchFunc;

    const Component = () => {
      const [items, dispatch] = useReducer(reducer, [1, 2, 3]);
      dispatchFunc = dispatch;
      return createElement('div', null, items.join(','));
    };

    await act(() => {
      render(createElement(Component, null), container);
    });

    expect(container.textContent).toBe('1,2,3');

    await act(() => {
      dispatchFunc({ type: 'add', payload: 4 });
    });

    expect(container.textContent).toBe('1,2,3,4');

    await act(() => {
      dispatchFunc({ type: 'remove', index: 1 });
    });

    expect(container.textContent).toBe('1,3,4');

    await act(() => {
      dispatchFunc({ type: 'clear' });
    });

    expect(container.textContent).toBe('');
  });

  test('reducer receives current state', async () => {
    const reducer = jest.fn((state, action) => {
      if (action.type === 'double') {
        return state * 2;
      }
      return state;
    });

    let dispatchFunc;

    const Component = () => {
      const [state, dispatch] = useReducer(reducer, 5);
      dispatchFunc = dispatch;
      return createElement('div', null, `Value: ${state}`);
    };

    await act(() => {
      render(createElement(Component, null), container);
    });

    expect(container.textContent).toBe('Value: 5');

    await act(() => {
      dispatchFunc({ type: 'double' });
    });

    expect(reducer).toHaveBeenCalledWith(5, { type: 'double' });
    expect(container.textContent).toBe('Value: 10');

    await act(() => {
      dispatchFunc({ type: 'double' });
    });

    expect(reducer).toHaveBeenCalledWith(10, { type: 'double' });
    expect(container.textContent).toBe('Value: 20');
  });

  test('supports lazy initialization', async () => {
    const init = jest.fn(arg => arg * 2);
    const reducer = (state, action) => state + action;
    
    const Component = () => {
      const [state] = useReducer(reducer, 5, init);
      return createElement('div', null, `Value: ${state}`);
    };

    await act(() => {
      render(createElement(Component, null), container);
    });

    expect(init).toHaveBeenCalledWith(5);
    expect(container.textContent).toBe('Value: 10');
  });

  test('throws error when called outside component', () => {
    setWipFiber(null);
    
    // Also clear window.minireact to ensure clean state
    if (typeof window !== 'undefined' && window.minireact) {
      window.minireact.wipFiber = null;
    }
    
    const reducer = (state) => state;
    
    expect(() => {
      useReducer(reducer, 0);
    }).toThrow();
  });
});