/**
 * @fileoverview MiniReact's reconciliation algorithm
 * @module core/reconciler
 * @description
 * Implements MiniReact's reconciliation (diffing) algorithm.
 *
 * Reconciliation is the process of comparing the previous Virtual DOM tree
 * with the new one to determine the minimal changes needed on the real DOM.
 *
 * **Algorithm Principles:**
 * - Level-by-level comparison (does not compare across different levels)
 * - Different types result in a completely new subtree
 * - Keys identify unique elements in lists
 * - O(n) complexity instead of O(n³)
 *
 * **Effect Tags:**
 * - `PLACEMENT`: New element to be inserted
 * - `UPDATE`: Existing element with changed props
 * - `DELETION`: Element to be removed
 *
 * @example
 * // The reconciler is used internally by fiber
 * // It compares elements and marks changes:
 * // oldFiber: <div className="old">Hello</div>
 * // newElement: <div className="new">World</div>
 * // Result: fiber marked with UPDATE
 */

import { EFFECT_TAGS } from './constants.js';
import { createDom } from '../vdom/updateDom.js';
import { addDeletion } from './fiber.js';

/**
 * Updates a function component
 *
 * @description
 * Processes a function component, executing the component function
 * and reconciling its children with the previous Virtual DOM.
 *
 * @param {Object} fiber - Fiber of the function component
 * @param {Object} fiber.type - Component function
 * @param {Object} fiber.props - Component properties
 */
export function updateFunctionComponent(fiber) {
  // Prepare context for hooks
  // Initialize an empty hooks array - hooks are rebuilt on every render
  // Persistent state is kept by the hooks themselves (useState, etc.)
  fiber.hooks = [];

  let children;

  // Check whether it is a class component
  if (fiber.type.prototype && fiber.type.prototype.render) {
    // Class component
    let instance;

    // Reuse the existing instance or create a new one
    if (fiber.alternate && fiber.alternate.instance) {
      ({ instance } = fiber.alternate);
      instance.props = fiber.props;
    } else {
      instance = new fiber.type(fiber.props);
    }

    // Save the instance on the fiber
    instance._internalFiber = fiber;
    fiber.instance = instance;

    // Call render() to get the child elements
    children = [instance.render()];
  } else {
    // Function component
    const result = fiber.type(fiber.props);
    // Handle the case where the function component returns an array of elements
    children = Array.isArray(result) ? result : [result];
  }

  // Hook cleanup is handled by commit phase runEffects function

  reconcileChildrenWithKeys(fiber, children);
}

/**
 * Updates a host component (DOM element)
 *
 * @description
 * Processes a DOM element, creating the DOM node if necessary
 * and reconciling its children.
 *
 * @param {Object} fiber - Fiber of the DOM element
 * @param {string} fiber.type - Element type (div, span, etc)
 * @param {Object} fiber.props - Element properties and children
 */
export function updateHostComponent(fiber) {
  // Create the DOM node if it doesn't exist, or reuse it from the previous fiber ONLY if it's the same type
  if (!fiber.dom) {
    if (fiber.alternate && fiber.alternate.dom &&
        (!fiber.alternate.type || fiber.alternate.type === fiber.type)) {
      // Reuse the DOM from the previous fiber only if it's the same type, or the type isn't specified
      fiber.dom = fiber.alternate.dom;
    } else {
      // Create a new DOM node (new element or the type changed)
      fiber.dom = createDom(fiber);
    }
  }
  // Reconcile children
  reconcileChildrenWithKeys(fiber, fiber.props.children);
}

/**
 * Reconciles a fiber's children with new elements by position
 *
 * @description
 * Reconciliation algorithm that compares the previous fiber tree
 * with the new elements purely by position, determining which DOM
 * operations are needed. Marks fibers with effect tags: PLACEMENT,
 * UPDATE, or DELETION.
 *
 * `updateFunctionComponent` and `updateHostComponent` use
 * {@link reconcileChildrenWithKeys} instead, since matching by key keeps
 * list items paired with their own state/DOM node when the list is
 * reordered. This positional version is kept for cases with no keys
 * and for direct testing.
 *
 * @param {Object} wipFiber - Parent fiber being processed
 * @param {Array} elements - New child elements
 *
 * @example
 * // Positional reconciliation (no keys)
 * reconcileChildren(parentFiber, [
 *   createElement('div', null, 'Hello'),
 *   createElement('span', null, 'World')
 * ]);
 */
export function reconcileChildren(wipFiber, elements) {
  let index = 0;
  let oldFiber = wipFiber.alternate && wipFiber.alternate.child;
  let prevSibling = null;

  // Initialize the deletions list if it doesn't exist
  if (!wipFiber.deletions) {
    wipFiber.deletions = [];
  }

  // Iterate over new elements and old fibers in parallel
  while (index < elements.length || oldFiber != null) {
    const element = elements[index];
    let newFiber = null;

    // Check whether the type is the same, to reuse the fiber
    const sameType = oldFiber && element && element.type === oldFiber.type;


    if (sameType) {
      // UPDATE: same type, update properties
      newFiber = {
        type: oldFiber.type,
        props: element.props,
        dom: oldFiber.dom,
        parent: wipFiber,
        return: wipFiber,
        alternate: oldFiber,
        effectTag: EFFECT_TAGS.UPDATE,
      };
    }

    if (element && !sameType) {
      // INSERTION: new element
      newFiber = {
        type: element.type,
        props: element.props,
        dom: null,
        parent: wipFiber,
        return: wipFiber,
        alternate: null,
        effectTag: EFFECT_TAGS.PLACEMENT,
      };
    }

    if (oldFiber && !sameType) {
      // DELETION: removed element
      oldFiber.effectTag = EFFECT_TAGS.DELETION;

      // Add to the wipFiber's local deletions list
      wipFiber.deletions.push(oldFiber);

      // Also add to the global deletions list
      addDeletion(oldFiber);
    }

    // Move to the next old fiber
    if (oldFiber) {
      oldFiber = oldFiber.sibling;
    }

    // Attach the new fiber to the tree
    if (index === 0) {
      wipFiber.child = newFiber;
    } else if (element) {
      prevSibling.sibling = newFiber;
    }

    // Explicitly set sibling to null if there are no more elements
    if (newFiber && index === elements.length - 1) {
      newFiber.sibling = null;
    }

    prevSibling = newFiber;
    index++;
  }
}

