/**
 * @fileoverview Implementation of the MiniReact useRef hook
 * @module hooks/useRef
 * @description
 * Hook for creating mutable references that persist throughout the
 * component's lifecycle. Useful for accessing DOM elements directly and
 * storing mutable values that don't cause a re-render when changed.
 *
 * **Features:**
 * - Returns a ref object with a `current` property
 * - The `current` property is mutable
 * - Changes to `current` do not trigger a re-render
 * - The ref object's identity is preserved between renders
 * - Useful for DOM references and mutable values
 *
 * **Use cases:**
 * - Focusing DOM elements
 * - Storing instance values
 * - Integration with third-party libraries
 * - Keeping references to timers/intervals
 */

import {
  validateHookCall,
  getCurrentFiber,
  getCurrentHookIndex,
  incrementHookIndex,
  getPreviousHook
} from './hookUtils.js';

/**
 * Hook for creating mutable references
 *
 * @description
 * Returns a mutable ref object whose `.current` property is initialized
 * with the given value (initialValue). The returned object persists
 * throughout the component's lifecycle.
 *
 * Unlike state, changing the `current` property does not cause the
 * component to re-render.
 *
 * @param {*} initialValue - Initial value for ref.current
 * @returns {Object} Ref object with a mutable current property
 *
 * @throws {Error} If called outside of a functional component
 *
 * @example
 * // Reference to a DOM element
 * function InputComponent() {
 *   const inputRef = useRef(null);
 *
 *   const focusInput = () => {
 *     inputRef.current?.focus();
 *   };
 *
 *   return (
 *     <div>
 *       <input ref={inputRef} />
 *       <button onClick={focusInput}>Focus Input</button>
 *     </div>
 *   );
 * }
 *
 * @example
 * // Storing a mutable value
 * function Timer() {
 *   const countRef = useRef(0);
 *
 *   const increment = () => {
 *     countRef.current += 1;
 *     console.log(countRef.current); // Does not trigger a re-render
 *   };
 *
 *   return <button onClick={increment}>Count: {countRef.current}</button>;
 * }
 *
 * @example
 * // Multiple independent refs
 * function MultiRef() {
 *   const ref1 = useRef(1);
 *   const ref2 = useRef(2);
 *
 *   // ref1 and ref2 are completely independent
 *   ref1.current = 10;
 *   ref2.current = 20;
 * }
 */
export function useRef(initialValue) {
  // Validates that this is being called within a component
  validateHookCall('useRef');

  // Gets the current fiber and index
  const fiber = getCurrentFiber();
  const hookIndex = getCurrentHookIndex();

  // Checks whether a previous hook exists (re-render)
  const previousHook = getPreviousHook(fiber, hookIndex);

  let hook;

  if (previousHook) {
    // Re-render: reuses the existing hook to preserve the object's identity
    hook = previousHook;
  } else {
    // First render: creates a new hook with the ref object
    hook = {
      ref: {
        current: initialValue
      }
    };
  }

  // Ensures the hooks array exists
  if (!fiber.hooks) {
    fiber.hooks = [];
  }

  // Stores the hook on the fiber
  fiber.hooks[hookIndex] = hook;

  // Increments the index for the next hook
  incrementHookIndex();

  // Returns the ref object (always the same object between renders)
  return hook.ref;
}