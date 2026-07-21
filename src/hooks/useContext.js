/**
 * @fileoverview Implementation of the useContext hook and createContext
 * @module hooks/useContext
 * @description
 * Implements MiniReact's context system, allowing data to be shared
 * between components without prop drilling.
 *
 * **Features:**
 * - createContext to create contexts
 * - Provider component to supply values
 * - useContext hook to consume values
 * - Support for nested contexts
 * - Default values when there is no Provider
 */

import { getCurrentFiber, incrementHookIndex, validateHookCall } from './hookUtils.js';

/**
 * Creates a React context
 * @param {*} defaultValue - Default value when there is no provider
 * @returns {Object} Context object with Provider and Consumer (unused)
 */
export function createContext(defaultValue) {
  const contextId = Symbol('context');

  const Provider = ({ value, children }) => {
    // Stores the context value for this provider
    const fiber = getCurrentFiber();
    if (fiber) {
      if (!fiber.contextProviders) {
        fiber.contextProviders = new Map();
      }
      fiber.contextProviders.set(contextId, value);
    }

    return children;
  };

  const context = {
    _currentValue: defaultValue,
    _defaultValue: defaultValue,
    _contextId: contextId,
    Provider,
    Consumer: null, // Not implemented - we use useContext instead
  };

  return context;
}

/**
 * Hook for consuming context values
 * @param {Object} context - Context created with createContext
 * @returns {*} Current context value
 */
export function useContext(context) {
  validateHookCall('useContext');

  if (!context || !context._contextId) {
    throw new Error('useContext must be called with a valid context object');
  }

  const fiber = getCurrentFiber();

  // Validate fiber again and initialize hooks if needed
  if (!fiber) {
    throw new Error('useContext: must be called within a component');
  }

  if (!fiber.hooks) {
    fiber.hooks = [];
  }

  // Looks for the context value by walking up the fiber tree
  let currentFiber = fiber;
  let contextValue = context._defaultValue;

  while (currentFiber) {
    if (currentFiber.contextProviders && currentFiber.contextProviders.has(context._contextId)) {
      contextValue = currentFiber.contextProviders.get(context._contextId);
      break;
    }
    currentFiber = currentFiber.parent;
  }

  // Creates the hook for this render
  const hook = {
    context,
    value: contextValue,
  };

  // Adds the hook to the fiber's list
  fiber.hooks.push(hook);
  incrementHookIndex();

  return contextValue;
}

/**
 * No-op kept for backward compatibility with existing test setup/teardown.
 * Context values live on the fiber tree itself (see createContext's Provider
 * above), so there is no module-level cache left to clear between tests.
 */
// eslint-disable-next-line no-empty-function -- intentional no-op, see comment above
export function clearContextState() {}
