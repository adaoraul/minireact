/**
 * @fileoverview Commit phase - applying changes to the real DOM
 * @module core/commit
 * @description
 * Manages the commit phase of MiniReact's rendering process.
 *
 * The commit phase runs after the reconciliation phase and is responsible
 * for applying all accumulated changes to the real DOM synchronously.
 *
 * **Characteristics of the Commit Phase:**
 * - **Synchronous**: Cannot be interrupted, runs to completion
 * - **Guaranteed order**: Processes changes in the correct tree order
 * - **Batch updates**: Applies all changes at once
 * - **Side effects**: Runs effects after DOM changes
 *
 * **Execution Order:**
 * 1. Processes deletions (removes elements)
 * 2. Applies insertions and updates
 * 3. Runs effects (useEffect)
 * 4. Stores cleanup functions
 *
 * @example
 * // The commit phase runs automatically after reconciliation
 * // When commitRoot is called:
 * // 1. Removes: <div id="old" />
 * // 2. Inserts: <span id="new">Hello</span>
 * // 3. Updates: <p className="updated">World</p>
 * // 4. Runs: useEffect callbacks
 */

import { EFFECT_TAGS } from './constants.js';
import { updateDom, setRef } from '../vdom/updateDom.js';

/**
 * Runs the commit phase
 *
 * @description
 * Applies all changes accumulated during the render phase
 * to the real DOM. This phase cannot be interrupted and runs
 * synchronously to guarantee visual consistency.
 *
 * @param {Object} wipRoot - Root of the work-in-progress fiber tree
 * @param {Array} deletions - List of fibers to be deleted
 */
export function commitRoot(wipRoot, deletions) {
  // Process deletions first
  if (deletions) {
    deletions.forEach(deletion => {
      // Find parent DOM node for deletion
      let domParentFiber = deletion.parent || deletion.return;
      while (domParentFiber && !domParentFiber.dom) {
        domParentFiber = domParentFiber.parent || domParentFiber.return;
      }
      const domParent = domParentFiber?.dom;
      commitDeletion(deletion, domParent);
    });
  }

  // Process changes in the tree
  commitWork(wipRoot.child);

  // NOTE: Effects are now run by the workLoop after currentRoot is set
  // to ensure proper timing and avoid duplicate execution

  // Return the root to be used as currentRoot
  return wipRoot;
}

/**
 * Applies a fiber's changes to the DOM
 *
 * @description
 * Processes a fiber and its descendants, applying the necessary
 * changes to the DOM based on each fiber's effectTag.
 *
 * @param {Object} fiber - Fiber to be processed
 * @param {string} fiber.effectTag - Operation type (PLACEMENT, UPDATE, DELETION)
 * @param {HTMLElement} fiber.dom - Associated DOM element
 */
function commitWork(fiber) {
  if (!fiber) {
    return;
  }


  // For deletions, find the parent from the fiber's own parent/return property
  if (fiber.effectTag === EFFECT_TAGS.DELETION) {
    // Find parent DOM node for deletion
    let domParentFiber = fiber.parent || fiber.return;
    while (domParentFiber && !domParentFiber.dom) {
      domParentFiber = domParentFiber.parent || domParentFiber.return;
    }
    const domParent = domParentFiber?.dom;
    commitDeletion(fiber, domParent);
    return; // Skip processing children/siblings for deleted elements
  }

  // For non-deletions, find the parent normally
  let domParentFiber = fiber.parent;
  while (domParentFiber && !domParentFiber.dom) {
    domParentFiber = domParentFiber.parent;
  }
  const domParent = domParentFiber?.dom;

  // UPDATE: patch properties of the existing element
  if (fiber.effectTag === EFFECT_TAGS.UPDATE && fiber.dom != null) {
    updateDom(fiber.dom, fiber.alternate.props, fiber.props);
  }

  // Keep DOM order in sync with fiber order. This walk visits fibers in the
  // same order reconciliation placed them in the new tree, and appendChild on
  // a node already in the document moves it - so re-appending every placed or
  // updated node as we go settles each parent's children into their correct
  // final order. This is what makes key-based list reordering actually move
  // nodes, rather than just patching each position's content in place.
  if (fiber.dom != null && domParent) {
    domParent.appendChild(fiber.dom);
  }

  // Process children and siblings recursively (only if not deleted)
  commitWork(fiber.child);
  commitWork(fiber.sibling);
}

/**
 * Removes a fiber and its own descendants from the DOM
 *
 * @description
 * Removes elements from the DOM, giving special treatment to function
 * components that don't have their own DOM node, descending until
 * finding elements with a DOM node to remove.
 *
 * Every fiber that needs to be removed is already listed individually in
 * `deletions` by the reconciler, so this only ever recurses into a deleted
 * fiber's own children (never into its sibling) - a fiber's sibling is a
 * separate, independently-tracked node that may have been reused elsewhere
 * in the new tree, not something implied by this deletion.
 *
 * @param {Object} fiber - Fiber to be removed
 * @param {HTMLElement} domParent - Parent element in the DOM
 */
