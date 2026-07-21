/**
 * @fileoverview Implementation of the useMemo hook
 * @module hooks/useMemo
 * @description
 * Implements the useMemo hook for memoizing computationally expensive values.
 *
 * useMemo is an optimization hook that memoizes the result of a computation
 * and only recalculates it when its dependencies change. This avoids
 * unnecessary calculations on every render, improving performance.
 *
 * **When to Use:**
 * - Computationally expensive calculations
 * - Complex data transformations
 * - Creating objects/arrays that are dependencies of other hooks
 * - Avoiding unnecessary re-renders of child components
 *
 * **How It Works:**
 * 1. Runs the compute function on the first render
 * 2. Stores the result and the dependencies
 * 3. On subsequent renders, compares the dependencies
 * 4. If they changed, recalculates; otherwise, returns the memoized value
 *
 * **Caveats:**
 * - Don't use it for simple calculations (memoization overhead)
 * - Always declare all dependencies
 * - The compute function should not have side effects
 */

import {
  getCurrentFiber,
  getCurrentHookIndex,
  incrementHookIndex,
  validateHookCall,
  getPreviousHook,
} from './hookUtils.js';

/**
 * Checks whether a dependency array changed since the previous render
 * @param {Array<any>} deps - Current dependencies
 * @param {Array<any>} oldDeps - Previous dependencies
 * @returns {boolean} true if the dependencies changed
 */
function dependenciesChanged(deps, oldDeps) {
  if (!Array.isArray(deps) || !Array.isArray(oldDeps) || deps.length !== oldDeps.length) {
    return true;
  }
  return deps.some((dep, i) => !Object.is(dep, oldDeps[i]));
}

/**
 * Hook for memoizing expensive computed values
 *
 * @description
 * Memoizes the result of an expensive computation and only recalculates it
 * when the dependencies change. Useful for optimizing performance by
 * avoiding unnecessary calculations on every render.
 *
 * The hook keeps the computed value between renders and only runs
 * the compute function when:
 * - It's the first render
 * - One or more dependencies changed since the last render
 *
 * @template T
 * @param {function():T} compute - Function that computes the value to memoize
 * @param {Array<any>} deps - Dependency array that triggers recomputation
 * @returns {T} Memoized value
 * @throws {Error} If called outside of a component
 * @throws {TypeError} If compute is not a function
 *
 * @example
 * // Expensive calculation only when items changes
 * const sortedItems = useMemo(() => {
 *   console.log('Sorting items...');
 *   return items.sort((a, b) => a.value - b.value);
 * }, [items]);
 *
 * @example
 * // Memoized object to avoid re-renders
 * const config = useMemo(() => ({
 *   api: apiUrl,
 *   timeout: 5000,
 *   retries: 3
 * }), [apiUrl]);
 *
 * @example
 * // Computed filter based on multiple dependencies
 * const filteredData = useMemo(() => {
 *   return data
 *     .filter(item => item.category === selectedCategory)
 *     .filter(item => item.price <= maxPrice)
 *     .sort((a, b) => b.rating - a.rating);
 * }, [data, selectedCategory, maxPrice]);
 *
 * @see {@link useCallback} For memoizing callback functions
 * @see {@link useEffect} For side effects based on dependencies
 */
export function useMemo(compute, deps) {
  // Validates that compute is a function
  if (typeof compute !== 'function') {
    throw new TypeError('useMemo: first argument must be a function');
  }

  // Validates that this is being called within a component
  validateHookCall('useMemo');

  // Gets the current fiber and index
  const wipFiber = getCurrentFiber();
  const hookIndex = getCurrentHookIndex();

  // Gets the previous hook, if any
  const oldHook = getPreviousHook(wipFiber, hookIndex);

  // No deps array means recompute on every render, matching useEffect's semantics.
  // Otherwise recompute on the first render or whenever a dependency changed.
  const hasChanged = deps === undefined || !oldHook || dependenciesChanged(deps, oldHook.deps);

  // Creates the new hook with the computed value or the previous value
  const hook = {
    value: hasChanged ? compute() : oldHook.value,
    deps,
  };

  // Initializes the hooks array if it doesn't exist
  wipFiber.hooks = wipFiber.hooks || [];

  // Adds the hook to the fiber's list
  wipFiber.hooks.push(hook);

  // Increments hookIndex
  incrementHookIndex();

  return hook.value;
}
