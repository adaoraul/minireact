/**
 * @fileoverview Manipulação e atualização do DOM real
 * @module vdom/updateDom
 * @description
 * Módulo responsável pela interface entre o Virtual DOM e o DOM real do navegador.
 *
 * Este módulo implementa as operações de criação e atualização de elementos DOM,
 * otimizando as mudanças para minimizar reflows e repaints. É a camada final
 * que aplica as mudanças calculadas pela reconciliação ao DOM real.
 *
 * **Responsabilidades Principais:**
 * - Criar elementos DOM a partir de fibers
 * - Atualizar propriedades e atributos eficientemente
 * - Gerenciar event listeners
 * - Tratar casos especiais (inputs controlados, disabled, etc.)
 *
 * **Otimizações Implementadas:**
 * - Diff granular de propriedades
 * - Remoção seletiva de listeners antigos
 * - Batch de atualizações na fase de commit
 * - Tratamento especial para propriedades críticas
 *
 * **Tipos de Propriedades:**
 * - **Eventos**: Handlers que começam com "on" (onClick, onChange)
 * - **Atributos DOM**: className, id, style, etc.
 * - **Propriedades especiais**: value, checked, disabled
 * - **Children**: Tratados separadamente na reconciliação
 *
 * **Performance:**
 * O módulo minimiza interações com o DOM real através de:
 * - Comparação precisa de propriedades antigas vs novas
 * - Aplicação apenas das mudanças necessárias
 * - Reutilização de nós DOM existentes quando possível
 * - Evita atualizações desnecessárias de propriedades idênticas
 */

import { TEXT_ELEMENT } from '../core/constants.js';

/**
 * Cria um elemento DOM a partir de um fiber
 *
 * @description
 * Converte um fiber (elemento virtual) em um elemento DOM real.
 * Trata elementos de texto de forma especial e aplica propriedades
 * iniciais ao elemento criado.
 *
 * @param {Object} fiber - Fiber contendo informações do elemento
 * @param {string} fiber.type - Tipo do elemento ou TEXT_ELEMENT
 * @param {Object} fiber.props - Propriedades a serem aplicadas
 * @returns {HTMLElement|Text} Elemento DOM criado
 *
 * @example
 * const fiber = {
 *   type: 'div',
 *   props: { className: 'container', children: [] }
 * };
 * const domElement = createDom(fiber);
 * // Retorna: <div class="container"></div>
 */
export function createDom(fiber) {
  // Cria elemento apropriado baseado no tipo
  const dom =
    fiber.type === TEXT_ELEMENT ? document.createTextNode('') : document.createElement(fiber.type);

  // Aplica propriedades iniciais
  updateDom(dom, {}, fiber.props);

  return dom;
}

