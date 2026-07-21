/**
 * @fileoverview Implementation of the Fiber architecture and work loop
 * @module core/fiber
 * @description
 * Central module implementing MiniReact's Fiber architecture.
 *
 * Fiber is a reimplementation of the reconciliation algorithm that enables:
 * - **Incremental Rendering**: Splits work into small units
 * - **Interruptibility**: Can pause and resume work
 * - **Prioritization**: Allows urgent work to interrupt other work
 * - **Concurrency**: Lays the groundwork for concurrent features
 *
 * Each fiber is a unit of work representing a component in the tree.
 * The work loop processes these units incrementally using `requestIdleCallback`.
 *
 * @example
 * // Rendering an application
 * import { render } from './core/fiber.js';
 * import { createElement } from './vdom/createElement.js';
 *
 * const App = () => createElement('h1', null, 'Hello World');
 * render(createElement(App), document.getElementById('root'));
 */

import { updateFunctionComponent, updateHostComponent } from './reconciler.js';
import { commitRoot, runEffects } from './commit.js';

// Global fiber state
let nextUnitOfWork = null;
let currentRoot = null;
let wipRoot = null;
let wipFiber = null;
let hookIndex = null;
let rootContainer = null;
let isWorkLoopRunning = false;

// Global state for deletions (uses window in the browser)
let globalDeletions = [];
if (typeof window !== 'undefined') {
  window.minireact = window.minireact || {};
  window.minireact.deletions = null;
  window.minireact.scheduleRerender = null;
}

/**
 * Gets the fiber currently being processed
 * @returns {Object} Current (work in progress) fiber
 */
export function getWipFiber() {
  return wipFiber;
}

/**
 * Sets the fiber currently being processed
 * @param {Object} fiber - Fiber to set as current
 */
export function setWipFiber(fiber) {
  wipFiber = fiber;
}

/**
 * Gets the current hook index
 * @returns {number} Hook index
 */
export function getHookIndex() {
  return hookIndex;
}

/**
 * Increments the hook index
 */
export function incrementHookIndex() {
  hookIndex++;
}

/**
 * Sets the hook index (used in tests)
 * @param {number} index - New index
 */
export function setHookIndex(index) {
  hookIndex = index;
}

/**
 * Gets the current root of the fiber tree
 * @returns {Object} Current root
 */
export function getCurrentRoot() {
  return currentRoot;
}

/**
 * Adds a fiber to the deletions list
 * @param {Object} fiber - Fiber to be deleted
 */
export function addDeletion(fiber) {
  if (typeof window !== 'undefined') {
    if (!window.minireact.deletions) window.minireact.deletions = [];
    window.minireact.deletions.push(fiber);
  } else {
    globalDeletions.push(fiber);
  }
}

/**
 * Sets the current root of the fiber tree
 * @param {Object} root - New root
 */
export function setCurrentRoot(root) {
  currentRoot = root;
}

/**
 * Resets the root container (used in tests)
 */
export function resetRootContainer() {
  rootContainer = null;
}

/**
 * Main work loop
 *
 * @description
 * Implements incremental rendering using requestIdleCallback.
 * Processes units of work (fibers) while there is time available,
 * allowing the browser to stay responsive.
 *
 * @param {IdleDeadline} deadline - Object provided by requestIdleCallback
 */
function workLoop(deadline) {
  let shouldYield = false;

  // Process work while there is time available
  while (nextUnitOfWork && !shouldYield) {
    nextUnitOfWork = performUnitOfWork(nextUnitOfWork);
    shouldYield = deadline.timeRemaining() < 1;
  }

  // If the render phase has completed, start the commit phase
  if (!nextUnitOfWork && wipRoot) {
    const deletions = typeof window !== 'undefined' ? window.minireact.deletions || [] : globalDeletions;
    const completedRoot = wipRoot;

    // Commit changes to the DOM
    commitRoot(wipRoot, deletions);

    // Update the current root reference BEFORE running effects
    currentRoot = completedRoot;

    // Clear render state BEFORE running effects
    // so that effects calling setState can schedule new work
    wipRoot = null;
    globalDeletions = [];
    if (typeof window !== 'undefined') {
      window.minireact.deletions = null;
    }

    // Run effects after the DOM has been updated and currentRoot is set
    // Effects may call setState and create a new wipRoot
    runEffects(currentRoot);
  }

  // Continue the loop if there is still work (includes work scheduled by effects)
  if (nextUnitOfWork || wipRoot) {
    requestIdleCallback(workLoop);
  } else {
    isWorkLoopRunning = false;
  }
}

/**
 * Starts the work loop if it isn't already running
 *
 * @description
 * Ensures only one work loop is active at a time,
 * preventing multiple concurrent renders.
 */
