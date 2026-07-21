/**
 * @fileoverview Implementation of the useReducer hook
 * @module hooks/useReducer
 * @description
 * Implements the useReducer hook for managing complex state with a Redux-like pattern.
 *
 * useReducer is an alternative to useState for managing complex state,
 * especially useful when the next state depends on the previous one or when
 * there are multiple related sub-values of state.
 *
 * **Advantages over useState:**
 * - Update logic centralized in the reducer
 * - Better for state with multiple properties
 * - Predictable update pattern (actions)
 * - Makes it easier to unit test the reducer
 *
 * **Redux Pattern:**
 * - Immutable state
 * - Actions describe "what happened"
 * - The reducer specifies "how the state changes"
 * - Dispatch sends actions to the reducer
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
 * State now lives entirely on the fiber tree (see useReducer below), so there
 * is no module-level cache left to clear between tests or renders.
 */
// eslint-disable-next-line no-empty-function -- intentional no-op, see comment above
export function clearReducerState() {}

/**
 * Hook for managing complex state with the reducer pattern
 *
 * @description
 * An alternative to useState for managing complex state. Useful when
 * the next state depends on the previous one or when there are multiple
 * sub-values of state. Follows the Redux pattern of actions and reducers.
 *
 * @template S - State type
 * @template A - Action type
 *
 * @param {function(S, A):S} reducer - Reducer function that receives state and action
 * @param {S} initialState - Initial state
 * @param {function(S):S} [init] - Optional lazy initialization function
 * @returns {Array} Tuple with the current state and the dispatch function
 *
 * @example
 * const todoReducer = (state, action) => {
 *   switch (action.type) {
 *     case 'ADD':
 *       return [...state, { id: Date.now(), text: action.text }];
 *     case 'REMOVE':
 *       return state.filter(todo => todo.id !== action.id);
 *     default:
 *       return state;
 *   }
 * };
 *
 * function TodoList() {
 *   const [todos, dispatch] = useReducer(todoReducer, []);
 *
 *   const addTodo = (text) => {
 *     dispatch({ type: 'ADD', text });
 *   };
 *
 *   return (
 *     // component JSX
 *   );
 * }
 *
 * @example
 * // With lazy initialization
 * const [state, dispatch] = useReducer(
 *   reducer,
 *   props.initialCount,
 *   count => ({ count })
 * );
 */
export function useReducer(reducer, initialState, init) {
  // Validates that this is being called within a component
  validateHookCall('useReducer');

  // Gets the current fiber and index
  const wipFiber = getCurrentFiber();
  const hookIndex = getCurrentHookIndex();

  // Gets this hook's own previous instance from the fiber tree, if any. Reusing
  // the same hook record (rather than rebuilding one from copied fields) keeps
  // state, queue and dispatch tied to this specific component instance - and
  // keeps dispatch correct even if a stale reference to it is held across renders.
  const oldHook = getPreviousHook(wipFiber, hookIndex);
  const hook = oldHook || {
    state: init ? init(initialState) : initialState,
    queue: [],
  };

  // Processes pending actions accumulated since the last render
  const actions = hook.queue.splice(0);
  actions.forEach((action) => {
    hook.state = reducer(hook.state, action);
  });

  // Creates the dispatch function once; later renders reuse the same instance
  if (!hook.dispatch) {
    hook.dispatch = (action) => {
      // Queues the action to be applied on the next render
      hook.queue.push(action);

      // Schedules a re-render
      scheduleRerender();
    };
  }

  // Ensures the fiber has a hooks array
  wipFiber.hooks = wipFiber.hooks || [];

  // Sets the hook at the correct index (does not push to the end)
  wipFiber.hooks[hookIndex] = hook;
  incrementHookIndex();

  return [hook.state, hook.dispatch];
}
