/**
 * @fileoverview Manipulation and updating of the real DOM
 * @module vdom/updateDom
 * @description
 * Module responsible for the interface between the Virtual DOM and the browser's real DOM.
 *
 * This module implements the operations for creating and updating DOM elements,
 * optimizing changes to minimize reflows and repaints. It is the final layer
 * that applies the changes calculated by reconciliation to the real DOM.
 *
 * **Main Responsibilities:**
 * - Create DOM elements from fibers
 * - Efficiently update properties and attributes
 * - Manage event listeners
 * - Handle special cases (controlled inputs, disabled, etc.)
 *
 * **Implemented Optimizations:**
 * - Granular diffing of properties
 * - Selective removal of old listeners
 * - Batching of updates during the commit phase
 * - Special handling for critical properties
 *
 * **Property Types:**
 * - **Events**: Handlers starting with "on" (onClick, onChange)
 * - **DOM Attributes**: className, id, style, etc.
 * - **Special properties**: value, checked, disabled
 * - **Children**: Handled separately during reconciliation
 *
 * **Performance:**
 * The module minimizes interactions with the real DOM through:
 * - Precise comparison of old vs. new properties
 * - Applying only the necessary changes
 * - Reusing existing DOM nodes when possible
 * - Avoiding unnecessary updates of identical properties
 */

import { TEXT_ELEMENT } from '../core/constants.js';

/**
 * Creates a DOM element from a fiber
 *
 * @description
 * Converts a fiber (virtual element) into a real DOM element.
 * Handles text elements specially and applies initial properties
 * to the created element.
 *
 * @param {Object} fiber - Fiber containing the element's information
 * @param {string} fiber.type - Element type or TEXT_ELEMENT
 * @param {Object} fiber.props - Properties to be applied
 * @returns {HTMLElement|Text} Created DOM element
 *
 * @example
 * const fiber = {
 *   type: 'div',
 *   props: { className: 'container', children: [] }
 * };
 * const domElement = createDom(fiber);
 * // Returns: <div class="container"></div>
 */
export function createDom(fiber) {
  // Creates the appropriate element based on the type
  const dom =
    fiber.type === TEXT_ELEMENT ? document.createTextNode('') : document.createElement(fiber.type);

  // Applies initial properties
  updateDom(dom, {}, fiber.props);

  return dom;
}

/**
 * Updates a DOM element's properties
 *
 * @description
 * Efficiently updates a DOM element's properties, removing old
 * properties, adding new ones, and updating the ones that changed.
 * Handles events specially.
 *
 * @param {HTMLElement|Text} dom - DOM element to be updated
 * @param {Object} prevProps - Previous properties
 * @param {Object} nextProps - New properties
 *
 * @example
 * // Update class and add an event
 * updateDom(
 *   domElement,
 *   { className: 'old', onClick: oldHandler },
 *   { className: 'new', onClick: newHandler }
 * );
 */