/**
 * Reconciles children with key support
 *
 * @description
 * Optimized version of reconciliation that uses keys to identify
 * unique elements in lists, allowing efficient reordering. Elements
 * without a key fall back to matching by their position in the list,
 * so this is a drop-in replacement for {@link reconcileChildren}.
 *
 * This is the version actually used by `updateFunctionComponent` and
 * `updateHostComponent` during rendering.
 *
 * @param {Object} wipFiber - Parent fiber being processed
 * @param {Array} elements - New child elements
 *
 * @example
 * // Elements with keys for an optimized list
 * const items = data.map(item =>
 *   createElement('li', { key: item.id }, item.text)
 * );
 */
export function reconcileChildrenWithKeys(wipFiber, elements) {
  let index = 0;
  const oldFiber = wipFiber.alternate && wipFiber.alternate.child;
  let prevSibling = null;

  // Initialize the deletions list if it doesn't exist
  if (!wipFiber.deletions) {
    wipFiber.deletions = [];
  }

  // Build a map of old fibers by key for efficient lookup
  const oldFiberMap = new Map();
  let temp = oldFiber;
  let tempIndex = 0;

  while (temp) {
    const key = temp.props?.key ?? tempIndex;
    oldFiberMap.set(key, temp);
    temp = temp.sibling;
    tempIndex++;
  }

  // Process new elements
  while (index < elements.length) {
    const element = elements[index];
    const elementKey = element?.props?.key ?? index;
    const matchingOldFiber = oldFiberMap.get(elementKey);

    let newFiber = null;
    const sameType = matchingOldFiber && element && element.type === matchingOldFiber.type;

    if (sameType) {
      // Reuse the existing fiber
      newFiber = {
        type: matchingOldFiber.type,
        props: element.props,
        dom: matchingOldFiber.dom,
        parent: wipFiber,
        return: wipFiber,
        alternate: matchingOldFiber,
        effectTag: EFFECT_TAGS.UPDATE,
      };
      oldFiberMap.delete(elementKey);
    } else if (element) {
      // Create a new fiber
      newFiber = {
        type: element.type,
        props: element.props,
        dom: null,
        parent: wipFiber,
        return: wipFiber,
        alternate: null,
        effectTag: EFFECT_TAGS.PLACEMENT,
      };
    }

    // Attach the fiber to the tree
    if (index === 0) {
      wipFiber.child = newFiber;
    } else {
      prevSibling.sibling = newFiber;
    }

    // Explicitly set sibling to null if there are no more elements
    if (newFiber && index === elements.length - 1) {
      newFiber.sibling = null;
    }

    prevSibling = newFiber;
    index++;
  }

  // Mark unused fibers for deletion
  oldFiberMap.forEach((fiber) => {
    fiber.effectTag = EFFECT_TAGS.DELETION;

    // Add to the wipFiber's local deletions list
    wipFiber.deletions.push(fiber);

    // Also add to the global deletions list
    if (typeof window !== 'undefined') {
      if (!window.minireact.deletions) window.minireact.deletions = [];
      window.minireact.deletions.push(fiber);
    }
  });
}

/**
 * Information about the Reconciliation algorithm
 *
 * @description
 * Reconciliation is the process of comparing the previous Virtual DOM tree
 * with the new tree to determine the minimal changes needed on the real DOM.
 *
 * Core principles:
 *
 * 1. **Level-by-level comparison**: Compares elements at the same tree level
 * 2. **Different types = new subtree**: If the type changed, the whole subtree is recreated
 * 3. **Keys for lists**: Identifies unique elements in lists for efficient reordering
 *
 * Reconciliation process:
 *
 * 1. **Type comparison**:
 *    - Same type: Update properties (UPDATE)
 *    - Different type: Remove the old one and create a new one (DELETION + PLACEMENT)
 *
 * 2. **Children reconciliation**:
 *    - Iterates new and old children in parallel
 *    - Uses keys when available for optimized matching
 *    - Marks required operations with effectTags
 *
 * 3. **Effect Tags**:
 *    - PLACEMENT: Insert new element
 *    - UPDATE: Update properties
 *    - DELETION: Remove element
 *
 * Implemented optimizations:
 *
 * - **DOM node reuse**: Keeps DOM references whenever possible
 * - **Batching**: Accumulates changes to apply them all at once
 * - **Keys**: Enables efficient reordering of lists
 * - **Bailout**: Stops reconciliation if there are no changes
 *
 * Complexity:
 * - Without keys: O(n) where n = number of elements
 * - With keys: O(n) with a better constant factor for reordering
 *
 * Differences from real React:
 * - React uses more sophisticated heuristics
 * - React has optimizations for pure components
 * - React supports Suspense and concurrent features
 */
