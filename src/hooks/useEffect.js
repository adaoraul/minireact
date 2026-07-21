/**
 * @fileoverview Implementation of the useEffect hook
 * @module hooks/useEffect
 * @description
 * Implements the useEffect hook for managing side effects in functional components.
 *
 * useEffect lets you run code after the component renders, replacing
 * the lifecycle methods of class components. It is used for operations
 * such as data fetching, subscriptions, timers, and direct DOM manipulation.
 *
 * **Features:**
 * - Runs after the DOM commit
 * - Dependency system to control when it runs
 * - Cleanup functions to release resources
 * - Support for multiple effects per component
 *
 * **Lifecycle:**
 * 1. Effect registered during render
 * 2. Run after the DOM commit
 * 3. Cleanup run before the next effect
 * 4. Final cleanup on component unmount
 *
 * **Dependency Rules:**
 * - `undefined` or no array: runs after every render
 * - `[]` empty array: runs only on mount
 * - `[deps]` with values: runs when deps change
 */

import {
  getCurrentFiber,
  getCurrentHookIndex,
  incrementHookIndex,
  validateHookCall,
  getPreviousHook,
} from './hookUtils.js';

/**
 * Hook for running side effects in functional components
 *
 * @description
 * Lets you run code after the component renders. Useful for
 * operations such as API calls, direct DOM manipulation, timers,
 * and event subscriptions. Supports cleanup via a returned function.
 *
 * @param {function():void|function():void} effect - Effect function to run
 * @param {Array<any>} [deps] - Dependency array. If omitted, always runs. If empty, runs only once
 *
 * @example
 * // Run only once (componentDidMount)
 * useEffect(() => {
 *   console.log('Component mounted');
 *
 *   return () => {
 *     console.log('Component unmounted');
 *   };
 * }, []);
 *
 * @example
 * // Run when a dependency changes
 * useEffect(() => {
 *   const timer = setTimeout(() => {
 *     console.log(`Count: ${count}`);
 *   }, 1000);
 *
 *   return () => clearTimeout(timer);
 * }, [count]);
 *
 * @example
 * // Always run after render
 * useEffect(() => {
 *   console.log('Component rendered');
 * });
 */
export function useEffect(effect, deps) {
  // Input validation
  if (typeof effect !== 'function') {
    throw new Error('useEffect: effect must be a function');
  }

  // Validates that this is being called within a component
  validateHookCall('useEffect');

  // Gets the current fiber and index
  const wipFiber = getCurrentFiber();
  const hookIndex = getCurrentHookIndex();

  // Gets the previous hook, if any
  const oldHook = getPreviousHook(wipFiber, hookIndex);

  // Creates the new hook. Whether it actually needs to run is decided later,
  // during the commit phase, by comparing this hook's deps with oldHook's.
  const hook = {
    tag: 'effect',
    effect,
    cleanup: oldHook?.cleanup || null,
    deps: deps || null,
  };

  // Adds the hook to the fiber's list
  wipFiber.hooks.push(hook);
  incrementHookIndex();
}