/**
 * Atualiza propriedades de um elemento DOM
 *
 * @description
 * Atualiza eficientemente as propriedades de um elemento DOM,
 * removendo propriedades antigas, adicionando novas e atualizando
 * as que mudaram. Trata eventos de forma especial.
 *
 * @param {HTMLElement|Text} dom - Elemento DOM a ser atualizado
 * @param {Object} prevProps - Propriedades anteriores
 * @param {Object} nextProps - Novas propriedades
 *
 * @example
 * // Atualizar classe e adicionar evento
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

  // Remove event listeners antigos
  Object.keys(prevProps)
    .filter(isEvent)
    .filter((key) => !(key in nextProps) || isNew(prevProps, nextProps)(key))
    .forEach((name) => {
      const eventType = name.toLowerCase().substring(2);
      dom.removeEventListener(eventType, prevProps[name]);
    });

  // Remove propriedades antigas
  Object.keys(prevProps)
    .filter(isProperty)
    .filter(isGone(prevProps, nextProps))
    .forEach((name) => {
      if (name === 'style' && typeof prevProps[name] === 'object') {
        // Remove estilos antigos
        Object.keys(prevProps[name]).forEach((styleProp) => {
          dom.style[styleProp] = '';
        });
      } else if (name === 'disabled') {
        dom.removeAttribute('disabled');
      } else if (name.startsWith('data-') || name.startsWith('aria-') || name === 'id' || name === 'className') {
        // Remove atributos HTML
        if (name === 'className') {
          dom.removeAttribute('class');
        } else {
          dom.removeAttribute(name);
        }
      } else {
        dom[name] = '';
      }
    });

  // Define novas propriedades
  Object.keys(nextProps)
    .filter(isProperty)
    .filter(isNew(prevProps, nextProps))
    .forEach((name) => {
      // Tratamento especial para style object
      if (name === 'style' && typeof nextProps[name] === 'object') {
        // Remove estilos antigos
        if (prevProps[name] && typeof prevProps[name] === 'object') {
          Object.keys(prevProps[name]).forEach((styleProp) => {
            if (!(styleProp in nextProps[name])) {
              dom.style[styleProp] = '';
            }
          });
        }
        
        // Aplica novos estilos
        Object.keys(nextProps[name]).forEach((styleProp) => {
          dom.style[styleProp] = nextProps[name][styleProp];
        });
      } else if (name === 'value' && dom.tagName && dom.tagName.toLowerCase() === 'input') {
        // Tratamento especial para inputs controlados
        dom.value = nextProps[name] || '';
      } else if (name === 'disabled') {
        // Tratamento especial para disabled - precisa ser booleano
        if (nextProps[name]) {
          dom.setAttribute('disabled', '');
        } else {
          dom.removeAttribute('disabled');
        }
      } else if (name.startsWith('data-') || name.startsWith('aria-') || name === 'id' || name === 'className') {
        // Atributos HTML padrão e data attributes
        const value = nextProps[name] == null ? '' : nextProps[name];
        if (name === 'className') {
          dom.setAttribute('class', value);
        } else {
          dom.setAttribute(name, value);
        }
      } else {
        // Propriedades DOM padrão
        const value = nextProps[name] == null ? '' : nextProps[name];
        dom[name] = value;
      }
    });

  // Adiciona novos event listeners
  Object.keys(nextProps)
    .filter(isEvent)
    .filter(isNew(prevProps, nextProps))
    .forEach((name) => {
      const eventType = name.toLowerCase().substring(2);
      dom.addEventListener(eventType, nextProps[name]);
    });

  // Processa refs (callback refs)
  if (nextProps.ref && typeof nextProps.ref === 'function') {
    nextProps.ref(dom);
  }
}

/**
 * Verifica se uma chave é um evento
 *
 * @param {string} key - Nome da propriedade
 * @returns {boolean} True se for um evento (começa com "on")
 *
 * @example
 * isEvent('onClick')     // true
 * isEvent('onMouseOver') // true
 * isEvent('className')   // false
 */
const isEvent = (key) => key.startsWith('on');

/**
 * Verifica se uma chave é uma propriedade (não evento nem children nem ref)
 *
 * @param {string} key - Nome da propriedade
 * @returns {boolean} True se for uma propriedade comum
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
 * Cria função para verificar se propriedade é nova ou mudou
 *
 * @param {Object} prev - Propriedades anteriores
 * @param {Object} next - Novas propriedades
 * @returns {Function} Função que verifica se chave é nova/diferente
 */
const isNew = (prev, next) => (key) => prev[key] !== next[key];

/**
 * Cria função para verificar se propriedade foi removida
 *
 * @param {Object} prev - Propriedades anteriores
 * @param {Object} next - Novas propriedades
 * @returns {Function} Função que verifica se chave foi removida
 */
const isGone = (prev, next) => (key) => !(key in next);

/**
 * Informações sobre manipulação do DOM
 *
 * @description
 * Este módulo é responsável pela interface entre o Virtual DOM e o DOM real.
 *
 * Otimizações implementadas:
 * 1. **Atualização granular**: Apenas propriedades que mudaram são atualizadas
 * 2. **Remoção eficiente**: Remove listeners e propriedades desnecessárias
 * 3. **Eventos sintéticos**: Gerencia eventos de forma consistente
 * 4. **Inputs controlados**: Tratamento especial para manter sincronia
 *
 * Tipos de propriedades:
 * - **Eventos**: Começam com "on" (onClick, onInput, etc)
 * - **Propriedades DOM**: Atributos diretos (className, value, etc)
 * - **Children**: Tratado separadamente na reconciliação
 *
 * Performance:
 * - Minimiza operações DOM usando comparação de propriedades
 * - Remove e adiciona apenas o necessário
 * - Batch de operações na fase de commit
 */
