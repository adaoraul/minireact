import { commitRoot, runEffects } from '../../../src/core/commit.js';
import { EFFECT_TAGS } from '../../../src/core/constants.js';
import { createDom } from '../../../src/vdom/updateDom.js';

describe('commitRoot', () => {
  let container;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.removeChild(container);
  });

  describe('DOM mutations', () => {
    test('places new elements in DOM', () => {
      const fiber = {
        type: 'div',
        props: { id: 'test' },
        dom: createDom({ type: 'div', props: { id: 'test' } }),
        effectTag: EFFECT_TAGS.PLACEMENT,
        parent: null,
        child: null,
        sibling: null,
        return: null
      };

      const wipRoot = {
        dom: container,
        child: fiber,
        alternate: null
      };
      fiber.return = wipRoot;
      fiber.parent = wipRoot;

      commitRoot(wipRoot, []);

      expect(container.firstChild).toBe(fiber.dom);
      expect(container.firstChild.id).toBe('test');
    });

    test('updates existing elements', () => {
      const existingDom = document.createElement('div');
      existingDom.className = 'old';
      container.appendChild(existingDom);

      const fiber = {
        type: 'div',
        props: { className: 'new' },
        dom: existingDom,
        effectTag: EFFECT_TAGS.UPDATE,
        alternate: {
          props: { className: 'old' }
        },
        parent: null,
        child: null,
        sibling: null,
        return: null
      };

      const wipRoot = {
        dom: container,
        child: fiber,
        alternate: null
      };
      fiber.return = wipRoot;
      fiber.parent = wipRoot;

      commitRoot(wipRoot, []);

      expect(existingDom.className).toBe('new');
    });

    test('deletes removed elements', () => {
      const domToDelete = document.createElement('span');
      container.appendChild(domToDelete);

      const deletionFiber = {
        type: 'span',
        dom: domToDelete,
        parent: { dom: container },
        return: { dom: container }
      };

      const wipRoot = {
        dom: container,
        child: null,
        alternate: null
      };

      commitRoot(wipRoot, [deletionFiber]);

      expect(container.contains(domToDelete)).toBe(false);
    });

    test('commits nested structure', () => {
      const parentDom = createDom({ type: 'div', props: {} });
      const childDom = createDom({ type: 'span', props: {} });
      const grandchildDom = createDom({ type: 'p', props: {} });

      const grandchild = {
        type: 'p',
        dom: grandchildDom,
        effectTag: EFFECT_TAGS.PLACEMENT,
        parent: null,
        child: null,
        sibling: null,
        return: null
      };

      const child = {
        type: 'span',
        dom: childDom,
        effectTag: EFFECT_TAGS.PLACEMENT,
        child: grandchild,
        sibling: null,
        parent: null,
        return: null
      };

      const parent = {
        type: 'div',
        dom: parentDom,
        effectTag: EFFECT_TAGS.PLACEMENT,
        child: child,
        sibling: null,
        parent: null,
        return: null
      };

      const wipRoot = {
        dom: container,
        child: parent,
        alternate: null
      };

      parent.return = wipRoot;
      parent.parent = wipRoot;
      child.return = parent;
      child.parent = parent;
      grandchild.return = child;
      grandchild.parent = child;

      commitRoot(wipRoot, []);

      expect(container.firstChild).toBe(parentDom);
      expect(parentDom.firstChild).toBe(childDom);
      expect(childDom.firstChild).toBe(grandchildDom);
    });

    test('commits siblings', () => {
      const sibling1Dom = createDom({ type: 'div', props: {} });
      const sibling2Dom = createDom({ type: 'span', props: {} });
      const sibling3Dom = createDom({ type: 'p', props: {} });

      const sibling3 = {
        type: 'p',
        dom: sibling3Dom,
        effectTag: EFFECT_TAGS.PLACEMENT,
        child: null,
        sibling: null,
        parent: null,
        return: null
      };

      const sibling2 = {
        type: 'span',
        dom: sibling2Dom,
        effectTag: EFFECT_TAGS.PLACEMENT,
        child: null,
        sibling: sibling3,
        parent: null,
        return: null
      };

      const sibling1 = {
        type: 'div',
        dom: sibling1Dom,
        effectTag: EFFECT_TAGS.PLACEMENT,
        child: null,
        sibling: sibling2,
        parent: null,
        return: null
      };

      const wipRoot = {
        dom: container,
        child: sibling1,
        alternate: null
      };

      sibling1.return = wipRoot;
      sibling1.parent = wipRoot;
      sibling2.return = wipRoot;
      sibling2.parent = wipRoot;
      sibling3.return = wipRoot;
      sibling3.parent = wipRoot;

      commitRoot(wipRoot, []);

      expect(container.children).toHaveLength(3);
      expect(container.children[0]).toBe(sibling1Dom);
      expect(container.children[1]).toBe(sibling2Dom);
      expect(container.children[2]).toBe(sibling3Dom);
    });
  });

  describe('function component handling', () => {
    test('skips function components when finding parent DOM', () => {
      const childDom = createDom({ type: 'div', props: {} });

      const child = {
        type: 'div',
        dom: childDom,
        effectTag: EFFECT_TAGS.PLACEMENT,
        child: null,
        sibling: null,
        parent: null,
        return: null
      };

      const functionComponent = {
        type: () => {},
        dom: null,
        child: child,
        sibling: null,
        parent: null,
        return: null
      };

      const wipRoot = {
        dom: container,
        child: functionComponent,
        alternate: null
      };

      functionComponent.return = wipRoot;
      functionComponent.parent = wipRoot;
      child.return = functionComponent;
      child.parent = functionComponent;

      commitRoot(wipRoot, []);

      expect(container.firstChild).toBe(childDom);
    });

    test('handles nested function components', () => {
      const leafDom = createDom({ type: 'span', props: {} });

      const leaf = {
        type: 'span',
        dom: leafDom,
        effectTag: EFFECT_TAGS.PLACEMENT,
        child: null,
        sibling: null,
        parent: null,
        return: null
      };

      const innerFunction = {
        type: () => {},
        dom: null,
        child: leaf,
        sibling: null,
        parent: null,
        return: null
      };

      const outerFunction = {
        type: () => {},
        dom: null,
        child: innerFunction,
        sibling: null,
        parent: null,
        return: null
      };

      const wipRoot = {
        dom: container,
        child: outerFunction,
        alternate: null
      };

      outerFunction.return = wipRoot;
      outerFunction.parent = wipRoot;
      innerFunction.return = outerFunction;
      innerFunction.parent = outerFunction;
      leaf.return = innerFunction;
      leaf.parent = innerFunction;

      commitRoot(wipRoot, []);

      expect(container.firstChild).toBe(leafDom);
    });
  });

  describe('deletion handling', () => {
    test('deletes function component children', () => {
      const childDom = document.createElement('div');
      container.appendChild(childDom);

      const child = {
        type: 'div',
        dom: childDom,
        child: null,
        sibling: null
      };

      const functionComponent = {
        type: () => {},
        dom: null,
        child: child,
        parent: { dom: container },
        return: { dom: container }
      };

      commitRoot({ dom: container, child: null }, [functionComponent]);

      expect(container.contains(childDom)).toBe(false);
    });

    test('deletes multiple children', () => {
      const child1Dom = document.createElement('div');
      const child2Dom = document.createElement('span');
      container.appendChild(child1Dom);
      container.appendChild(child2Dom);

      const child2 = {
        type: 'span',
        dom: child2Dom,
        child: null,
        sibling: null
      };

      const child1 = {
        type: 'div',
        dom: child1Dom,
        child: null,
        sibling: child2
      };

      const parent = {
        type: 'section',
        dom: null,
        child: child1,
        parent: { dom: container },
        return: { dom: container }
      };

      commitRoot({ dom: container, child: null }, [parent]);

      expect(container.contains(child1Dom)).toBe(false);
      expect(container.contains(child2Dom)).toBe(false);
    });
  });

  describe('effect handling', () => {
    test('runEffects executes effects after commit', () => {
      const effect = jest.fn();
      
      const fiber = {
        type: () => {},
        dom: null,
        hooks: [
          { tag: 'effect', effect, deps: [] }
        ],
        effectTag: EFFECT_TAGS.UPDATE,
        child: null,
        sibling: null,
        parent: null,
        return: null
      };

      const wipRoot = {
        dom: container,
        child: fiber,
        alternate: null
      };
      fiber.return = wipRoot;
      fiber.parent = wipRoot;

      // commitRoot just handles DOM mutations, doesn't run effects
      commitRoot(wipRoot, []);
      expect(effect).not.toHaveBeenCalled();

      // Effects are run separately by runEffects
      runEffects(wipRoot);
      expect(effect).toHaveBeenCalled();
    });

    test('runEffects runs cleanup before effects', () => {
      const cleanup = jest.fn();
      const effect = jest.fn(() => cleanup);
      
      const oldFiber = {
        type: () => {},
        hooks: [
          { tag: 'effect', effect, cleanup, deps: [] }
        ]
      };

      const fiber = {
        type: () => {},
        dom: null,
        hooks: [
          { tag: 'effect', effect, deps: [1] }
        ],
        effectTag: EFFECT_TAGS.UPDATE,
        alternate: oldFiber,
        child: null,
        sibling: null,
        parent: null,
        return: null
      };

      const wipRoot = {
        dom: container,
        child: fiber,
        alternate: { child: oldFiber }
      };
      fiber.return = wipRoot;
      fiber.parent = wipRoot;

      // commitRoot just handles DOM mutations, doesn't run effects
      commitRoot(wipRoot, []);
      expect(cleanup).not.toHaveBeenCalled();
      expect(effect).not.toHaveBeenCalled();

      // Effects are run separately by runEffects
      runEffects(wipRoot);
      expect(cleanup).toHaveBeenCalled();
      expect(effect).toHaveBeenCalled();
      expect(cleanup.mock.invocationCallOrder[0]).toBeLessThan(
        effect.mock.invocationCallOrder[0]
      );
    });

    test('runs deletion cleanups', () => {
      const cleanup = jest.fn();
      
      const deletedFiber = {
        type: () => {},
        dom: null,
        hooks: [
          { tag: 'effect', cleanup }
        ],
        child: null,
        parent: { dom: container },
        return: { dom: container }
      };

      commitRoot({ dom: container, child: null }, [deletedFiber]);

      expect(cleanup).toHaveBeenCalled();
    });
  });

  describe('currentRoot update', () => {
    test('updates currentRoot after commit', () => {
      const wipRoot = {
        dom: container,
        child: null,
        alternate: null
      };

      const result = commitRoot(wipRoot, []);

      expect(result).toBe(wipRoot);
    });

    test('preserves fiber tree structure', () => {
      const child = {
        type: 'div',
        dom: createDom({ type: 'div', props: {} }),
        effectTag: EFFECT_TAGS.PLACEMENT,
        child: null,
        sibling: null,
        parent: null,
        return: null
      };

      const wipRoot = {
        dom: container,
        child: child,
        alternate: null
      };
      child.return = wipRoot;
      child.parent = wipRoot;

      const result = commitRoot(wipRoot, []);

      expect(result.child).toBe(child);
      expect(result.dom).toBe(container);
    });
  });
});