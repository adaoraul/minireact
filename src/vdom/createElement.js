/**
 * @fileoverview Virtual DOM element creation
 * @module vdom/createElement
 * @description
 * Module responsible for creating virtual elements (Virtual DOM) in MiniReact.
 *
 * This module is the entry point for creating the entire tree of virtual
 * elements that represent the user interface. It transforms declarative
 * descriptions (JSX or direct calls) into JavaScript objects that can be
 * efficiently compared and converted into real DOM.
 *
 * **Core Concepts:**
 * - **Virtual DOM**: Lightweight representation of the DOM tree in JavaScript
 * - **Elements**: Immutable objects that describe what should appear on screen
 * - **Props**: Properties and attributes passed to elements
 * - **Children**: Child elements that form the component tree
 *
 * **Supported Element Types:**
 * - Native HTML elements (div, span, button, etc.)
 * - Functional components (functions that return elements)
 * - Class components (instances of Component)
 * - Fragments (multiple elements without a wrapper)
 * - Text elements (strings and numbers)
 *
 * **JSX Integration:**
 * When using JSX, the transpiler automatically converts:
 * ```jsx
 * <div className="app">Hello</div>
 * ```
 * Into:
 * ```javascript
 * createElement('div', { className: 'app' }, 'Hello')
 * ```
 *
 * **Performance:**
 * - Element creation is O(n) where n is the number of elements
 * - Objects are immutable, making comparisons easier
 * - Structure optimized for efficient reconciliation
 */

import { TEXT_ELEMENT, Fragment } from '../core/constants.js';

/**
 * Creates a Virtual DOM element
 *
 * @description
 * Main function for creating virtual elements. Transforms JSX or
 * direct calls into JavaScript objects that represent the desired
 * DOM structure. This is the foundation of the Virtual DOM.
 *
 * @param {string|Function|Symbol} type - Element type (HTML tag, component, or Fragment)
 * @param {Object|null} props - Element properties
 * @param {...any} children - Child elements
 * @returns {Object|Array} Virtual element or array of elements (for Fragments)
 *
 * @example
 * // Simple HTML element
 * const element = createElement('div', { className: 'container' }, 'Hello World');
 * // Result: { type: 'div', props: { className: 'container', children: [...] } }
 *
 * @example
 * // Functional component
 * function Button({ label }) {
 *   return createElement('button', null, label);
 * }
 * const element = createElement(Button, { label: 'Click me' });
 *
 * @example
 * // Fragment for multiple elements without a wrapper
 * const elements = createElement(
 *   Fragment,
 *   null,
 *   createElement('h1', null, 'Title'),
 *   createElement('p', null, 'Content')
 * );
 *
 * @example
 * // With JSX (after transpilation)
 * // JSX: <div className="app">Hello</div>
 * // Transpiled to: createElement('div', { className: 'app' }, 'Hello')
 */
export function createElement(type, props, ...children) {
  // Flatten and filter children, removing null, undefined, and false
  const flatChildren = children.flat(Infinity).filter((child) => child != null && child !== false);

  // Special handling for Fragments - returns only the children
  if (type === Fragment || type === 'Fragment') {
    return flatChildren.map((child) =>
      (typeof child === 'object' ? child : createTextElement(child))
    );
  }

  // Returns virtual element
  return {
    type,
    props: {
      ...props,
      children: flatChildren.map((child) =>
        (typeof child === 'object' ? child : createTextElement(child))
      ),
    },
  };
}

/**
 * Creates a virtual text element
 *
 * @description
 * Converts strings and numbers into virtual text elements.
 * Necessary because in the Virtual DOM everything needs to be an
 * object with a consistent structure.
 *
 * @param {string|number} text - Text to be converted
 * @returns {Object} Virtual text element
 *
 * @example
 * const textElement = createTextElement('Hello World');
 * // Result: {
 * //   type: 'TEXT_ELEMENT',
 * //   props: {
 * //     nodeValue: 'Hello World',
 * //     children: []
 * //   }
 * // }
 */
function createTextElement(text) {
  return {
    type: TEXT_ELEMENT,
    props: {
      nodeValue: text,
      children: [],
    },
  };
}

/**
 * Information about the Virtual DOM
 *
 * @description
 * The Virtual DOM is a JavaScript representation of the real DOM structure.
 *
 * Benefits:
 * 1. **Performance**: Changes are calculated in the Virtual DOM before touching the real DOM
 * 2. **Predictability**: UI state is a function of the data
 * 3. **Abstraction**: Developers work with a simpler abstraction
 *
 * Structure of a virtual element:
 * ```javascript
 * {
 *   type: 'div',              // Element type
 *   props: {                  // Properties
 *     className: 'container',
 *     onClick: handleClick,
 *     children: [...]        // Children (always an array)
 *   }
 * }
 * ```
 *
 * Flow:
 * 1. createElement creates the Virtual DOM
 * 2. Reconciliation compares it with the previous version
 * 3. Commit applies the minimal changes to the real DOM
 */
