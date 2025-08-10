import {
  updateFunctionComponent,
  updateHostComponent,
  reconcileChildren,
  reconcileChildrenWithKeys
} from '../../../src/core/reconciler.js';
import { setWipFiber } from '../../../src/core/fiber.js';
import { createElement } from '../../../src/vdom/createElement.js';
import { EFFECT_TAGS } from '../../../src/core/constants.js';

describe('Reconciler', () => {
  describe('updateFunctionComponent', () => {
    beforeEach(() => {
      setWipFiber(null);
    });

    test('calls function component and reconciles children', () => {
      const Component = jest.fn(({ text }) => 
        createElement('div', null, text)
      );
      
      const fiber = {
        type: Component,
        props: { text: 'Hello' },
        alternate: null
      };
      
      updateFunctionComponent(fiber);
      
      expect(Component).toHaveBeenCalledWith({ text: 'Hello' });
      expect(fiber.child).toBeTruthy();
      expect(fiber.child.type).toBe('div');
    });

    test('sets wipFiber correctly', () => {
      const Component = () => createElement('div', null);
      const fiber = {
        type: Component,
        props: {},
        alternate: null
      };
      
      updateFunctionComponent(fiber);
      
      expect(fiber.hooks).toEqual([]);
    });

    test('rebuilds hooks array from scratch each render', () => {
      const existingHooks = [{ state: 'value' }];
      const Component = () => createElement('div', null);
      
      const fiber = {
        type: Component,
        props: {},
        alternate: {
          hooks: existingHooks
        }
      };
      
      updateFunctionComponent(fiber);
      
      // Hooks array should be rebuilt from scratch (not reused from alternate)
      // The actual state persistence is handled by the hook's own storage system
      expect(fiber.hooks).not.toBe(existingHooks);
      expect(Array.isArray(fiber.hooks)).toBe(true);
    });

    test('handles multiple children from function component', () => {
      const Component = () => [
        createElement('span', { key: '1' }, 'A'),
        createElement('span', { key: '2' }, 'B')
      ];
      
      const fiber = {
        type: Component,
        props: {},
        alternate: null
      };
      
      updateFunctionComponent(fiber);
      
      expect(fiber.child).toBeTruthy();
      expect(fiber.child.type).toBe('span');
      expect(fiber.child.sibling).toBeTruthy();
      expect(fiber.child.sibling.type).toBe('span');
    });
  });

  describe('updateHostComponent', () => {
    test('creates dom for new fiber', () => {
      const fiber = {
        type: 'div',
        props: { id: 'test', children: [] },
        dom: null,
        alternate: null
      };
      
      updateHostComponent(fiber);
      
      expect(fiber.dom).toBeTruthy();
      expect(fiber.dom.tagName).toBe('DIV');
      expect(fiber.dom.id).toBe('test');
    });

    test('reuses dom from alternate fiber', () => {
      const existingDom = document.createElement('div');
      const fiber = {
        type: 'div',
        props: { children: [] },
        dom: null,
        alternate: {
          dom: existingDom
        }
      };
      
      updateHostComponent(fiber);
      
      expect(fiber.dom).toBe(existingDom);
    });

    test('reconciles children elements', () => {
      const fiber = {
        type: 'div',
        props: {
          children: [
            createElement('span', null, 'child1'),
            createElement('p', null, 'child2')
          ]
        },
        dom: document.createElement('div'),
        alternate: null
      };
      
      updateHostComponent(fiber);
      
      expect(fiber.child).toBeTruthy();
      expect(fiber.child.type).toBe('span');
      expect(fiber.child.sibling.type).toBe('p');
    });
  });

  describe('reconcileChildren', () => {
    test('creates new fibers for elements without alternates', () => {
      const wipFiber = {
        alternate: null
      };
      
      const elements = [
        createElement('div', null, 'A'),
        createElement('span', null, 'B')
      ];
      
      reconcileChildren(wipFiber, elements);
      
      expect(wipFiber.child).toBeTruthy();
      expect(wipFiber.child.type).toBe('div');
      expect(wipFiber.child.effectTag).toBe(EFFECT_TAGS.PLACEMENT);
      expect(wipFiber.child.sibling.type).toBe('span');
      expect(wipFiber.child.sibling.effectTag).toBe(EFFECT_TAGS.PLACEMENT);
    });

    test('updates existing fibers when types match', () => {
      const oldChild = {
        type: 'div',
        props: { id: 'old' },
        dom: document.createElement('div'),
        sibling: null
      };
      
      const wipFiber = {
        alternate: {
          child: oldChild
        }
      };
      
      const elements = [
        createElement('div', { id: 'new' }, 'Updated')
      ];
      
      reconcileChildren(wipFiber, elements);
      
      expect(wipFiber.child.type).toBe('div');
      expect(wipFiber.child.effectTag).toBe(EFFECT_TAGS.UPDATE);
      expect(wipFiber.child.alternate).toBe(oldChild);
      expect(wipFiber.child.dom).toBe(oldChild.dom);
    });

    test('replaces fibers when types differ', () => {
      const oldChild = {
        type: 'div',
        props: {},
        dom: document.createElement('div'),
        sibling: null
      };
      
      const wipFiber = {
        alternate: {
          child: oldChild
        },
        deletions: []
      };
      
      const elements = [
        createElement('span', null, 'New')
      ];
      
      reconcileChildren(wipFiber, elements);
      
      expect(wipFiber.child.type).toBe('span');
      expect(wipFiber.child.effectTag).toBe(EFFECT_TAGS.PLACEMENT);
      expect(wipFiber.deletions).toContain(oldChild);
    });

    test('marks extra old fibers for deletion', () => {
      const child1 = {
        type: 'div',
        props: {},
        sibling: {
          type: 'span',
          props: {},
          sibling: null
        }
      };
      
      const wipFiber = {
        alternate: { child: child1 },
        deletions: []
      };
      
      const elements = [
        createElement('div', null)
      ];
      
      reconcileChildren(wipFiber, elements);
      
      expect(wipFiber.child.type).toBe('div');
      expect(wipFiber.child.sibling).toBeNull();
      expect(wipFiber.deletions).toHaveLength(1);
      expect(wipFiber.deletions[0].type).toBe('span');
    });

    test('sets parent and return pointers correctly', () => {
      const wipFiber = {
        alternate: null
      };
      
      const elements = [
        createElement('div', null),
        createElement('span', null)
      ];
      
      reconcileChildren(wipFiber, elements);
      
      expect(wipFiber.child.parent).toBe(wipFiber);
      expect(wipFiber.child.return).toBe(wipFiber);
      expect(wipFiber.child.sibling.parent).toBe(wipFiber);
      expect(wipFiber.child.sibling.return).toBe(wipFiber);
    });
  });

  describe('reconcileChildrenWithKeys', () => {
    test('matches elements by key', () => {
      const oldChildren = new Map([
        ['a', { type: 'div', props: { key: 'a' }, dom: document.createElement('div') }],
        ['b', { type: 'span', props: { key: 'b' }, dom: document.createElement('span') }]
      ]);
      
      const child1 = oldChildren.get('a');
      child1.sibling = oldChildren.get('b');
      
      const wipFiber = {
        alternate: { child: child1 },
        deletions: []
      };
      
      const elements = [
        createElement('span', { key: 'b' }, 'B'),
        createElement('div', { key: 'a' }, 'A')
      ];
      
      reconcileChildrenWithKeys(wipFiber, elements);
      
      expect(wipFiber.child.props.key).toBe('b');
      expect(wipFiber.child.type).toBe('span');
      expect(wipFiber.child.effectTag).toBe(EFFECT_TAGS.UPDATE);
      
      expect(wipFiber.child.sibling.props.key).toBe('a');
      expect(wipFiber.child.sibling.type).toBe('div');
      expect(wipFiber.child.sibling.effectTag).toBe(EFFECT_TAGS.UPDATE);
    });

    test('creates new fibers for elements with new keys', () => {
      const oldChild = {
        type: 'div',
        props: { key: 'a' },
        sibling: null
      };
      
      const wipFiber = {
        alternate: { child: oldChild },
        deletions: []
      };
      
      const elements = [
        createElement('div', { key: 'a' }, 'A'),
        createElement('span', { key: 'b' }, 'B')
      ];
      
      reconcileChildrenWithKeys(wipFiber, elements);
      
      expect(wipFiber.child.props.key).toBe('a');
      expect(wipFiber.child.effectTag).toBe(EFFECT_TAGS.UPDATE);
      
      expect(wipFiber.child.sibling.props.key).toBe('b');
      expect(wipFiber.child.sibling.effectTag).toBe(EFFECT_TAGS.PLACEMENT);
    });

    test('deletes old fibers with missing keys', () => {
      const child1 = {
        type: 'div',
        props: { key: 'a' },
        sibling: {
          type: 'span',
          props: { key: 'b' },
          sibling: null
        }
      };
      
      const wipFiber = {
        alternate: { child: child1 },
        deletions: []
      };
      
      const elements = [
        createElement('div', { key: 'a' }, 'A')
      ];
      
      reconcileChildrenWithKeys(wipFiber, elements);
      
      expect(wipFiber.child.props.key).toBe('a');
      expect(wipFiber.child.sibling).toBeNull();
      expect(wipFiber.deletions).toHaveLength(1);
      expect(wipFiber.deletions[0].props.key).toBe('b');
    });

    test('handles elements without keys', () => {
      const wipFiber = {
        alternate: null,
        deletions: []
      };
      
      const elements = [
        createElement('div', null, 'A'),
        createElement('span', null, 'B')
      ];
      
      reconcileChildrenWithKeys(wipFiber, elements);
      
      expect(wipFiber.child).toBeTruthy();
      expect(wipFiber.child.type).toBe('div');
      expect(wipFiber.child.sibling.type).toBe('span');
    });

    test('handles mixed keyed and non-keyed elements', () => {
      const oldChild = {
        type: 'div',
        props: { key: 'a' },
        sibling: {
          type: 'span',
          props: {},
          sibling: null
        }
      };
      
      const wipFiber = {
        alternate: { child: oldChild },
        deletions: []
      };
      
      const elements = [
        createElement('p', null, 'No key'),
        createElement('div', { key: 'a' }, 'A'),
        createElement('section', { key: 'c' }, 'C')
      ];
      
      reconcileChildrenWithKeys(wipFiber, elements);
      
      expect(wipFiber.child.type).toBe('p');
      expect(wipFiber.child.sibling.props.key).toBe('a');
      expect(wipFiber.child.sibling.sibling.props.key).toBe('c');
    });
  });
});