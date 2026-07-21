/**
 * @fileoverview Utilities for hooks
 * @module hooks/hookUtils
 * @description
 * Utility functions shared by all MiniReact hooks.
 *
 * This module provides essential functionality for the hooks system,
 * including context management, validation, access to the current fiber,
 * and scheduling of re-renders.
 *
 * **Main Functions:**
 * - Access to the current fiber and hook index
 * - Validation of hook calls
 * - Retrieval of previous hooks
 * - Scheduling of re-renders
 *
 * **Rules of Hooks (enforced here):**
 * - Hooks can only be called inside functional components
 * - Hooks must be called in the same order on every render
 * - Hooks cannot be called conditionally
 */

/**
 * Safely gets the current fiber
 *
 * @description
 * Returns the current work-in-progress fiber being processed.
 * This function is critical for hooks to work, as it provides
 * access to the current component's context during rendering.
 *
 * @returns {Object|null} Current fiber or null if not available
 *
 * @example
 * // Used internally by hooks
 * const fiber = getCurrentFiber();
 * if (fiber) {
 *   fiber.hooks = fiber.hooks || [];
 * }
 */
// Import fiber functions directly at module level to avoid dynamic imports
import { getWipFiber, getHookIndex, incrementHookIndex as fiberIncrementHookIndex, scheduleRerender as fiberScheduleRerender } from '../core/fiber.js';

export function getCurrentFiber() {
  if (typeof window !== 'undefined' && window.minireact?.wipFiber) {
    return window.minireact.wipFiber;
  }

  // In test environments, use the direct import
  return getWipFiber();
}

/**
 * Safely gets the current hook index
 * @returns {number} Current hook index
 */
export function getCurrentHookIndex() {
  // In test environments, use the direct import
  if (typeof window === 'undefined' || !window.minireact) {
    return getHookIndex() || 0;
  }
  return window.minireact?.hookIndex || 0;
}

/**
 * Safely increments the hook index
 */
export function incrementHookIndex() {
  // In test environments, use the direct import
  if (typeof window === 'undefined' || !window.minireact) {
    return fiberIncrementHookIndex();
  }
  if (window.minireact) {
    window.minireact.hookIndex = (window.minireact.hookIndex || 0) + 1;
  }
}

/**
 * Validates that the hook is being called within a component
 *
 * @description
 * Ensures hooks are only called within the rendering context of a
 * functional component. This validation prevents common mistakes such
 * as calling hooks conditionally or outside of components.
 *
 * @param {string} hookName - Hook name for the error message
 * @throws {Error} If not called within a component
 *
 * @example
 * // Validation at the start of each hook
 * export function useState(initial) {
 *   validateHookCall('useState');
 *   // ... rest of the implementation
 * }
 */
export function validateHookCall(hookName) {
  const fiber = getCurrentFiber();
  if (!fiber) {
    throw new Error(`${hookName}: must be called within a component`);
  }
}

/**
 * Safely gets the previous hook
 * @param {Object} fiber - Current fiber
 * @param {number} index - Hook index
 * @returns {Object|null} Previous hook or null
 */
export function getPreviousHook(fiber, index) {
  return fiber.alternate?.hooks?.[index] || null;
}

/**
 * Schedules a re-render
 */
export function scheduleRerender() {
  // In test environments, use the direct import
  if (typeof window === 'undefined' || !window.minireact?.scheduleRerender) {
    return fiberScheduleRerender();
  }

  if (window.minireact?.scheduleRerender) {
    window.minireact.scheduleRerender();
  }
}
