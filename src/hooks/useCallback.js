/**
 * @fileoverview Implementation of the useCallback hook
 * @module hooks/useCallback
 * @description
 * Implements the useCallback hook for memoizing callback functions.
 *
 * useCallback is an optimization hook that returns a memoized version
 * of a callback function that only changes if its dependencies change.
 * This is useful for avoiding unnecessary re-creation of functions and
 * the resulting re-renders of child components.
 *
 * **When to Use:**
 * - Passing callbacks to child components optimized with React.memo
 * - Callbacks that are dependencies of other hooks
 * - Complex event handlers that don't need to be recreated
 * - Functions passed to multiple components
 *
 * **Relationship with useMemo:**
 * - `useCallback(fn, deps)` is equivalent to `useMemo(() => fn, deps)`
 * - useCallback memoizes the function itself
 * - useMemo memoizes the result of the function
 *
 * **Performance:**
 * - Avoids unnecessary re-renders of child components
 * - Reduces garbage collector pressure
 * - Keeps a stable reference between renders
 */

import { useMemo } from './useMemo.js';

/**
 * Hook for memoizing callback functions
 *
 * @description
 * Returns a memoized version of the callback function that only changes
 * when the dependencies change. Useful for optimizing child components
 * that rely on referential equality to avoid re-renders.
 *
 * @template {Function} T
 * @param {T} callback - Callback function to memoize
 * @param {Array<any>} deps - Dependency array
 * @returns {T} Memoized callback function
 *
 * @example
 * // Avoid re-creating handlers
 * const handleClick = useCallback(() => {
 *   console.log(`Clicked with value: ${value}`);
 * }, [value]);
 *
 * @example
 * // Callback for an optimized child component
 * const TodoItem = React.memo(({ todo, onToggle }) => {
 *   return (
 *     <li onClick={() => onToggle(todo.id)}>
 *       {todo.text}
 *     </li>
 *   );
 * });
 *
 * function TodoList({ todos }) {
 *   const handleToggle = useCallback((id) => {
 *     dispatch({ type: 'TOGGLE', id });
 *   }, []); // Not recreated because dispatch is stable
 *
 *   return todos.map(todo => (
 *     <TodoItem
 *       key={todo.id}
 *       todo={todo}
 *       onToggle={handleToggle}
 *     />
 *   ));
 * }
 *
 * @example
 * // Complex function with multiple dependencies
 * const fetchData = useCallback(async () => {
 *   const params = {
 *     page: currentPage,
 *     filter: selectedFilter,
 *     sort: sortOrder
 *   };
 *   const data = await api.getData(params);
 *   setData(data);
 * }, [currentPage, selectedFilter, sortOrder]);
 */
export function useCallback(callback, deps) {
  // useCallback is essentially useMemo for functions
  return useMemo(() => callback, deps);
}
