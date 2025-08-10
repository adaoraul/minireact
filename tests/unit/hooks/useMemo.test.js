import { useMemo } from '../../../src/hooks/useMemo.js';
import { useState } from '../../../src/hooks/useState.js';
import { render } from '../../../src/core/fiber.js';
import { createElement } from '../../../src/vdom/createElement.js';
import { createContainer, cleanupContainer, act } from '../../testUtils.js';

describe('useMemo', () => {
  let container;

  beforeEach(() => {
    container = createContainer();
  });

  afterEach(() => {
    cleanupContainer(container);
  });

  test('memoizes computed value', async () => {
    const compute = jest.fn(() => 'computed');
    let memoizedValue;

    const Component = () => {
      memoizedValue = useMemo(compute, []);
      return createElement('div', null, memoizedValue);
    };

    await act(() => {
      render(createElement(Component, null), container);
    });

    expect(compute).toHaveBeenCalledTimes(1);
    expect(memoizedValue).toBe('computed');
    expect(container.textContent).toBe('computed');

    await act(() => {
      render(createElement(Component, null), container);
    });

    expect(compute).toHaveBeenCalledTimes(1);
    expect(memoizedValue).toBe('computed');
  });

  test('recomputes when dependencies change', async () => {
    const compute = jest.fn((a, b) => a + b);
    let setAFunc, setBFunc;

    const Component = () => {
      const [a, setA] = useState(1);
      const [b, setB] = useState(2);
      setAFunc = setA;
      setBFunc = setB;
      
      const sum = useMemo(() => compute(a, b), [a, b]);
      
      return createElement('div', null, `Sum: ${sum}`);
    };

    await act(() => {
      render(createElement(Component, null), container);
    });

    expect(compute).toHaveBeenCalledTimes(1);
    expect(compute).toHaveBeenCalledWith(1, 2);
    expect(container.textContent).toBe('Sum: 3');

    await act(() => {
      setAFunc(5);
    });

    expect(compute).toHaveBeenCalledTimes(2);
    expect(compute).toHaveBeenCalledWith(5, 2);
    expect(container.textContent).toBe('Sum: 7');

    await act(() => {
      setBFunc(3);
    });

    expect(compute).toHaveBeenCalledTimes(3);
    expect(compute).toHaveBeenCalledWith(5, 3);
    expect(container.textContent).toBe('Sum: 8');
  });

  test('does not recompute when dependencies are the same', async () => {
    const compute = jest.fn(() => Math.random());
    let setCountFunc, setUnrelatedFunc;

    const Component = () => {
      const [count, setCount] = useState(0);
      const [unrelated, setUnrelated] = useState('a');
      setCountFunc = setCount;
      setUnrelatedFunc = setUnrelated;
      
      const value = useMemo(() => compute(), [count]);
      
      return createElement('div', null, `${value}-${unrelated}`);
    };

    await act(() => {
      render(createElement(Component, null), container);
    });

    expect(compute).toHaveBeenCalledTimes(1);
    const initialValue = container.textContent.split('-')[0];

    await act(() => {
      setUnrelatedFunc('b');
    });

    expect(compute).toHaveBeenCalledTimes(1);
    const valueAfterUnrelatedChange = container.textContent.split('-')[0];
    expect(valueAfterUnrelatedChange).toBe(initialValue);

    await act(() => {
      setCountFunc(1);
    });

    expect(compute).toHaveBeenCalledTimes(2);
  });

  test('handles complex computations', async () => {
    const expensiveComputation = jest.fn((items) => {
      return items.reduce((sum, item) => sum + item, 0);
    });

    let setItemsFunc;

    const Component = () => {
      const [items, setItems] = useState([1, 2, 3]);
      setItemsFunc = setItems;
      
      const total = useMemo(
        () => expensiveComputation(items),
        [items]
      );
      
      return createElement('div', null, `Total: ${total}`);
    };

    await act(() => {
      render(createElement(Component, null), container);
    });

    expect(expensiveComputation).toHaveBeenCalledTimes(1);
    expect(container.textContent).toBe('Total: 6');

    await act(() => {
      setItemsFunc([4, 5, 6]);
    });

    expect(expensiveComputation).toHaveBeenCalledTimes(2);
    expect(container.textContent).toBe('Total: 15');
  });

  test('handles object and array dependencies correctly', async () => {
    const compute = jest.fn(() => 'result');
    let setObjFunc;

    const Component = () => {
      const [obj, setObj] = useState({ value: 1 });
      setObjFunc = setObj;
      
      const result = useMemo(
        () => compute(),
        [obj.value]
      );
      
      return createElement('div', null, result);
    };

    await act(() => {
      render(createElement(Component, null), container);
    });

    expect(compute).toHaveBeenCalledTimes(1);

    await act(() => {
      setObjFunc({ value: 1 });
    });

    expect(compute).toHaveBeenCalledTimes(1);

    await act(() => {
      setObjFunc({ value: 2 });
    });

    expect(compute).toHaveBeenCalledTimes(2);
  });

  test('multiple useMemo calls', async () => {
    const compute1 = jest.fn(() => 'memo1');
    const compute2 = jest.fn(() => 'memo2');
    const compute3 = jest.fn(() => 'memo3');

    const Component = () => {
      const memo1 = useMemo(compute1, []);
      const memo2 = useMemo(compute2, [1]);
      const memo3 = useMemo(compute3, [1, 2]);
      
      return createElement('div', null, `${memo1}-${memo2}-${memo3}`);
    };

    await act(() => {
      render(createElement(Component, null), container);
    });

    expect(compute1).toHaveBeenCalledTimes(1);
    expect(compute2).toHaveBeenCalledTimes(1);
    expect(compute3).toHaveBeenCalledTimes(1);
    expect(container.textContent).toBe('memo1-memo2-memo3');
  });

  test('handles null and undefined dependencies', async () => {
    const compute = jest.fn((val) => val === null ? 'null' : 'not-null');
    let setValueFunc;

    const Component = () => {
      const [value, setValue] = useState(null);
      setValueFunc = setValue;
      
      const result = useMemo(() => compute(value), [value]);
      
      return createElement('div', null, result);
    };

    await act(() => {
      render(createElement(Component, null), container);
    });

    expect(compute).toHaveBeenCalledTimes(1);
    expect(container.textContent).toBe('null');

    await act(() => {
      setValueFunc(undefined);
    });

    expect(compute).toHaveBeenCalledTimes(2);
    expect(container.textContent).toBe('not-null');

    await act(() => {
      setValueFunc(null);
    });

    expect(compute).toHaveBeenCalledTimes(3);
    expect(container.textContent).toBe('null');
  });

  test('can return different types', async () => {
    let setTypeFunc;

    const Component = () => {
      const [type, setType] = useState('string');
      setTypeFunc = setType;
      
      const value = useMemo(() => {
        switch (type) {
          case 'string': return 'text';
          case 'number': return 42;
          case 'object': return { key: 'value' };
          case 'array': return [1, 2, 3];
          default: return null;
        }
      }, [type]);
      
      const display = typeof value === 'object' 
        ? JSON.stringify(value) 
        : String(value);
      
      return createElement('div', null, display);
    };

    await act(() => {
      render(createElement(Component, null), container);
    });

    expect(container.textContent).toBe('text');

    await act(() => {
      setTypeFunc('number');
    });

    expect(container.textContent).toBe('42');

    await act(() => {
      setTypeFunc('object');
    });

    expect(container.textContent).toBe('{"key":"value"}');

    await act(() => {
      setTypeFunc('array');
    });

    expect(container.textContent).toBe('[1,2,3]');
  });

  test('throws error when called outside component', () => {
    expect(() => {
      useMemo(() => 'value', []);
    }).toThrow();
  });
});