/**
 * @fileoverview Main entry point for MiniReact
 * @module MiniReact
 * @description
 * MiniReact is a React-inspired framework for educational purposes.
 *
 * Main features:
 * - Virtual DOM for efficient updates
 * - Fiber architecture for incremental rendering
 * - Hooks for state and effect management
 * - Functional and class components
 * - Smart reconciliation with support for keys
 *
 * @example
 * // Importing individual modules
 * import { createElement, render, useState } from './src/index.js';
 *
 * function Counter() {
 *   const [count, setCount] = useState(0);
 *   return createElement(
 *     'button',
 *     { onClick: () => setCount(count + 1) },
 *     `Count: ${count}`
 *   );
 * }
 *
 * render(createElement(Counter), document.getElementById('root'));
 *
 * @example
 * // Importing the full namespace
 * import MiniReact from './src/index.js';
 *
 * const { createElement, render, useState } = MiniReact;
 * // ... rest of the code
 */

// Core
import { render } from './core/fiber.js';
import { Fragment } from './core/constants.js';

// Hooks
import { useState, useEffect, useReducer, useMemo, useCallback, useRef, useContext, createContext } from './hooks/index.js';

// VDOM
import { createElement } from './vdom/createElement.js';

// Component
import { Component } from './component.js';

// Named exports
export {
  // Core
  render,
  Fragment,

  // VDOM
  createElement,

  // Hooks
  useState,
  useEffect,
  useReducer,
  useMemo,
  useCallback,
  useRef,
  useContext,
  createContext,

  // Component
  Component,
};

/**
 * @namespace MiniReact
 * @description
 * Main MiniReact namespace containing all exported functions and components.
 *
 * MiniReact is an educational implementation of React that demonstrates the
 * core concepts of modern UI frameworks:
 *
 * - **Virtual DOM**: Efficient representation of the element tree
 * - **Fiber Architecture**: Incremental and interruptible rendering
 * - **Hooks System**: State and effects in functional components
 * - **Reconciliation**: Optimized O(n) diffing algorithm
 * - **Component Model**: Support for functional and class components
 *
 * @example <caption>Basic usage with a functional component</caption>
 * import { createElement, render, useState } from './src/index.js';
 *
 * function App() {
 *   const [message, setMessage] = useState('Hello MiniReact!');
 *
 *   return createElement(
 *     'div',
 *     null,
 *     createElement('h1', null, message),
 *     createElement(
 *       'button',
 *       { onClick: () => setMessage('Clicked!') },
 *       'Click me'
 *     )
 *   );
 * }
 *
 * render(createElement(App), document.getElementById('root'));
 *
 * @example <caption>Usage with useEffect for side effects</caption>
 * import { createElement, useState, useEffect } from './src/index.js';
 *
 * function Timer() {
 *   const [seconds, setSeconds] = useState(0);
 *
 *   useEffect(() => {
 *     const interval = setInterval(() => {
 *       setSeconds(s => s + 1);
 *     }, 1000);
 *
 *     return () => clearInterval(interval);
 *   }, []);
 *
 *   return createElement('div', null, `Seconds: ${seconds}`);
 * }
 *
 * @see {@link module:core/fiber|Fiber} to understand the architecture
 * @see {@link module:hooks/useState|useState} for state management
 * @see {@link module:vdom/createElement|createElement} for element creation
 */
// Default export for convenience
const MiniReact = {
  // Core
  render,
  Fragment,

  // VDOM
  createElement,

  // Hooks
  useState,
  useEffect,
  useReducer,
  useMemo,
  useCallback,
  useRef,
  useContext,
  createContext,

  // Component
  Component,
};

export default MiniReact;

/**
 * @description
 * MiniReact is a React-inspired framework for educational purposes.
 *
 * Main features:
 * - Virtual DOM for efficient updates
 * - Fiber architecture for incremental rendering
 * - Hooks for state and effect management
 * - Functional and class components
 * - Smart reconciliation with support for keys
 *
 * @example
 * // Importing individual modules
 * import { createElement, render, useState } from 'minireact';
 *
 * function Counter() {
 *   const [count, setCount] = useState(0);
 *   return createElement(
 *     'button',
 *     { onClick: () => setCount(count + 1) },
 *     `Count: ${count}`
 *   );
 * }
 *
 * render(createElement(Counter), document.getElementById('root'));
 *
 * @example
 * // Importing the full namespace
 * import MiniReact from 'minireact';
 *
 * const { createElement, render, useState } = MiniReact;
 * // ... rest of the code
 */
