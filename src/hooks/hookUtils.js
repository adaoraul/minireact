/**
 * @fileoverview Utilitários para hooks
 * @module hooks/hookUtils
 * @description
 * Funções utilitárias compartilhadas por todos os hooks do MiniReact.
 *
 * Este módulo fornece funcionalidades essenciais para o sistema de hooks,
 * incluindo gerenciamento de contexto, validação, acesso ao fiber atual
 * e agendamento de re-renderizações.
 *
 * **Funções Principais:**
 * - Acesso ao fiber e índice de hooks atuais
 * - Validação de chamadas de hooks
 * - Recuperação de hooks anteriores
 * - Agendamento de re-renderizações
 *
 * **Regras dos Hooks (aplicadas aqui):**
 * - Hooks só podem ser chamados em componentes funcionais
 * - Hooks devem ser chamados na mesma ordem em cada render
 * - Hooks não podem ser chamados condicionalmente
 */

/**
 * Obtém o fiber atual de forma segura
 *
 * @description
 * Retorna o fiber work-in-progress atual que está sendo processado.
 * Esta função é crítica para o funcionamento dos hooks, pois permite
 * acessar o contexto do componente atual durante a renderização.
 *
 * @returns {Object|null} Fiber atual ou null se não disponível
 *
 * @example
 * // Usado internamente pelos hooks
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
  
  // Em ambiente de testes, use import direto
  return getWipFiber();
}

/**
 * Obtém o índice do hook atual de forma segura
 * @returns {number} Índice do hook atual
 */
export function getCurrentHookIndex() {
  // Em ambiente de testes, use o import direto
  if (typeof window === 'undefined' || !window.minireact) {
    return getHookIndex() || 0;
  }
  return window.minireact?.hookIndex || 0;
}

/**
 * Incrementa o índice do hook de forma segura
 */
export function incrementHookIndex() {
  // Em ambiente de testes, use o import direto
  if (typeof window === 'undefined' || !window.minireact) {
    return fiberIncrementHookIndex();
  }
  if (window.minireact) {
    window.minireact.hookIndex = (window.minireact.hookIndex || 0) + 1;
  }
}

/**
 * Valida se o hook está sendo chamado dentro de um componente
 *
 * @description
 * Garante que hooks sejam chamados apenas dentro do contexto de renderização
 * de um componente funcional. Esta validação previne erros comuns como
 * chamar hooks condicionalmente ou fora de componentes.
 *
 * @param {string} hookName - Nome do hook para mensagem de erro
 * @throws {Error} Se não estiver dentro de um componente
 *
 * @example
 * // Validação no início de cada hook
 * export function useState(initial) {
 *   validateHookCall('useState');
 *   // ... resto da implementação
 * }
 */
export function validateHookCall(hookName) {
  const fiber = getCurrentFiber();
  if (!fiber) {
    throw new Error(`${hookName}: must be called within a component`);
  }
}

/**
 * Obtém o hook anterior de forma segura
 * @param {Object} fiber - Fiber atual
 * @param {number} index - Índice do hook
 * @returns {Object|null} Hook anterior ou null
 */
export function getPreviousHook(fiber, index) {
  return fiber.alternate?.hooks?.[index] || null;
}

/**
 * Agenda uma re-renderização
 */
export function scheduleRerender() {
  // Em ambiente de testes, use o import direto
  if (typeof window === 'undefined' || !window.minireact?.scheduleRerender) {
    return fiberScheduleRerender();
  }
  
  if (window.minireact?.scheduleRerender) {
    window.minireact.scheduleRerender();
  }
}
