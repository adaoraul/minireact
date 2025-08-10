/**
 * @fileoverview Implementação do hook useContext e createContext
 * @module hooks/useContext
 * @description
 * Implementa o sistema de contexto do MiniReact, permitindo compartilhar dados
 * entre componentes sem prop drilling.
 *
 * **Características:**
 * - createContext para criar contextos
 * - Provider component para fornecer valores
 * - useContext hook para consumir valores
 * - Suporte a contextos aninhados
 * - Valores padrão quando não há Provider
 */

import {
  getCurrentFiber,
  getCurrentHookIndex,
  incrementHookIndex,
  validateHookCall,
  scheduleRerender,
} from './hookUtils.js';

// Map global para armazenar contextos
const contextProviders = new Map();

/**
 * Cria um contexto React
 * @param {*} defaultValue - Valor padrão quando não há provider
 * @returns {Object} Objeto contexto com Provider e Consumer (não usado)
 */
export function createContext(defaultValue) {
  const contextId = Symbol('context');
  
  const Provider = ({ value, children }) => {
    // Armazena o valor do contexto para este provider
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
    Consumer: null, // Não implementado - usamos useContext
  };

  return context;
}

/**
 * Hook para consumir valores de contexto
 * @param {Object} context - Contexto criado com createContext
 * @returns {*} Valor atual do contexto
 */
export function useContext(context) {
  validateHookCall('useContext');

  if (!context || !context._contextId) {
    throw new Error('useContext must be called with a valid context object');
  }

  const fiber = getCurrentFiber();
  const hookIndex = getCurrentHookIndex();

  // Validate fiber again and initialize hooks if needed
  if (!fiber) {
    throw new Error('useContext: must be called within a component');
  }
  
  if (!fiber.hooks) {
    fiber.hooks = [];
  }

  // Procura o valor do contexto subindo na árvore de fibers
  let currentFiber = fiber;
  let contextValue = context._defaultValue;

  while (currentFiber) {
    if (currentFiber.contextProviders && currentFiber.contextProviders.has(context._contextId)) {
      contextValue = currentFiber.contextProviders.get(context._contextId);
      break;
    }
    currentFiber = currentFiber.parent;
  }

  // Cria hook para esta renderização
  const hook = {
    context,
    value: contextValue,
  };

  // Adiciona hook à lista do fiber
  fiber.hooks.push(hook);
  incrementHookIndex();

  return contextValue;
}

/**
 * Limpa todos os contextos (usado em testes)
 */
export function clearContextState() {
  contextProviders.clear();
}