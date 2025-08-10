import { useEffect } from '../../../src/hooks/useEffect.js';
import { useState } from '../../../src/hooks/useState.js';
import { render } from '../../../src/core/fiber.js';
import { createElement } from '../../../src/vdom/createElement.js';
import { createContainer, cleanupContainer, act } from '../../testUtils.js';

describe('useEffect', () => {
  let container;

  beforeEach(() => {
    container = createContainer();
  });

  afterEach(() => {
    cleanupContainer(container);
  });

  test('runs effect after render', async () => {
    const effect = jest.fn();
    
    const Component = () => {
      useEffect(effect);
      return createElement('div', null, 'Test');
    };

    await act(() => {
      render(createElement(Component, null), container);
    });

    expect(effect).toHaveBeenCalledTimes(1);
  });

  test('runs effect only once with empty deps', async () => {
    const effect = jest.fn();
    let setCountFunc;
    
    const Component = () => {
      const [count, setCount] = useState(0);
      setCountFunc = setCount;
      useEffect(effect, []);
      return createElement('div', null, `Count: ${count}`);
    };

    await act(() => {
      render(createElement(Component, null), container);
    });

    expect(effect).toHaveBeenCalledTimes(1);

    await act(() => {
      setCountFunc(1);
    });

    expect(effect).toHaveBeenCalledTimes(1);

    await act(() => {
      setCountFunc(2);
    });

    expect(effect).toHaveBeenCalledTimes(1);
  });

  test('runs effect when dependencies change', async () => {
    const effect = jest.fn();
    let setCountFunc, setTextFunc;
    
    const Component = () => {
      const [count, setCount] = useState(0);
      const [text, setText] = useState('a');
      setCountFunc = setCount;
      setTextFunc = setText;
      useEffect(effect, [count]);
      return createElement('div', null, `${count}: ${text}`);
    };

    await act(() => {
      render(createElement(Component, null), container);
    });

    expect(effect).toHaveBeenCalledTimes(1);

    await act(() => {
      setTextFunc('b');
    });

    expect(effect).toHaveBeenCalledTimes(1);

    await act(() => {
      setCountFunc(1);
    });

    expect(effect).toHaveBeenCalledTimes(2);
  });

  test('runs cleanup before next effect', async () => {
    const cleanup = jest.fn();
    const effect = jest.fn(() => cleanup);
    let setCountFunc;
    
    const Component = () => {
      const [count, setCount] = useState(0);
      setCountFunc = setCount;
      useEffect(effect, [count]);
      return createElement('div', null, `Count: ${count}`);
    };

    await act(() => {
      render(createElement(Component, null), container);
    });

    expect(effect).toHaveBeenCalledTimes(1);
    expect(cleanup).not.toHaveBeenCalled();

    await act(() => {
      setCountFunc(1);
    });

    expect(cleanup).toHaveBeenCalledTimes(1);
    expect(effect).toHaveBeenCalledTimes(2);
    expect(cleanup.mock.invocationCallOrder[0]).toBeLessThan(
      effect.mock.invocationCallOrder[1]
    );
  });

  test('runs cleanup on unmount', async () => {
    const cleanup = jest.fn();
    const effect = jest.fn(() => cleanup);
    
    const Component = () => {
      useEffect(effect, []);
      return createElement('div', null, 'Component');
    };

    await act(() => {
      render(createElement(Component, null), container);
    });

    expect(effect).toHaveBeenCalledTimes(1);
    expect(cleanup).not.toHaveBeenCalled();

    await act(() => {
      render(null, container);
    });

    expect(cleanup).toHaveBeenCalledTimes(1);
  });

  test('handles multiple effects', async () => {
    const effect1 = jest.fn();
    const effect2 = jest.fn();
    const effect3 = jest.fn();
    
    const Component = () => {
      useEffect(effect1);
      useEffect(effect2, []);
      useEffect(effect3, [1, 2]);
      return createElement('div', null, 'Multiple effects');
    };

    await act(() => {
      render(createElement(Component, null), container);
    });

    expect(effect1).toHaveBeenCalledTimes(1);
    expect(effect2).toHaveBeenCalledTimes(1);
    expect(effect3).toHaveBeenCalledTimes(1);
  });

  test('compares dependencies correctly', async () => {
    const effect = jest.fn();
    let setObjFunc;
    
    const Component = () => {
      const [obj, setObj] = useState({ value: 1 });
      setObjFunc = setObj;
      useEffect(effect, [obj.value]);
      return createElement('div', null, `Value: ${obj.value}`);
    };

    await act(() => {
      render(createElement(Component, null), container);
    });

    expect(effect).toHaveBeenCalledTimes(1);

    await act(() => {
      setObjFunc({ value: 1 });
    });

    expect(effect).toHaveBeenCalledTimes(1);

    await act(() => {
      setObjFunc({ value: 2 });
    });

    expect(effect).toHaveBeenCalledTimes(2);
  });

  test('handles null and undefined in dependencies', async () => {
    const effect = jest.fn();
    let setValueFunc;
    
    const Component = () => {
      const [value, setValue] = useState(null);
      setValueFunc = setValue;
      useEffect(effect, [value]);
      return createElement('div', null, 'Test');
    };

    await act(() => {
      render(createElement(Component, null), container);
    });

    expect(effect).toHaveBeenCalledTimes(1);

    await act(() => {
      setValueFunc(undefined);
    });

    expect(effect).toHaveBeenCalledTimes(2);

    await act(() => {
      setValueFunc(null);
    });

    expect(effect).toHaveBeenCalledTimes(3);
  });

  test('effect can update state', async () => {
    let effectRan = false;
    
    const Component = () => {
      const [state, setState] = useState('initial');
      
      useEffect(() => {
        if (!effectRan) {
          effectRan = true;
          setState('updated');
        }
      }, []);
      
      return createElement('div', null, state);
    };

    await act(() => {
      render(createElement(Component, null), container);
    });

    expect(container.textContent).toBe('updated');
  });

  test('handles cleanup when component unmounts', async () => {
    const cleanup = jest.fn();
    const asyncEffect = jest.fn(() => {
      return cleanup;
    });
    
    const Component = () => {
      useEffect(asyncEffect, []);
      return createElement('div', null, 'Component');
    };

    const Wrapper = ({ showComponent }) => {
      if (showComponent) {
        return createElement(Component);
      }
      return createElement('div', null, 'No component');
    };

    await act(() => {
      render(createElement(Wrapper, { showComponent: true }), container);
    });

    expect(asyncEffect).toHaveBeenCalledTimes(1);
    expect(cleanup).not.toHaveBeenCalled();

    // Unmount the component by not rendering it
    await act(() => {
      render(createElement(Wrapper, { showComponent: false }), container);
    });

    expect(cleanup).toHaveBeenCalledTimes(1);
  });

  test('preserves effect order', async () => {
    const order = [];
    
    const Component = () => {
      useEffect(() => {
        order.push('effect1');
        return () => order.push('cleanup1');
      });
      
      useEffect(() => {
        order.push('effect2');
        return () => order.push('cleanup2');
      });
      
      useEffect(() => {
        order.push('effect3');
        return () => order.push('cleanup3');
      });
      
      return createElement('div', null, 'Test');
    };

    await act(() => {
      render(createElement(Component, null), container);
    });

    expect(order).toEqual(['effect1', 'effect2', 'effect3']);

    order.length = 0;

    await act(() => {
      render(createElement(Component, null), container);
    });

    expect(order).toEqual([
      'cleanup1', 'cleanup2', 'cleanup3',
      'effect1', 'effect2', 'effect3'
    ]);
  });

  test('throws error when called outside component', () => {
    expect(() => {
      useEffect(() => {});
    }).toThrow();
  });
});