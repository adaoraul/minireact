import { useState, clearHookState } from '../../../src/hooks/useState.js';
import { render, setWipFiber } from '../../../src/core/fiber.js';
import { createElement } from '../../../src/vdom/createElement.js';
import { createContainer, cleanupContainer, act } from '../../testUtils.js';

describe('useState', () => {
  let container;

  beforeEach(() => {
    container = createContainer();
  });

  afterEach(() => {
    cleanupContainer(container);
    setWipFiber(null);
    clearHookState();
  });

  test('returns initial state value', async () => {
    let stateValue;
    
    const Component = () => {
      const [state] = useState('initial');
      stateValue = state;
      return createElement('div', null, state);
    };

    await act(() => {
      render(createElement(Component, null), container);
    });

    expect(stateValue).toBe('initial');
    expect(container.textContent).toBe('initial');
  });

  test('returns initial state from function', async () => {
    let stateValue;
    const initializer = jest.fn(() => 'computed');
    
    const Component = () => {
      const [state] = useState(initializer);
      stateValue = state;
      return createElement('div', null, state);
    };

    await act(() => {
      render(createElement(Component, null), container);
    });

    expect(initializer).toHaveBeenCalledTimes(1);
    expect(stateValue).toBe('computed');
    expect(container.textContent).toBe('computed');
  });

  test('updates state when setState is called', async () => {
    let setStateFunc;
    
    const Component = () => {
      const [state, setState] = useState(0);
      setStateFunc = setState;
      return createElement('div', null, `Count: ${state}`);
    };

    await act(() => {
      render(createElement(Component, null), container);
    });

    expect(container.textContent).toBe('Count: 0');

    await act(() => {
      setStateFunc(1);
    });

    expect(container.textContent).toBe('Count: 1');
  });

  test('handles functional updates', async () => {
    let setStateFunc;
    
    const Component = () => {
      const [state, setState] = useState(10);
      setStateFunc = setState;
      return createElement('div', null, `Value: ${state}`);
    };

    await act(() => {
      render(createElement(Component, null), container);
    });

    expect(container.textContent).toBe('Value: 10');

    await act(() => {
      setStateFunc(prev => prev + 5);
    });

    expect(container.textContent).toBe('Value: 15');

    await act(() => {
      setStateFunc(prev => prev * 2);
    });

    expect(container.textContent).toBe('Value: 30');
  });

  test('batches multiple state updates', async () => {
    let setCountFunc;
    let renderCount = 0;
    
    const Component = () => {
      renderCount++;
      const [count, setCount] = useState(0);
      setCountFunc = setCount;
      return createElement('div', null, `Count: ${count}`);
    };

    await act(() => {
      render(createElement(Component, null), container);
    });

    const initialRenderCount = renderCount;

    await act(() => {
      setCountFunc(1);
      setCountFunc(2);
      setCountFunc(3);
    });

    expect(container.textContent).toBe('Count: 3');
    expect(renderCount).toBe(initialRenderCount + 1);
  });

  test('preserves state across re-renders', async () => {
    let setStateFunc;
    let propValue = 'A';
    
    const Component = ({ prop }) => {
      const [state, setState] = useState('initial');
      setStateFunc = setState;
      return createElement('div', null, `${prop}: ${state}`);
    };

    await act(() => {
      render(createElement(Component, { prop: propValue }), container);
    });

    expect(container.textContent).toBe('A: initial');

    await act(() => {
      setStateFunc('updated');
    });

    expect(container.textContent).toBe('A: updated');

    propValue = 'B';
    await act(() => {
      render(createElement(Component, { prop: propValue }), container);
    });

    expect(container.textContent).toBe('B: updated');
  });

  test('supports multiple useState calls', async () => {
    let setNameFunc, setAgeFunc;
    
    const Component = () => {
      const [name, setName] = useState('John');
      const [age, setAge] = useState(25);
      setNameFunc = setName;
      setAgeFunc = setAge;
      return createElement('div', null, `${name} is ${age}`);
    };

    await act(() => {
      render(createElement(Component, null), container);
    });

    expect(container.textContent).toBe('John is 25');

    await act(() => {
      setNameFunc('Jane');
    });

    expect(container.textContent).toBe('Jane is 25');

    await act(() => {
      setAgeFunc(30);
    });

    expect(container.textContent).toBe('Jane is 30');
  });

  test('handles complex state objects', async () => {
    let setUserFunc;
    
    const Component = () => {
      const [user, setUser] = useState({ name: 'John', age: 25 });
      setUserFunc = setUser;
      return createElement('div', null, `${user.name}: ${user.age}`);
    };

    await act(() => {
      render(createElement(Component, null), container);
    });

    expect(container.textContent).toBe('John: 25');

    await act(() => {
      setUserFunc({ name: 'Jane', age: 30 });
    });

    expect(container.textContent).toBe('Jane: 30');

    await act(() => {
      setUserFunc(prev => ({ ...prev, age: 31 }));
    });

    expect(container.textContent).toBe('Jane: 31');
  });

  test('handles arrays as state', async () => {
    let setItemsFunc;
    
    const Component = () => {
      const [items, setItems] = useState([1, 2, 3]);
      setItemsFunc = setItems;
      return createElement('div', null, items.join(','));
    };

    await act(() => {
      render(createElement(Component, null), container);
    });

    expect(container.textContent).toBe('1,2,3');

    await act(() => {
      setItemsFunc(prev => [...prev, 4]);
    });

    expect(container.textContent).toBe('1,2,3,4');

    await act(() => {
      setItemsFunc([5, 6]);
    });

    expect(container.textContent).toBe('5,6');
  });

  test('ignores updates with same value for primitives', async () => {
    let setStateFunc;
    let renderCount = 0;
    
    const Component = () => {
      renderCount++;
      const [state, setState] = useState('value');
      setStateFunc = setState;
      return createElement('div', null, state);
    };

    await act(() => {
      render(createElement(Component, null), container);
    });

    const initialRenderCount = renderCount;

    await act(() => {
      setStateFunc('value');
    });

    expect(renderCount).toBe(initialRenderCount);
  });

  test('handles null and undefined states', async () => {
    let setState1, setState2;
    
    const Component = () => {
      const [state1, set1] = useState(null);
      const [state2, set2] = useState(undefined);
      setState1 = set1;
      setState2 = set2;
      return createElement('div', null, 
        `1: ${state1 === null ? 'null' : state1}, 2: ${state2 === undefined ? 'undefined' : state2}`
      );
    };

    await act(() => {
      render(createElement(Component, null), container);
    });

    expect(container.textContent).toBe('1: null, 2: undefined');

    await act(() => {
      setState1('value1');
      setState2('value2');
    });

    expect(container.textContent).toBe('1: value1, 2: value2');

    await act(() => {
      setState1(null);
      setState2(undefined);
    });

    expect(container.textContent).toBe('1: null, 2: undefined');
  });

  test('throws error when called outside component', () => {
    setWipFiber(null);
    
    expect(() => {
      useState('initial');
    }).toThrow();
  });
});