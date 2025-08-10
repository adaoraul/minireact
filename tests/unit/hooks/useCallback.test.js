import { useCallback } from '../../../src/hooks/useCallback.js';
import { useState } from '../../../src/hooks/useState.js';
import { render } from '../../../src/core/fiber.js';
import { createElement } from '../../../src/vdom/createElement.js';
import { createContainer, cleanupContainer, act } from '../../testUtils.js';

describe('useCallback', () => {
  let container;

  beforeEach(() => {
    container = createContainer();
  });

  afterEach(() => {
    cleanupContainer(container);
  });

  test('memoizes callback function', async () => {
    const callbacks = [];
    
    const Component = () => {
      const callback = useCallback(() => 'result', []);
      callbacks.push(callback);
      return createElement('div', null, 'Test');
    };

    await act(() => {
      render(createElement(Component, null), container);
    });

    await act(() => {
      render(createElement(Component, null), container);
    });

    await act(() => {
      render(createElement(Component, null), container);
    });

    expect(callbacks).toHaveLength(3);
    expect(callbacks[0]).toBe(callbacks[1]);
    expect(callbacks[1]).toBe(callbacks[2]);
    expect(callbacks[0]()).toBe('result');
  });

  test('creates new callback when dependencies change', async () => {
    const callbacks = [];
    let setCountFunc;
    
    const Component = () => {
      const [count, setCount] = useState(0);
      setCountFunc = setCount;
      
      const callback = useCallback(() => count, [count]);
      callbacks.push(callback);
      
      return createElement('div', null, `Count: ${count}`);
    };

    await act(() => {
      render(createElement(Component, null), container);
    });

    const firstCallback = callbacks[0];
    expect(firstCallback()).toBe(0);

    await act(() => {
      setCountFunc(1);
    });

    const secondCallback = callbacks[1];
    expect(secondCallback).not.toBe(firstCallback);
    expect(secondCallback()).toBe(1);

    await act(() => {
      render(createElement(Component, null), container);
    });

    const thirdCallback = callbacks[2];
    expect(thirdCallback).toBe(secondCallback);
  });

  test('preserves closure values', async () => {
    let setValueFunc;
    let capturedCallback;
    
    const Component = () => {
      const [value, setValue] = useState('initial');
      setValueFunc = setValue;
      
      const callback = useCallback(() => {
        return `Captured: ${value}`;
      }, []);
      
      capturedCallback = callback;
      
      return createElement('div', null, value);
    };

    await act(() => {
      render(createElement(Component, null), container);
    });

    expect(capturedCallback()).toBe('Captured: initial');

    await act(() => {
      setValueFunc('updated');
    });

    expect(container.textContent).toBe('updated');
    expect(capturedCallback()).toBe('Captured: initial');
  });

  test('updates closure when dependencies change', async () => {
    let setValueFunc;
    let capturedCallback;
    
    const Component = () => {
      const [value, setValue] = useState('initial');
      setValueFunc = setValue;
      
      const callback = useCallback(() => {
        return `Current: ${value}`;
      }, [value]);
      
      capturedCallback = callback;
      
      return createElement('div', null, value);
    };

    await act(() => {
      render(createElement(Component, null), container);
    });

    expect(capturedCallback()).toBe('Current: initial');

    await act(() => {
      setValueFunc('updated');
    });

    expect(capturedCallback()).toBe('Current: updated');
  });

  test('handles callbacks with parameters', async () => {
    let capturedCallback;
    
    const Component = () => {
      const [multiplier] = useState(2);
      
      const callback = useCallback((num) => {
        return num * multiplier;
      }, [multiplier]);
      
      capturedCallback = callback;
      
      return createElement('div', null, 'Test');
    };

    await act(() => {
      render(createElement(Component, null), container);
    });

    expect(capturedCallback(5)).toBe(10);
    expect(capturedCallback(3)).toBe(6);
  });

  test('multiple useCallback calls', async () => {
    const callbacks1 = [];
    const callbacks2 = [];
    const callbacks3 = [];
    
    const Component = () => {
      const callback1 = useCallback(() => 'callback1', []);
      const callback2 = useCallback(() => 'callback2', [1]);
      const callback3 = useCallback(() => 'callback3', [1, 2]);
      
      callbacks1.push(callback1);
      callbacks2.push(callback2);
      callbacks3.push(callback3);
      
      return createElement('div', null, 'Multiple callbacks');
    };

    await act(() => {
      render(createElement(Component, null), container);
    });

    await act(() => {
      render(createElement(Component, null), container);
    });

    expect(callbacks1[0]).toBe(callbacks1[1]);
    expect(callbacks2[0]).toBe(callbacks2[1]);
    expect(callbacks3[0]).toBe(callbacks3[1]);
    
    expect(callbacks1[0]()).toBe('callback1');
    expect(callbacks2[0]()).toBe('callback2');
    expect(callbacks3[0]()).toBe('callback3');
  });

  test('handles async callbacks', async () => {
    let capturedCallback;
    
    const Component = () => {
      const callback = useCallback(async () => {
        return new Promise(resolve => {
          setTimeout(() => resolve('async result'), 10);
        });
      }, []);
      
      capturedCallback = callback;
      
      return createElement('div', null, 'Async test');
    };

    await act(() => {
      render(createElement(Component, null), container);
    });

    const result = await capturedCallback();
    expect(result).toBe('async result');
  });

  test('callbacks can update state', async () => {
    let incrementFunc;
    
    const Component = () => {
      const [count, setCount] = useState(0);
      
      const increment = useCallback(() => {
        setCount(prev => prev + 1);
      }, []);
      
      incrementFunc = increment;
      
      return createElement('div', null, `Count: ${count}`);
    };

    await act(() => {
      render(createElement(Component, null), container);
    });

    expect(container.textContent).toBe('Count: 0');

    await act(() => {
      incrementFunc();
    });

    expect(container.textContent).toBe('Count: 1');

    await act(() => {
      incrementFunc();
    });

    expect(container.textContent).toBe('Count: 2');
  });

  test('handles null and undefined dependencies', async () => {
    const callbacks = [];
    let setValueFunc;
    
    const Component = () => {
      const [value, setValue] = useState(null);
      setValueFunc = setValue;
      
      const callback = useCallback(() => value, [value]);
      callbacks.push(callback);
      
      return createElement('div', null, 'Test');
    };

    await act(() => {
      render(createElement(Component, null), container);
    });

    expect(callbacks[0]()).toBe(null);

    await act(() => {
      setValueFunc(undefined);
    });

    expect(callbacks[1]).not.toBe(callbacks[0]);
    expect(callbacks[1]()).toBe(undefined);

    await act(() => {
      setValueFunc(null);
    });

    expect(callbacks[2]).not.toBe(callbacks[1]);
    expect(callbacks[2]()).toBe(null);
  });

  test('event handler use case', async () => {
    let clickCount = 0;
    const handlers = [];
    
    const Component = ({ multiplier }) => {
      const handleClick = useCallback(() => {
        clickCount += multiplier;
      }, [multiplier]);
      
      handlers.push(handleClick);
      
      return createElement('button', { onClick: handleClick }, 'Click');
    };

    await act(() => {
      render(createElement(Component, { multiplier: 1 }), container);
    });

    handlers[0]();
    expect(clickCount).toBe(1);

    await act(() => {
      render(createElement(Component, { multiplier: 1 }), container);
    });

    expect(handlers[1]).toBe(handlers[0]);

    await act(() => {
      render(createElement(Component, { multiplier: 2 }), container);
    });

    expect(handlers[2]).not.toBe(handlers[1]);
    handlers[2]();
    expect(clickCount).toBe(3);
  });

  test('throws error when called outside component', () => {
    expect(() => {
      useCallback(() => {}, []);
    }).toThrow();
  });
});