function commitDeletion(fiber, domParent) {
  if (!fiber) {
    return;
  }

  if (fiber.dom) {
    // Element with its own DOM node: remove it directly
    if (domParent && domParent.contains(fiber.dom)) {
      // Run effect cleanup and clear the ref before removing
      cleanupEffects(fiber);
      setRef(fiber.props?.ref, null);
      domParent.removeChild(fiber.dom);
    }
    return;
  }

  // Function/class component: no DOM of its own - clean up its effects and
  // descend into each of its own children (a component can render more than
  // one top-level child, linked via the sibling chain) to remove theirs
  cleanupEffects(fiber);
  let { child } = fiber;
  while (child) {
    commitDeletion(child, domParent);
    child = child.sibling;
  }
}

/**
 * Runs effects after DOM changes
 *
 * @description
 * Walks the fiber tree running effects (useEffect) that have been
 * marked for execution. Cleans up previous effects if needed
 * and runs new effects.
 *
 * @param {Object} fiber - Root fiber to run effects on
 */
export function runEffects(fiber) {
  if (!fiber) return;

  // Run effects for the current fiber
  if (fiber.hooks) {
    // First: run all cleanups for the old hooks
    fiber.hooks.forEach((hook, index) => {
      if (hook.tag === 'effect') {
        const oldHook = fiber.alternate && fiber.alternate.hooks && fiber.alternate.hooks[index];

        // Check if we should run cleanup - if deps changed and old hook has cleanup
        const shouldRunCleanup = oldHook && oldHook.cleanup && (
          !hook.deps || // No deps means always run
          !oldHook.deps || // Old hook had no deps
          depsChanged(oldHook.deps, hook.deps) // Deps changed
        );

        if (shouldRunCleanup) {
          try {
            oldHook.cleanup();
          } catch (error) {
            console.error(`Error in useEffect cleanup at index ${index}:`, error);
          }
        }
      }
    });

    // Second: run all new effects
    fiber.hooks.forEach((hook, index) => {
      if (hook.tag === 'effect') {
        // Check if we should run effect - if deps changed or no deps or first time
        const oldHook = fiber.alternate && fiber.alternate.hooks && fiber.alternate.hooks[index];
        const shouldRunEffect = !hook.deps || // No deps means always run
          !oldHook || // First time
          depsChanged(oldHook.deps, hook.deps);

        if (shouldRunEffect && hook.effect) {
          try {
            const cleanup = hook.effect();
            // Update the hook's cleanup
            if (typeof cleanup === 'function') {
              hook.cleanup = cleanup;
            } else {
              hook.cleanup = null;
            }
          } catch (error) {
            console.error(`Error in useEffect at index ${index}:`, error);
          }
        }
      }
    });
  }

  // Run effects for the descendants
  runEffects(fiber.child);
  runEffects(fiber.sibling);
}

/**
 * Checks whether an effect's dependencies changed
 */
function depsChanged(prevDeps, nextDeps) {
  if (!prevDeps || !nextDeps) return true;
  if (prevDeps.length !== nextDeps.length) return true;
  return prevDeps.some((dep, i) => !Object.is(dep, nextDeps[i]));
}

/**
 * Cleans up effects for a fiber being removed
 *
 * @description
 * Runs cleanup functions for all effects of a fiber
 * before it is removed from the DOM. Important to prevent
 * memory leaks.
 *
 * @param {Object} fiber - Fiber being removed
 */
function cleanupEffects(fiber) {
  if (!fiber) return;

  // Clean up effects for the current fiber
  if (fiber.hooks) {
    fiber.hooks.forEach((hook, index) => {
      if (hook.tag === 'effect' && hook.cleanup && typeof hook.cleanup === 'function') {
        try {
          hook.cleanup();
        } catch (error) {
          console.error(`Error in useEffect cleanup at index ${index}:`, error);
        }
        hook.cleanup = null;
      }
    });
  }

  // Clean up effects for the descendants
  cleanupEffects(fiber.child);
  cleanupEffects(fiber.sibling);
}

/**
 * Information about the Commit phase
 *
 * @description
 * The commit phase is the second phase of the rendering process,
 * executed after the render/reconciliation phase. Characteristics:
 *
 * 1. **Synchronous**: Cannot be interrupted, runs to completion
 * 2. **DOM mutations**: All changes are applied at once
 * 3. **Guaranteed order**: Processes in the correct tree order
 * 4. **Effects**: Runs after DOM changes are complete
 *
 * Execution order:
 * 1. Processes deletions
 * 2. Applies insertions and updates
 * 3. Runs effects (useEffect)
 * 4. Stores cleanup functions
 *
 * This separation into two phases (render and commit) enables:
 * - Incremental rendering during the render phase
 * - Guaranteed visual consistency during the commit phase
 * - Better performance and responsiveness
 */
