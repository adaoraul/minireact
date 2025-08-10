/**
 * @fileoverview Criação de elementos do Virtual DOM
 * @module vdom/createElement
 * @description
 * Módulo responsável pela criação de elementos virtuais (Virtual DOM) no MiniReact.
 *
 * Este módulo é o ponto de entrada para a criação de toda a árvore de elementos
 * virtuais que representam a interface do usuário. Ele transforma descrições
 * declarativas (JSX ou chamadas diretas) em objetos JavaScript que podem ser
 * eficientemente comparados e convertidos em DOM real.
 *
 * **Conceitos Fundamentais:**
 * - **Virtual DOM**: Representação leve da árvore DOM em JavaScript
 * - **Elements**: Objetos imutáveis que descrevem o que deve aparecer na tela
 * - **Props**: Propriedades e atributos passados para elementos
 * - **Children**: Elementos filhos que formam a árvore de componentes
 *
 * **Tipos de Elementos Suportados:**
 * - Elementos HTML nativos (div, span, button, etc.)
 * - Componentes funcionais (funções que retornam elementos)
 * - Componentes de classe (instâncias de Component)
 * - Fragments (múltiplos elementos sem wrapper)
 * - Elementos de texto (strings e números)
 *
 * **Integração com JSX:**
 * Quando usando JSX, o transpilador converte automaticamente:
 * ```jsx
 * <div className="app">Hello</div>
 * ```
 * Para:
 * ```javascript
 * createElement('div', { className: 'app' }, 'Hello')
 * ```
 *
 * **Performance:**
 * - Criação de elementos é O(n) onde n é o número de elementos
 * - Objetos são imutáveis, facilitando comparações
 * - Estrutura otimizada para reconciliação eficiente
 */

import { TEXT_ELEMENT, Fragment } from '../core/constants.js';

/**
 * Cria um elemento do Virtual DOM
 *
 * @description
 * Função principal para criar elementos virtuais. Transforma JSX ou
 * chamadas diretas em objetos JavaScript que representam a estrutura
 * DOM desejada. Esta é a base do Virtual DOM.
 *
 * @param {string|Function|Symbol} type - Tipo do elemento (tag HTML, componente ou Fragment)
 * @param {Object|null} props - Propriedades do elemento
 * @param {...any} children - Elementos filhos
 * @returns {Object|Array} Elemento virtual ou array de elementos (para Fragments)
 *
 * @example
 * // Elemento HTML simples
 * const element = createElement('div', { className: 'container' }, 'Hello World');
 * // Resultado: { type: 'div', props: { className: 'container', children: [...] } }
 *
 * @example
 * // Componente funcional
 * function Button({ label }) {
 *   return createElement('button', null, label);
 * }
 * const element = createElement(Button, { label: 'Click me' });
 *
 * @example
 * // Fragment para múltiplos elementos sem wrapper
 * const elements = createElement(
 *   Fragment,
 *   null,
 *   createElement('h1', null, 'Title'),
 *   createElement('p', null, 'Content')
 * );
 *
 * @example
 * // Com JSX (após transpilação)
 * // JSX: <div className="app">Hello</div>
 * // Transpilado para: createElement('div', { className: 'app' }, 'Hello')
 */
export function createElement(type, props, ...children) {
  // Achata e filtra children removendo null, undefined e false
  const flatChildren = children.flat(Infinity).filter((child) => child != null && child !== false);

  // Tratamento especial para Fragments - retorna apenas os filhos
  if (type === Fragment || type === 'Fragment') {
    return flatChildren.map((child) =>
      (typeof child === 'object' ? child : createTextElement(child))
    );
  }

  // Retorna elemento virtual
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
 * Cria um elemento de texto virtual
 *
 * @description
 * Converte strings e números em elementos virtuais de texto.
 * Necessário porque no Virtual DOM tudo precisa ser um objeto
 * com estrutura consistente.
 *
 * @param {string|number} text - Texto a ser convertido
 * @returns {Object} Elemento virtual de texto
 *
 * @example
 * const textElement = createTextElement('Hello World');
 * // Resultado: {
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
 * Informações sobre o Virtual DOM
 *
 * @description
 * O Virtual DOM é uma representação em JavaScript da estrutura DOM real.
 *
 * Benefícios:
 * 1. **Performance**: Mudanças são calculadas no Virtual DOM antes de tocar o DOM real
 * 2. **Previsibilidade**: Estado da UI é função dos dados
 * 3. **Abstração**: Desenvolvedores trabalham com abstração mais simples
 *
 * Estrutura de um elemento virtual:
 * ```javascript
 * {
 *   type: 'div',              // Tipo do elemento
 *   props: {                  // Propriedades
 *     className: 'container',
 *     onClick: handleClick,
 *     children: [...]        // Filhos (sempre array)
 *   }
 * }
 * ```
 *
 * Fluxo:
 * 1. createElement cria Virtual DOM
 * 2. Reconciliação compara com versão anterior
 * 3. Commit aplica mudanças mínimas ao DOM real
 */
