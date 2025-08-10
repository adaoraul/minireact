import {
  render,
  getWipFiber,
  setWipFiber,
  getHookIndex,
  incrementHookIndex,
  setHookIndex,
  getCurrentRoot,
  setCurrentRoot,
  resetRootContainer
} from '../../../src/core/fiber.js';
import { createContainer, cleanupContainer, act } from '../../testUtils.js';
import { createElement } from '../../../src/vdom/createElement.js';

describe('Fiber', () => {
  let container;

  beforeEach(() => {
    container = createContainer();
    jest.useFakeTimers();
    
    // Reset fiber state
    setWipFiber(null);
    setCurrentRoot(null);
    resetRootContainer();
    
    // Reset rootContainer in fiber module
    if (typeof window !== 'undefined') {
      window.minireact = {
        deletions: null,
        scheduleRerender: null,
        wipFiber: null,
        hookIndex: 0
      };
    }
  });

  afterEach(async () => {
    // Clean up any pending timers or callbacks
    jest.runAllTimers();
    
    cleanupContainer(container);
    jest.useRealTimers();
    setWipFiber(null);
    setCurrentRoot(null);
    resetRootContainer();
    
    // Reset global state
    if (typeof window !== 'undefined') {
      window.minireact = {
        deletions: null,
        scheduleRerender: null,
        wipFiber: null,
        hookIndex: 0
      };
    }
    
    // Wait for any remaining async operations
    await new Promise(resolve => setTimeout(resolve, 0));
  });

  describe('fiber state management', () => {
    test('getWipFiber and setWipFiber work correctly', () => {
      expect(getWipFiber()).toBeNull();
      
      const fiber = { type: 'div', props: {} };
      setWipFiber(fiber);
      
      expect(getWipFiber()).toBe(fiber);
    });

    test('hook index management', () => {
      const fiber = { hooks: [] };
      setWipFiber(fiber);
      setHookIndex(0);
      
      expect(getHookIndex()).toBe(0);
      
      incrementHookIndex();
      expect(getHookIndex()).toBe(1);
      
      incrementHookIndex();
      expect(getHookIndex()).toBe(2);
    });

    test('getCurrentRoot and setCurrentRoot work correctly', () => {
      expect(getCurrentRoot()).toBeNull();
      
      const root = { type: 'root', child: null };
      setCurrentRoot(root);
      
      expect(getCurrentRoot()).toBe(root);
    });
  });

  describe('render function', () => {
    test('initiates render with element and container', () => {
      const element = createElement('div', { id: 'test' }, 'Hello');
      
      act(() => {
        render(element, container);
      });
      
      expect(container.firstChild).toBeTruthy();
      expect(container.firstChild.id).toBe('test');
      expect(container.textContent).toBe('Hello');
    });

    test('handles null element', () => {
      act(() => {
        render(null, container);
      });
      
      expect(container.firstChild).toBeFalsy();
    });

    test('replaces previous content', () => {
      const element1 = createElement('div', null, 'First');
      const element2 = createElement('span', null, 'Second');
      
      act(() => {
        render(element1, container);
      });
      
      expect(container.firstChild.tagName).toBe('DIV');
      expect(container.textContent).toBe('First');
      
      act(() => {
        render(element2, container);
      });
      
      expect(container.firstChild.tagName).toBe('SPAN');
      expect(container.textContent).toBe('Second');
    });

    test('creates proper fiber structure', () => {
      const element = createElement('div', null,
        createElement('span', null, 'child1'),
        createElement('p', null, 'child2')
      );
      
      act(() => {
        render(element, container);
      });
      
      const root = getCurrentRoot();
      expect(root).toBeTruthy();
      expect(root.child).toBeTruthy();
      expect(root.child.type).toBe('div');
    });
  });

  describe('work loop and scheduling', () => {
    test('schedules work with requestIdleCallback', () => {
      const element = createElement('div', null, 'Test');
      
      // Reset mock before the test
      global.requestIdleCallback.mockClear();
      
      // Call render directly to check if requestIdleCallback gets called
      render(element, container);
      
      // Check immediately after render (before act processes callbacks)
      expect(global.requestIdleCallback).toHaveBeenCalled();
      
      // Now process the scheduled work
      act(() => {});
    });

    test('processes work units', () => {
      const element = createElement('div', null,
        createElement('span', null, 'A'),
        createElement('span', null, 'B'),
        createElement('span', null, 'C')
      );
      
      act(() => {
        render(element, container);
      });
      
      expect(container.children).toHaveLength(1);
      expect(container.firstChild.children).toHaveLength(3);
    });

    test('handles interrupted work', () => {
      const elements = [];
      for (let i = 0; i < 100; i++) {
        elements.push(createElement('div', { key: i }, `Item ${i}`));
      }
      const element = createElement('div', null, ...elements);
      
      act(() => {
        render(element, container);
      });
      
      expect(container.firstChild.children).toHaveLength(100);
    });
  });

  describe('fiber tree traversal', () => {
    test('traverses children correctly', () => {
      const element = createElement('div', null,
        createElement('span', null,
          createElement('a', null, 'link')
        ),
        createElement('p', null, 'paragraph')
      );
      
      act(() => {
        render(element, container);
      });
      
      const div = container.firstChild;
      expect(div.tagName).toBe('DIV');
      expect(div.children[0].tagName).toBe('SPAN');
      expect(div.children[0].children[0].tagName).toBe('A');
      expect(div.children[1].tagName).toBe('P');
    });

    test('handles sibling relationships', () => {
      const element = createElement('ul', null,
        createElement('li', null, 'Item 1'),
        createElement('li', null, 'Item 2'),
        createElement('li', null, 'Item 3')
      );
      
      act(() => {
        render(element, container);
      });
      
      const list = container.firstChild;
      expect(list.children).toHaveLength(3);
      expect(list.children[0].textContent).toBe('Item 1');
      expect(list.children[1].textContent).toBe('Item 2');
      expect(list.children[2].textContent).toBe('Item 3');
    });
  });

  describe('re-renders', () => {
    test('updates existing elements', () => {
      const element1 = createElement('div', { className: 'old' }, 'Old Text');
      const element2 = createElement('div', { className: 'new' }, 'New Text');
      
      act(() => {
        render(element1, container);
      });
      
      expect(container.firstChild.className).toBe('old');
      expect(container.textContent).toBe('Old Text');
      
      act(() => {
        render(element2, container);
      });
      
      expect(container.firstChild.className).toBe('new');
      expect(container.textContent).toBe('New Text');
    });

    test('adds new elements', () => {
      const element1 = createElement('div', null,
        createElement('span', { key: '1' }, 'A')
      );
      const element2 = createElement('div', null,
        createElement('span', { key: '1' }, 'A'),
        createElement('span', { key: '2' }, 'B')
      );
      
      act(() => {
        render(element1, container);
      });
      
      expect(container.firstChild.children).toHaveLength(1);
      
      act(() => {
        render(element2, container);
      });
      
      expect(container.firstChild.children).toHaveLength(2);
      expect(container.firstChild.children[1].textContent).toBe('B');
    });

    test('removes elements', () => {
      const element1 = createElement('div', null,
        createElement('span', { key: '1' }, 'A'),
        createElement('span', { key: '2' }, 'B')
      );
      const element2 = createElement('div', null,
        createElement('span', { key: '1' }, 'A')
      );
      
      act(() => {
        render(element1, container);
      });
      
      expect(container.firstChild.children).toHaveLength(2);
      
      act(() => {
        render(element2, container);
      });
      
      expect(container.firstChild.children).toHaveLength(1);
      expect(container.firstChild.textContent).toBe('A');
    });
  });

  describe('function components', () => {
    test('renders function components', () => {
      const Component = ({ text }) => createElement('div', null, text);
      const element = createElement(Component, { text: 'Hello' });
      
      act(() => {
        render(element, container);
      });
      
      expect(container.firstChild.tagName).toBe('DIV');
      expect(container.textContent).toBe('Hello');
    });

    test('updates function component props', () => {
      const Component = ({ text }) => createElement('div', null, text);
      
      act(() => {
        render(createElement(Component, { text: 'Initial' }), container);
      });
      
      expect(container.textContent).toBe('Initial');
      
      act(() => {
        render(createElement(Component, { text: 'Updated' }), container);
      });
      
      expect(container.textContent).toBe('Updated');
    });

    test('handles nested function components', () => {
      const Child = ({ text }) => createElement('span', null, text);
      const Parent = ({ prefix }) => createElement('div', null,
        createElement(Child, { text: `${prefix} World` })
      );
      
      act(() => {
        render(createElement(Parent, { prefix: 'Hello' }), container);
      });
      
      expect(container.firstChild.tagName).toBe('DIV');
      expect(container.firstChild.firstChild.tagName).toBe('SPAN');
      expect(container.textContent).toBe('Hello World');
    });
  });
});