function startWorkLoop() {
  if (!isWorkLoopRunning) {
    isWorkLoopRunning = true;
    requestIdleCallback(workLoop);
  }
}

/**
 * Processes a unit of work (fiber)
 *
 * @description
 * Performs the work for a specific fiber and returns
 * the next fiber to process, following the order:
 * child -> sibling -> parent
 *
 * @param {Object} fiber - Fiber to be processed
 * @returns {Object|null} Next fiber to process, or null
 */
function performUnitOfWork(fiber) {
  // Set the current fiber globally for hooks
  wipFiber = fiber;
  hookIndex = 0;
  if (typeof window !== 'undefined') {
    window.minireact.wipFiber = fiber;
    window.minireact.hookIndex = 0;
  }

  // Process fiber based on its type
  const isFunctionComponent = fiber.type instanceof Function;

  if (isFunctionComponent) {
    updateFunctionComponent(fiber);
  } else {
    updateHostComponent(fiber);
  }

  // Return the next unit of work
  // Order: child -> sibling -> parent (moving back up the tree)
  if (fiber.child) {
    return fiber.child;
  }

  let nextFiber = fiber;
  while (nextFiber) {
    if (nextFiber.sibling) {
      return nextFiber.sibling;
    }
    nextFiber = nextFiber.parent;
  }

  return null;
}

/**
 * Renders an element into the container
 *
 * @description
 * Main entry point for rendering. Creates the fiber root
 * and starts the reconciliation and rendering process.
 *
 * @param {Object} element - Virtual DOM element to render
 * @param {HTMLElement} container - DOM container to render into
 *
 * @example
 * const element = createElement('div', null, 'Hello World');
 * render(element, document.getElementById('root'));
 */
export function render(element, container) {
  // Always allow new containers - reset state when needed
  if (rootContainer !== container) {
    // Reset global state for new container
    currentRoot = null;
    wipRoot = null;
    nextUnitOfWork = null;
    wipFiber = null;
    hookIndex = null;
    isWorkLoopRunning = false;

    // Clear container and set as new root
    container.innerHTML = '';
    rootContainer = container;
  }

  // Create the fiber root (work in progress root)
  wipRoot = {
    dom: container,
    props: {
      children: [element],
    },
    alternate: currentRoot,
  };

  // Initialize deletions state
  globalDeletions = [];
  if (typeof window !== 'undefined') {
    window.minireact.deletions = [];
  }
  nextUnitOfWork = wipRoot;

  // Start the work loop
  startWorkLoop();
}

/**
 * Schedules a re-render of the current component
 *
 * @description
 * Used internally by hooks to schedule a new render
 * when state changes. Creates a new fiber tree while keeping the current DOM.
 */
export function scheduleRerender() {
  // Check whether there is a current root to re-render
  if (!currentRoot) {
    console.warn('scheduleRerender: No current root to re-render');
    return;
  }

  // Create a new root keeping the current props and DOM
  wipRoot = {
    dom: currentRoot.dom,
    props: currentRoot.props,
    alternate: currentRoot,
  };

  // Reinitialize state
  nextUnitOfWork = wipRoot;
  if (typeof window !== 'undefined') {
    window.minireact.deletions = [];
  }

  // Start the work loop
  startWorkLoop();
}

// Expose scheduleRerender globally for hooks
if (typeof window !== 'undefined') {
  window.minireact.scheduleRerender = scheduleRerender;
}

/**
 * Information about the Fiber architecture
 *
 * @description
 * A fiber is a unit of work representing a component or element.
 * Each fiber contains:
 * - type: the element type or component function
 * - props: properties including children
 * - dom: reference to the actual DOM node
 * - parent: reference to the parent fiber
 * - child: reference to the first child
 * - sibling: reference to the next sibling
 * - alternate: reference to the fiber from the previous render
 * - effectTag: type of change (PLACEMENT, UPDATE, DELETION)
 * - hooks: array of hooks for function components
 *
 * The Fiber architecture enables:
 * - Incremental rendering (pausable and resumable)
 * - Work prioritization
 * - Better error handling
 * - Support for concurrent features
 *
 * @typedef {Object} Fiber
 * @property {Function|string} type - Component type or HTML tag
 * @property {Object} props - Component properties
 * @property {HTMLElement} [dom] - Associated DOM element
 * @property {Fiber} [parent] - Parent fiber
 * @property {Fiber} [child] - First child fiber
 * @property {Fiber} [sibling] - Next sibling fiber
 * @property {Fiber} [alternate] - Fiber from the previous render
 * @property {string} [effectTag] - Tag indicating the type of effect
 * @property {Array} [hooks] - Hooks of the function component
 */
