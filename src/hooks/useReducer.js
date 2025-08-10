/**
 * @fileoverview Implementação do hook useReducer
 * @module hooks/useReducer
 * @description
 * Implementa o hook useReducer para gerenciamento de estado complexo com padrão Redux.
 *
 * O useReducer é uma alternativa ao useState para gerenciar estado complexo,
 * especialmente útil quando o próximo estado depende do anterior ou quando
 * há múltiplas sub-valores de estado relacionados.
 *
 * **Vantagens sobre useState:**
 * - Lógica de atualização centralizada no reducer
 * - Melhor para estado com múltiplas propriedades
 * - Padrão previsível de atualização (actions)
 * - Facilita testes unitários do reducer
 *
 * **Padrão Redux:**
 * - Estado imutável
 * - Ações descrevem "o que aconteceu"
 * - Reducer especifica "como o estado muda"
 * - Dispatch envia ações para o reducer
 */

import {
  getCurrentFiber,
  getCurrentHookIndex,
  incrementHookIndex,
  validateHookCall,
  getPreviousHook,
  scheduleRerender,
} from './hookUtils.js';

// Armazena filas de ações por fiber + hook index para persistir entre renders
const actionQueues = new Map();
// Armazena o estado atual de cada hook para persistir entre renders
const reducerStates = new Map();
// Armazena dispatch functions para manter referência estável
const dispatchers = new Map();

/**
 * Limpa todos os estados persistentes dos hooks (usado em testes)
 */
export function clearReducerState() {
  actionQueues.clear();
  reducerStates.clear();
  dispatchers.clear();
}

/**
 * Hook para gerenciar estado complexo com padrão reducer
 *
 * @description
 * Uma alternativa ao useState para gerenciar estado complexo. Útil quando
 * o próximo estado depende do anterior ou quando há múltiplas sub-valores
 * de estado. Segue o padrão Redux de ações e reducers.
 *
 * @template S - Tipo do estado
 * @template A - Tipo da ação
 *
 * @param {function(S, A):S} reducer - Função reducer que recebe estado e ação
 * @param {S} initialState - Estado inicial
 * @param {function(S):S} [init] - Função de inicialização lazy opcional
 * @returns {Array} Tupla com estado atual e função dispatch
 *
 * @example
 * const todoReducer = (state, action) => {
 *   switch (action.type) {
 *     case 'ADD':
 *       return [...state, { id: Date.now(), text: action.text }];
 *     case 'REMOVE':
 *       return state.filter(todo => todo.id !== action.id);
 *     default:
 *       return state;
 *   }
 * };
 *
 * function TodoList() {
 *   const [todos, dispatch] = useReducer(todoReducer, []);
 *
 *   const addTodo = (text) => {
 *     dispatch({ type: 'ADD', text });
 *   };
 *
 *   return (
 *     // JSX do componente
 *   );
 * }
 *
 * @example
 * // Com inicialização lazy
 * const [state, dispatch] = useReducer(
 *   reducer,
 *   props.initialCount,
 *   count => ({ count })
 * );
 */
export function useReducer(reducer, initialState, init) {
  // Valida se está sendo chamado dentro de um componente
  validateHookCall('useReducer');

  // Obtém o fiber e índice atuais
  const wipFiber = getCurrentFiber();
  const hookIndex = getCurrentHookIndex();

  // Cria chave única para este hook (fiber + index)  
  const hookKey = `${wipFiber.type?.name || wipFiber.type?.toString() || 'anonymous'}_${hookIndex}`;
  
  // Obtém ou cria a fila de ações para este hook
  if (!actionQueues.has(hookKey)) {
    actionQueues.set(hookKey, []);
  }
  const queue = actionQueues.get(hookKey);

  // Determina o estado inicial - usa estado persistente ou inicial
  let currentState;
  if (reducerStates.has(hookKey)) {
    // Usa estado persistente
    currentState = reducerStates.get(hookKey);
  } else {
    // Primeiro uso - usa valor inicial (com lazy initialization se fornecida)
    currentState = init ? init(initialState) : initialState;
    reducerStates.set(hookKey, currentState);
  }

  // Processa ações pendentes na fila
  const actions = [...queue];
  queue.length = 0; // Limpa a fila
  
  actions.forEach((action) => {
    currentState = reducer(currentState, action);
  });

  // Salva o estado atualizado
  reducerStates.set(hookKey, currentState);

  // Obtém ou cria dispatch function (mantém referência estável)
  let dispatch;
  if (dispatchers.has(hookKey)) {
    dispatch = dispatchers.get(hookKey);
  } else {
    dispatch = (action) => {
      // Adiciona ação à fila
      const actionQueue = actionQueues.get(hookKey);
      if (actionQueue) {
        actionQueue.push(action);
      }

      // Agenda re-renderização
      scheduleRerender();
    };
    dispatchers.set(hookKey, dispatch);
  }

  // Cria hook para esta renderização
  const hook = {
    state: currentState,
    dispatch,
  };

  // Garante que o fiber tem array de hooks
  wipFiber.hooks = wipFiber.hooks || [];

  // Define hook no índice correto (não adiciona no final)
  wipFiber.hooks[hookIndex] = hook;
  incrementHookIndex();

  return [currentState, dispatch];
}
