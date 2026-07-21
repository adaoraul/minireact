/**
 * @fileoverview Implementation of the useState hook
 * @module hooks/useState
 * @description
 * Implements the useState hook for managing local state in functional components.
 *
 * useState is the most fundamental hook in MiniReact, allowing functional
 * components to keep state between renders. It uses the Fiber architecture
 * to store state and schedules re-renders whenever the state changes.
 *
 * **Features:**
 * - State persists between renders
 * - Synchronous and asynchronous updates
 * - Support for functional updates
 * - Automatic batching of multiple updates
 *
 * **How It Works:**
 * 1. Stores state on the component's fiber
 * 2. Keeps a queue of pending updates
 * 3. Processes updates on the next render
 * 4. Schedules a re-render when setState is called
 */

import {
  getCurrentFiber,
  getCurrentHookIndex,
  incrementHookIndex,
  validateHookCall,
  getPreviousHook,
  scheduleRerender,
} from './hookUtils.js';

/**
 * No-op kept for backward compatibility with existing test setup/teardown.
 * State now lives entirely on the fiber tree (see useState below), so there
 * is no module-level cache left to clear between tests or renders.
 */
// eslint-disable-next-line no-empty-function -- intentional no-op, see comment above
export function clearHookState() {}

/**
 * Hook for managing local state in functional components
 *
 * @description
 * Allows functional components to have local state that persists
 * between renders. When the state is updated, the component is
 * automatically re-rendered.
 *
 * @template T
 * @param {T} initial - Initial state value
 * @returns {Array} Tuple containing the current value and the update function
 *
 * @example
 * function Counter() {
 *   const [count, setCount] = useState(0);
 *
 *   return createElement(
 *     'button',
 *     { onClick: () => setCount(count + 1) },
 *     `Clicks: ${count}`
 *   );
 * }
 *
 * @example
 * // Functional state update
 * const [count, setCount] = useState(0);
 * setCount(prevCount => prevCount + 1);
 */
export function useState(initial) {
  // Validates that this is being called within a component
  validateHookCall('useState');

  // Gets the current fiber and index
  const wipFiber = getCurrentFiber();
  const hookIndex = getCurrentHookIndex();

  // Gets this hook's own previous instance from the fiber tree, if any. Reusing
  // the same hook record (rather than rebuilding one from copied fields) keeps
  // state, queue and setState tied to this specific component instance - and
  // keeps setState correct even if a stale reference to it is held across renders.
  const oldHook = getPreviousHook(wipFiber, hookIndex);
  const hook = oldHook || {
    state: typeof initial === 'function' ? initial() : initial,
    queue: [],
  };

  // Processes pending actions accumulated since the last render
  const actions = hook.queue.splice(0);
  actions.forEach((action) => {
    hook.state = typeof action === 'function' ? action(hook.state) : action;
  });

  // Creates the setState function once; later renders reuse the same instance
  if (!hook.setState) {
    /**
     * Function to update the state
     * @param {T|function(T):T} action - New value or function that receives the previous value
     */
    hook.setState = (action) => {
      // Optimization: checks if the value is the same to avoid unnecessary re-renders
      const nextValue = typeof action === 'function' ? action(hook.state) : action;

      // If there is no change, does not schedule a re-render
      if (Object.is(nextValue, hook.state)) {
        return;
      }

      // Queues the action to be applied on the next render
      hook.queue.push(action);

      // Schedules a re-render
      scheduleRerender();
    };
  }

  // Adds the hook to the fiber's list
  wipFiber.hooks.push(hook);
  incrementHookIndex();

  return [hook.state, hook.setState];
}
