import MiniReact from '../src/index.js';

export function createContainer() {
  const container = document.createElement('div');
  container.setAttribute('id', 'root');
  document.body.appendChild(container);
  return container;
}

export function cleanupContainer(container) {
  if (container && container.parentNode) {
    container.parentNode.removeChild(container);
  }
  
  // Reset MiniReact global state to prevent test interference
  if (typeof window !== 'undefined' && window.minireact) {
    window.minireact.wipFiber = null;
    window.minireact.hookIndex = null;
    window.minireact.deletions = null;
    window.minireact.scheduleRerender = null;
  }
  
  // Reset fiber state by importing and calling reset functions
  try {
    const { resetRootContainer } = require('../src/core/fiber.js');
    resetRootContainer();
  } catch (e) {
    // Reset function may not exist or fail, continue
  }
  
  // Clear hook states
  try {
    const { clearHookState } = require('../src/hooks/useState.js');
    clearHookState();
  } catch (e) {
    // Function may not exist, continue
  }
  
  try {
    const { clearReducerState } = require('../src/hooks/useReducer.js');
    clearReducerState();
  } catch (e) {
    // Function may not exist, continue
  }
}

export async function act(callback) {
  // Clear any previous requestIdleCallback mocks
  if (global.requestIdleCallback.mockClear) {
    global.requestIdleCallback.mockClear();
  }
  
  // Execute the callback
  const result = callback();
  
  // If callback returns a promise, wait for it
  if (result && typeof result.then === 'function') {
    await result;
  }
  
  // Process all scheduled work until there's none left
  let maxIterations = 20; // Increased to handle multiple render cycles
  let hadWork = false;
  
  do {
    hadWork = false;
    const mockRequestIdleCallback = global.requestIdleCallback;
    
    if (mockRequestIdleCallback.mock && mockRequestIdleCallback.mock.calls.length > 0) {
      hadWork = true;
      const callbacks = [];
      mockRequestIdleCallback.mock.calls.forEach(call => {
        if (call[0]) callbacks.push(call[0]);
      });
      
      // Clear the mock calls after collecting them
      mockRequestIdleCallback.mockClear();
      
      // Execute all callbacks synchronously
      for (const cb of callbacks) {
        try {
          cb({
            timeRemaining: () => 50,
            didTimeout: false
          });
        } catch (error) {
          console.error('Error in act callback:', error);
        }
      }
    }
    
    maxIterations--;
  } while (hadWork && maxIterations > 0);
  
  // Advance fake timers if they're being used
  if (jest.isMockFunction(setTimeout)) {
    jest.runAllTimers();
  }
  
  // Add a small delay to ensure all state updates are processed
  await new Promise(resolve => setTimeout(resolve, 0));
}

export function fireEvent(element, eventType, eventData = {}) {
  const event = new Event(eventType, { bubbles: true, cancelable: true });
  Object.assign(event, eventData);
  element.dispatchEvent(event);
}

export function getByText(container, text) {
  const walker = document.createTreeWalker(
    container,
    NodeFilter.SHOW_TEXT,
    null,
    false
  );
  
  let node;
  while (node = walker.nextNode()) {
    if (node.nodeValue && node.nodeValue.includes(text)) {
      return node.parentElement;
    }
  }
  return null;
}

export function getAllByText(container, text) {
  const elements = [];
  const walker = document.createTreeWalker(
    container,
    NodeFilter.SHOW_TEXT,
    null,
    false
  );
  
  let node;
  while (node = walker.nextNode()) {
    if (node.nodeValue && node.nodeValue.includes(text)) {
      elements.push(node.parentElement);
    }
  }
  return elements;
}

export function getByTestId(container, testId) {
  return container.querySelector(`[data-testid="${testId}"]`);
}

export function waitFor(condition, timeout = 1000) {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    
    const check = () => {
      try {
        const result = condition();
        if (result) {
          resolve(result);
        } else if (Date.now() - startTime > timeout) {
          reject(new Error('Timeout waiting for condition'));
        } else {
          setTimeout(check, 10);
        }
      } catch (error) {
        if (Date.now() - startTime > timeout) {
          reject(error);
        } else {
          setTimeout(check, 10);
        }
      }
    };
    
    check();
  });
}