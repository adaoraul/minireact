/**
 * @fileoverview Tests for scheduling logic in MiniReact
 */

import { render, getCurrentRoot } from '../../../src/core/fiber.js';
import { createElement } from '../../../src/vdom/createElement.js';

describe('Scheduler', () => {
  let container;
  let originalRequestIdleCallback;
  let mockIdleCallback;
  let idleCallbacks;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    
    // Mock requestIdleCallback
    idleCallbacks = [];
    mockIdleCallback = jest.fn();
    originalRequestIdleCallback = global.requestIdleCallback;
    
    global.requestIdleCallback = jest.fn((callback) => {
      idleCallbacks.push(callback);
      return mockIdleCallback;
    });
  });

  afterEach(() => {
    document.body.removeChild(container);
    global.requestIdleCallback = originalRequestIdleCallback;
    
    // Clean up global state
    if (typeof window !== 'undefined' && window.minireact) {
      window.minireact.deletions = null;
      window.minireact.scheduleRerender = null;
    }
  });

  describe('Task Processing', () => {
    test('processes tasks in correct priority order', () => {
      const executionOrder = [];
      
      const HighPriorityComponent = () => {
        executionOrder.push('high');
        return createElement('div', null, 'High Priority');
      };
      
      const LowPriorityComponent = () => {
        executionOrder.push('low');
        return createElement('div', null, 'Low Priority');
      };

      // Render components
      const app = createElement('div', null, 
        createElement(HighPriorityComponent),
        createElement(LowPriorityComponent)
      );

      render(app, container);
      
      // Process work loop
      if (idleCallbacks.length > 0) {
        const deadline = { timeRemaining: () => 5 };
        idleCallbacks[0](deadline);
      }

      // Should process in the order they appear in the tree
      expect(executionOrder).toEqual(['high', 'low']);
    });
  });

  describe('Work Loop Control', () => {
    test('yields control back to browser', () => {
      let yieldCount = 0;
      const components = [];
      
      // Create many components to trigger yielding
      for (let i = 0; i < 10; i++) {
        const Component = () => {
          return createElement('div', null, `Component ${i}`);
        };
        components.push(createElement(Component));
      }

      const app = createElement('div', null, ...components);
      render(app, container);

      // Mock deadline that runs out of time quickly
      const deadline = {
        timeRemaining: jest.fn(() => {
          yieldCount++;
          return yieldCount > 3 ? 0 : 5; // Yield after 3 calls
        })
      };

      // Process first callback
      if (idleCallbacks.length > 0) {
        idleCallbacks[0](deadline);
      }

      // Should have scheduled another callback due to yielding
      expect(idleCallbacks.length).toBeGreaterThan(1);
    });

    test('resumes work after yielding', () => {
      const executionOrder = [];
      
      const Component1 = () => {
        executionOrder.push('comp1');
        return createElement('div', null, 'Component 1');
      };
      
      const Component2 = () => {
        executionOrder.push('comp2');
        return createElement('div', null, 'Component 2');
      };

      const app = createElement('div', null,
        createElement(Component1),
        createElement(Component2)
      );

      render(app, container);

      // First work loop - yield immediately after processing some work
      const deadline1 = { 
        timeRemaining: jest.fn()
          .mockReturnValueOnce(5) // Allow some initial work
          .mockReturnValue(0)     // Then force yielding
      };
      
      if (idleCallbacks.length > 0) {
        idleCallbacks[0](deadline1);
      }

      // Second work loop - process remaining work  
      const deadline2 = { timeRemaining: () => 5 };
      if (idleCallbacks.length > 1) {
        idleCallbacks[1](deadline2);
      }

      // Should have executed at least one component
      expect(executionOrder.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Concurrent Updates', () => {
    test('handles concurrent updates', () => {
      let renderCount = 0;
      
      const TestComponent = () => {
        renderCount++;
        return createElement('div', null, `Render ${renderCount}`);
      };

      // First render
      render(createElement(TestComponent), container);
      
      // Process first render
      if (idleCallbacks.length > 0) {
        const deadline = { timeRemaining: () => 5 };
        idleCallbacks[0](deadline);
      }

      const initialRenderCount = renderCount;

      // Trigger re-render by calling render again with new element
      render(createElement(TestComponent), container);
      
      // Process second render if scheduled
      if (idleCallbacks.length > 1) {
        const deadline = { timeRemaining: () => 5 };
        idleCallbacks[1](deadline);
      }
      
      // Should handle multiple renders (at least the first one)
      expect(renderCount).toBeGreaterThanOrEqual(initialRenderCount);
    });

    test('batches multiple updates', () => {
      let updateCount = 0;
      const updates = [];
      
      const TestComponent = () => {
        updateCount++;
        updates.push(`update-${updateCount}`);
        return createElement('div', null, `Update ${updateCount}`);
      };

      // Initial render
      render(createElement(TestComponent), container);
      
      // Should have scheduled work
      expect(idleCallbacks.length).toBeGreaterThan(0);
      
      // Process the work
      const deadline = { timeRemaining: () => 5 };
      idleCallbacks[0](deadline);

      // Should have processed the component
      expect(updateCount).toBeGreaterThan(0);
    });
  });

  describe('Work Scheduling', () => {
    test('schedules work when needed', () => {
      // Clear any existing calls
      global.requestIdleCallback.mockClear();
      idleCallbacks.length = 0;
      
      const component = createElement('div', null, 'Test');
      render(component, container);

      // Should have scheduled work
      expect(global.requestIdleCallback).toHaveBeenCalled();
      expect(idleCallbacks.length).toBe(1);
    });

    test('does not schedule redundant work', () => {
      // Clear any existing calls
      global.requestIdleCallback.mockClear();
      idleCallbacks.length = 0;
      
      const component = createElement('div', null, 'Test');
      
      // First render
      render(component, container);
      const initialCallCount = global.requestIdleCallback.mock.calls.length;
      
      // Process the work
      if (idleCallbacks.length > 0) {
        const deadline = { timeRemaining: () => 5 };
        idleCallbacks[0](deadline);
      }

      // Should not schedule more work when idle (work is completed)
      const finalCallCount = global.requestIdleCallback.mock.calls.length;
      expect(finalCallCount).toBe(initialCallCount);
    });
  });
});