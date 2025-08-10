/**
 * @fileoverview Implementação do hook useState
 * @module hooks/useState
 * @description
 * Implementa o hook useState para gerenciamento de estado local em componentes funcionais.
 *
 * O useState é o hook mais fundamental do MiniReact, permitindo que componentes
 * funcionais mantenham estado entre renderizações. Ele utiliza a arquitetura Fiber
 * para armazenar o estado e agenda re-renderizações quando o estado muda.
 *
 * **Características:**
 * - Estado persistente entre renders
 * - Atualizações síncronas e assíncronas
 * - Suporte a atualizações funcionais
 * - Batching automático de múltiplas atualizações
 *
 * **Como Funciona:**
 * 1. Armazena estado no fiber do componente
 * 2. Mantém fila de atualizações pendentes
 * 3. Processa atualizações na próxima renderização
 * 4. Agenda re-render quando setState é chamado
 */

import {
  getCurrentFiber,
  getCurrentHookIndex,
  incrementHookIndex,
  validateHookCall,
  getPreviousHook,
  scheduleRerender,
} from './hookUtils.js';

// Armazena filas de atualização por fiber + hook index para persistir entre renders
const updateQueues = new Map();
// Armazena o estado atual de cada hook para persistir entre renders
const hookStates = new Map();

/**
 * Limpa todos os estados persistentes dos hooks (usado em testes)
 */
export function clearHookState() {
  updateQueues.clear();
  hookStates.clear();
}

/**
 * Hook para gerenciar estado local em componentes funcionais
 *
 * @description
 * Permite que componentes funcionais tenham estado local que persiste
 * entre renderizações. Quando o estado é atualizado, o componente é
 * re-renderizado automaticamente.
 *
 * @template T
 * @param {T} initial - Valor inicial do estado
 * @returns {Array} Tupla contendo o valor atual e função para atualizar
 *
 * @example
 * function Contador() {
 *   const [count, setCount] = useState(0);
 *
 *   return createElement(
 *     'button',
 *     { onClick: () => setCount(count + 1) },
 *     `Cliques: ${count}`
 *   );
 * }
 *
 * @example
 * // Atualização funcional do estado
 * const [count, setCount] = useState(0);
 * setCount(prevCount => prevCount + 1);
 */
export function useState(initial) {
  // Valida se está sendo chamado dentro de um componente
  validateHookCall('useState');

  // Obtém o fiber e índice atuais
  const wipFiber = getCurrentFiber();
  const hookIndex = getCurrentHookIndex();

  // Cria chave única para este hook (fiber + index)  
  const hookKey = `${wipFiber.type?.name || wipFiber.type?.toString() || 'anonymous'}_${hookIndex}`;
  
  
  // Obtém ou cria a fila de atualizações para este hook
  if (!updateQueues.has(hookKey)) {
    updateQueues.set(hookKey, []);
  }
  const queue = updateQueues.get(hookKey);

  // Determina o estado inicial - usa estado persistente ou inicial
  let currentState;
  if (hookStates.has(hookKey)) {
    // Usa estado persistente
    currentState = hookStates.get(hookKey);
  } else {
    // Primeiro uso - usa valor inicial
    currentState = typeof initial === 'function' ? initial() : initial;
    hookStates.set(hookKey, currentState);
  }

  // Processa ações pendentes na fila
  const actions = [...queue];
  queue.length = 0; // Limpa a fila
  
  actions.forEach((action) => {
    currentState = typeof action === 'function' ? action(currentState) : action;
  });

  // Salva o estado atualizado
  hookStates.set(hookKey, currentState);

  /**
   * Função para atualizar o estado
   * @param {T|function(T):T} action - Novo valor ou função que recebe o valor anterior
   */
  const setState = (action) => {
    // Otimização: verifica se o valor é o mesmo para evitar re-renders desnecessários
    const currentState = hookStates.get(hookKey);
    const nextValue = typeof action === 'function' ? action(currentState) : action;
    
    // Se não há mudança, não agenda re-render
    if (Object.is(nextValue, currentState)) {
      return;
    }

    // Adiciona ação à fila global
    const hookQueue = updateQueues.get(hookKey);
    if (hookQueue) {
      hookQueue.push(action);
    }

    // Agenda re-renderização
    scheduleRerender();
  };

  // Cria hook para esta renderização
  const hook = {
    state: currentState,
    setState,
  };


  // Adiciona hook à lista do fiber
  wipFiber.hooks.push(hook);
  incrementHookIndex();

  return [hook.state, setState];
}
