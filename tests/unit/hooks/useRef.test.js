/**
 * @fileoverview Testes para useRef hook
 */

import { useRef } from '../../../src/hooks/useRef.js';
import { render, setWipFiber } from '../../../src/core/fiber.js';
import { createElement } from '../../../src/vdom/createElement.js';
import { createContainer, cleanupContainer, act, fireEvent } from '../../testUtils.js';

describe('useRef', () => {
  let container;

  beforeEach(() => {
    container = createContainer();
  });

  afterEach(() => {
    cleanupContainer(container);
    setWipFiber(null);
  });

  test('returns ref object with current property', async () => {
    let refResult;

    function TestComponent() {
      refResult = useRef('initial');
      return createElement('div', null, 'test');
    }

    await act(() => {
      render(createElement(TestComponent), container);
    });

    expect(refResult).toBeDefined();
    expect(refResult).toHaveProperty('current');
    expect(refResult.current).toBe('initial');
  });

  test('preserves ref across renders', async () => {
    let refResult1, refResult2;
    let setStateFunc;

    function TestComponent() {
      const { useState } = require('../../../src/hooks/useState.js');
      const [state, setState] = useState(0);
      setStateFunc = setState;
      
      const myRef = useRef('value');
      
      // Always capture the ref
      if (!refResult1) {
        refResult1 = myRef;
      } else {
        refResult2 = myRef;
      }
      
      return createElement('div', null, state.toString());
    }

    // First render
    await act(() => {
      render(createElement(TestComponent), container);
    });

    expect(refResult1).toBeDefined();
    expect(refResult1.current).toBe('value');

    // Trigger re-render
    await act(() => {
      setStateFunc(1);
    });

    expect(refResult2).toBeDefined();
    expect(refResult2).toBe(refResult1); // Same object reference
    expect(refResult2.current).toBe('value');
  });

  test('allows mutable current property', async () => {
    let refResult;

    function TestComponent() {
      refResult = useRef(0);
      return createElement('div', null, 'test');
    }

    await act(() => {
      render(createElement(TestComponent), container);
    });

    expect(refResult.current).toBe(0);

    // Mutate current property
    refResult.current = 42;
    expect(refResult.current).toBe(42);

    // Mutate to different types
    refResult.current = 'string';
    expect(refResult.current).toBe('string');

    refResult.current = { nested: 'object' };
    expect(refResult.current).toEqual({ nested: 'object' });
  });

  test('works with DOM elements', async () => {
    let inputRef;
    let buttonRef;

    function TestComponent() {
      inputRef = useRef(null);
      buttonRef = useRef(null);

      const handleClick = () => {
        if (inputRef.current) {
          inputRef.current.focus();
        }
      };

      return createElement('div', null, 
        createElement('input', { 
          ref: (el) => { inputRef.current = el; }
        }),
        createElement('button', { 
          ref: (el) => { buttonRef.current = el; },
          onClick: handleClick 
        }, 'Focus Input')
      );
    }

    await act(() => {
      render(createElement(TestComponent), container);
    });

    expect(inputRef.current).toBeTruthy();
    expect(buttonRef.current).toBeTruthy();
    expect(inputRef.current.tagName.toLowerCase()).toBe('input');
    expect(buttonRef.current.tagName.toLowerCase()).toBe('button');

    // Test ref callback functionality
    const input = container.querySelector('input');
    const button = container.querySelector('button');
    
    expect(inputRef.current).toBe(input);
    expect(buttonRef.current).toBe(button);
  });

  test('handles null initial value', async () => {
    let refResult;

    function TestComponent() {
      refResult = useRef(null);
      return createElement('div', null, 'test');
    }

    await act(() => {
      render(createElement(TestComponent), container);
    });

    expect(refResult.current).toBeNull();

    // Should allow setting to non-null
    refResult.current = 'not null';
    expect(refResult.current).toBe('not null');

    // Should allow setting back to null
    refResult.current = null;
    expect(refResult.current).toBeNull();
  });

  test('multiple refs work independently', async () => {
    let ref1, ref2, ref3;

    function TestComponent() {
      ref1 = useRef(1);
      ref2 = useRef('two');
      ref3 = useRef({ three: 3 });
      return createElement('div', null, 'test');
    }

    await act(() => {
      render(createElement(TestComponent), container);
    });

    expect(ref1.current).toBe(1);
    expect(ref2.current).toBe('two');
    expect(ref3.current).toEqual({ three: 3 });

    // Mutate each ref independently
    ref1.current = 100;
    ref2.current = 'modified';
    ref3.current = { modified: true };

    expect(ref1.current).toBe(100);
    expect(ref2.current).toBe('modified');
    expect(ref3.current).toEqual({ modified: true });

    // Ensure they're independent objects
    expect(ref1).not.toBe(ref2);
    expect(ref2).not.toBe(ref3);
    expect(ref1).not.toBe(ref3);
  });

  test('throws error when called outside component', () => {
    setWipFiber(null); // Ensure no fiber is set
    
    // Also clear window.minireact to prevent fallback
    const originalMinireact = global.window?.minireact;
    if (global.window) {
      global.window.minireact = null;
    }
    
    expect(() => {
      useRef('test');
    }).toThrow('useRef: must be called within a component');
    
    // Restore original state
    if (global.window && originalMinireact !== undefined) {
      global.window.minireact = originalMinireact;
    }
  });

  test('maintains ref identity across multiple renders', async () => {
    let refResult;
    let setStateFunc;
    const identities = [];
    let renderCount = 0;

    function TestComponent() {
      const { useState } = require('../../../src/hooks/useState.js');
      const [count, setCount] = useState(0);
      setStateFunc = setCount;
      renderCount++;
      
      refResult = useRef('persistent');
      identities.push(refResult);
      
      return createElement('div', null, `render-${renderCount}-count-${count}`);
    }

    // First render
    await act(() => {
      render(createElement(TestComponent), container);
    });

    expect(renderCount).toBe(1);
    expect(identities).toHaveLength(1);

    // Multiple re-renders with different values to avoid optimization
    for (let i = 1; i <= 3; i++) {
      await act(() => {
        setStateFunc(count => count + 1); // Use functional update to ensure change
      });
      
      // Check that render actually happened
      expect(renderCount).toBe(i + 1);
    }

    // All should be the same object
    expect(identities).toHaveLength(4); // Initial + 3 re-renders
    expect(renderCount).toBe(4);
    identities.forEach((ref, index) => {
      if (index > 0) {
        expect(ref).toBe(identities[0]);
      }
    });
  });

  test('handles undefined initial value', async () => {
    let refResult;

    function TestComponent() {
      refResult = useRef(undefined);
      return createElement('div', null, 'test');
    }

    await act(() => {
      render(createElement(TestComponent), container);
    });

    expect(refResult.current).toBeUndefined();

    refResult.current = 'defined';
    expect(refResult.current).toBe('defined');
  });

  test('works with complex objects', async () => {
    let refResult;
    const complexObject = {
      nested: {
        deep: {
          value: 'test'
        }
      },
      array: [1, 2, 3],
      func: () => 'function'
    };

    function TestComponent() {
      refResult = useRef(complexObject);
      return createElement('div', null, 'test');
    }

    await act(() => {
      render(createElement(TestComponent), container);
    });

    expect(refResult.current).toBe(complexObject);
    expect(refResult.current.nested.deep.value).toBe('test');
    expect(refResult.current.array).toEqual([1, 2, 3]);
    expect(refResult.current.func()).toBe('function');
  });
});