export function updateDom(dom, prevProps, nextProps) {
  // Special handling for text nodes
  if (dom.nodeType === Node.TEXT_NODE) {
    if (prevProps.nodeValue !== nextProps.nodeValue) {
      dom.textContent = nextProps.nodeValue;
    }
    return;
  }

  // Remove old event listeners
  Object.keys(prevProps)
    .filter(isEvent)
    .filter((key) => !(key in nextProps) || isNew(prevProps, nextProps)(key))
    .forEach((name) => {
      const eventType = name.toLowerCase().substring(2);
      dom.removeEventListener(eventType, prevProps[name]);
    });

  // Remove old properties
  Object.keys(prevProps)
    .filter(isProperty)
    .filter(isGone(prevProps, nextProps))
    .forEach((name) => {
      if (name === 'style' && typeof prevProps[name] === 'object') {
        // Remove old styles
        Object.keys(prevProps[name]).forEach((styleProp) => {
          dom.style[styleProp] = '';
        });
      } else if (name === 'disabled') {
        dom.removeAttribute('disabled');
      } else if (name.startsWith('data-') || name.startsWith('aria-') || name === 'id' || name === 'className') {
        // Remove HTML attributes
        if (name === 'className') {
          dom.removeAttribute('class');
        } else {
          dom.removeAttribute(name);
        }
      } else {
        dom[name] = '';
      }
    });

  // Set new properties
  Object.keys(nextProps)
    .filter(isProperty)
    .filter(isNew(prevProps, nextProps))
    .forEach((name) => {
      // Special handling for the style object
      if (name === 'style' && typeof nextProps[name] === 'object') {
        // Remove old styles
        if (prevProps[name] && typeof prevProps[name] === 'object') {
          Object.keys(prevProps[name]).forEach((styleProp) => {
            if (!(styleProp in nextProps[name])) {
              dom.style[styleProp] = '';
            }
          });
        }

        // Apply new styles
        Object.keys(nextProps[name]).forEach((styleProp) => {
          dom.style[styleProp] = nextProps[name][styleProp];
        });
      } else if (name === 'value' && dom.tagName && dom.tagName.toLowerCase() === 'input') {
        // Special handling for controlled inputs
        dom.value = nextProps[name] == null ? '' : nextProps[name];
      } else if (name === 'disabled') {
        // Special handling for disabled - needs to be boolean
        if (nextProps[name]) {
          dom.setAttribute('disabled', '');
        } else {
          dom.removeAttribute('disabled');
        }
      } else if (name.startsWith('data-') || name.startsWith('aria-') || name === 'id' || name === 'className') {
        // Standard HTML attributes and data attributes
        const value = nextProps[name] == null ? '' : nextProps[name];
        if (name === 'className') {
          dom.setAttribute('class', value);
        } else {
          dom.setAttribute(name, value);
        }
      } else {
        // Standard DOM properties
        const value = nextProps[name] == null ? '' : nextProps[name];
        dom[name] = value;
      }
    });

  // Add new event listeners
  Object.keys(nextProps)
    .filter(isEvent)
    .filter(isNew(prevProps, nextProps))
    .forEach((name) => {
      const eventType = name.toLowerCase().substring(2);
      dom.addEventListener(eventType, nextProps[name]);
    });

  // Process refs: supports both callback refs (function) and object refs ({ current })
  if (prevProps.ref !== nextProps.ref) {
    setRef(prevProps.ref, null);
    setRef(nextProps.ref, dom);
  }
}

/**
 * Assigns a DOM node (or null) to a ref, whichever form it takes
 *
 * @param {Function|Object|null|undefined} ref - Callback ref or object ref ({ current })
 * @param {HTMLElement|Text|null} value - DOM node to assign, or null to clear it
 */
export function setRef(ref, value) {
  if (typeof ref === 'function') {
    ref(value);
  } else if (ref && typeof ref === 'object') {
    ref.current = value;
  }
}

/**
 * Checks whether a key is an event
 *
 * @param {string} key - Property name
 * @returns {boolean} True if it's an event (starts with "on")
 *
 * @example
 * isEvent('onClick')     // true
 * isEvent('onMouseOver') // true
 * isEvent('className')   // false
 */
const isEvent = (key) => key.startsWith('on');

/**
 * Checks whether a key is a property (not an event, children, or ref)
 *
 * @param {string} key - Property name
 * @returns {boolean} True if it's a regular property
 *
 * @example
 * isProperty('className')  // true
 * isProperty('value')      // true
 * isProperty('onClick')    // false
 * isProperty('children')   // false
 * isProperty('ref')        // false
 */
const isProperty = (key) => key !== 'children' && key !== 'ref' && !isEvent(key);

/**
 * Creates a function to check whether a property is new or has changed
 *
 * @param {Object} prev - Previous properties
 * @param {Object} next - New properties
 * @returns {Function} Function that checks whether a key is new/different
 */
const isNew = (prev, next) => (key) => prev[key] !== next[key];

/**
 * Creates a function to check whether a property was removed
 *
 * @param {Object} prev - Previous properties
 * @param {Object} next - New properties
 * @returns {Function} Function that checks whether a key was removed
 */
const isGone = (prev, next) => (key) => !(key in next);

/**
 * Information about DOM manipulation
 *
 * @description
 * This module is responsible for the interface between the Virtual DOM and the real DOM.
 *
 * Implemented optimizations:
 * 1. **Granular update**: Only properties that changed are updated
 * 2. **Efficient removal**: Removes unnecessary listeners and properties
 * 3. **Synthetic events**: Manages events consistently
 * 4. **Controlled inputs**: Special handling to keep in sync
 *
 * Property types:
 * - **Events**: Start with "on" (onClick, onInput, etc)
 * - **DOM properties**: Direct attributes (className, value, etc)
 * - **Children**: Handled separately during reconciliation
 *
 * Performance:
 * - Minimizes DOM operations by comparing properties
 * - Removes and adds only what's necessary
 * - Batches operations during the commit phase
 */
