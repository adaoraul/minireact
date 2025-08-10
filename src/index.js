/**
 * @fileoverview Ponto de entrada principal do MiniReact
 * @module MiniReact
 * @description
 * MiniReact é um framework inspirado no React para fins educacionais.
 *
 * Características principais:
 * - Virtual DOM para atualizações eficientes
 * - Arquitetura Fiber para renderização incremental
 * - Hooks para gerenciamento de estado e efeitos
 * - Componentes funcionais e de classe
 * - Reconciliação inteligente com suporte a keys
 *
 * @example
 * // Importação de módulos individuais
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
 * // Importação do namespace completo
 * import MiniReact from './src/index.js';
 *
 * const { createElement, render, useState } = MiniReact;
 * // ... resto do código
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

// Exportações nomeadas
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
 * Namespace principal do MiniReact contendo todas as funções e componentes exportados.
 *
 * O MiniReact é uma implementação educacional do React que demonstra os conceitos
 * fundamentais de frameworks modernos de UI:
 *
 * - **Virtual DOM**: Representação eficiente da árvore de elementos
 * - **Fiber Architecture**: Renderização incremental e interruptível
 * - **Hooks System**: Estado e efeitos em componentes funcionais
 * - **Reconciliation**: Algoritmo de diff otimizado O(n)
 * - **Component Model**: Suporte para componentes funcionais e de classe
 *
 * @example <caption>Uso básico com componente funcional</caption>
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
 * @example <caption>Uso com useEffect para efeitos colaterais</caption>
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
 * @see {@link module:core/fiber|Fiber} para entender a arquitetura
 * @see {@link module:hooks/useState|useState} para gerenciamento de estado
 * @see {@link module:vdom/createElement|createElement} para criação de elementos
 */
// Exportação padrão para conveniência
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
 * MiniReact é um framework inspirado no React para fins educacionais.
 *
 * Características principais:
 * - Virtual DOM para atualizações eficientes
 * - Arquitetura Fiber para renderização incremental
 * - Hooks para gerenciamento de estado e efeitos
 * - Componentes funcionais e de classe
 * - Reconciliação inteligente com suporte a keys
 *
 * @example
 * // Importação de módulos individuais
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
 * // Importação do namespace completo
 * import MiniReact from 'minireact';
 *
 * const { createElement, render, useState } = MiniReact;
 * // ... resto do código
 */
