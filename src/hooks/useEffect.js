/**
 * @fileoverview Implementação do hook useEffect
 * @module hooks/useEffect
 * @description
 * Implementa o hook useEffect para gerenciar efeitos colaterais em componentes funcionais.
 *
 * O useEffect permite executar código após a renderização do componente,
 * substituindo os métodos de ciclo de vida dos componentes de classe.
 * É usado para operações como fetch de dados, subscrições, timers e
 * manipulação direta do DOM.
 *
 * **Características:**
 * - Execução após commit do DOM
 * - Sistema de dependências para controle de execução
 * - Funções de cleanup para limpeza de recursos
 * - Suporte a múltiplos efeitos por componente
 *
 * **Ciclo de Vida:**
 * 1. Efeito registrado durante render
 * 2. Executado após commit do DOM
 * 3. Cleanup executado antes do próximo efeito
 * 4. Cleanup final na desmontagem do componente
 *
 * **Regras de Dependências:**
 * - `undefined` ou sem array: Executa após cada render
 * - `[]` array vazio: Executa apenas na montagem
 * - `[deps]` com valores: Executa quando deps mudam
 */

import {
  getCurrentFiber,
  getCurrentHookIndex,
  incrementHookIndex,
  validateHookCall,
  getPreviousHook,
} from './hookUtils.js';

/**
 * Compara arrays de dependências de forma otimizada
 * @param {Array<any>} deps - Dependências atuais
 * @param {Array<any>} oldDeps - Dependências anteriores
 * @returns {boolean} true se as dependências mudaram
 */
function areDependenciesChanged(deps, oldDeps) {
  if (!deps || !oldDeps) return true;
  if (deps.length !== oldDeps.length) return true;

  // Comparação otimizada usando Object.is para valores primitivos
  return deps.some((dep, i) => !Object.is(dep, oldDeps[i]));
}

/**
 * Executa cleanup function se existir
 * @param {function|null} cleanup - Função de limpeza
 */
function executeCleanup(cleanup) {
  if (cleanup && typeof cleanup === 'function') {
    try {
      cleanup();
    } catch (error) {
      console.error('Error in useEffect cleanup:', error);
    }
  }
}

/**
 * Hook para executar efeitos colaterais em componentes funcionais
 *
 * @description
 * Permite executar código após a renderização do componente. Útil para
 * operações como chamadas a APIs, manipulação direta do DOM, timers,
 * e inscrições em eventos. Suporta limpeza através de função de retorno.
 *
 * @param {function():void|function():void} effect - Função de efeito a ser executada
 * @param {Array<any>} [deps] - Array de dependências. Se omitido, executa sempre. Se vazio, executa apenas uma vez
 *
 * @example
 * // Executar apenas uma vez (componentDidMount)
 * useEffect(() => {
 *   console.log('Componente montado');
 *
 *   return () => {
 *     console.log('Componente desmontado');
 *   };
 * }, []);
 *
 * @example
 * // Executar quando dependência mudar
 * useEffect(() => {
 *   const timer = setTimeout(() => {
 *     console.log(`Contagem: ${count}`);
 *   }, 1000);
 *
 *   return () => clearTimeout(timer);
 * }, [count]);
 *
 * @example
 * // Executar sempre após renderização
 * useEffect(() => {
 *   console.log('Componente renderizado');
 * });
 */
export function useEffect(effect, deps) {
  // Validação de entrada
  if (typeof effect !== 'function') {
    throw new Error('useEffect: effect must be a function');
  }

  // Valida se está sendo chamado dentro de um componente
  validateHookCall('useEffect');

  // Obtém o fiber e índice atuais
  const wipFiber = getCurrentFiber();
  const hookIndex = getCurrentHookIndex();

  // Obtém o hook anterior se existir
  const oldHook = getPreviousHook(wipFiber, hookIndex);

  // Verifica se as dependências mudaram
  // Se deps é undefined, sempre executa. Se deps é array, compara com anterior
  const hasChanged = deps === undefined 
    ? true  // Sem deps array: executa sempre
    : !oldHook || areDependenciesChanged(deps, oldHook.deps);  // Com deps array: compara

  // Cria novo hook
  const hook = {
    tag: 'effect',
    effect: effect,
    cleanup: oldHook?.cleanup || null,
    deps: deps || null,
    hasChanged,
  };

  // Adiciona hook à lista do fiber
  wipFiber.hooks.push(hook);
  incrementHookIndex();
}

