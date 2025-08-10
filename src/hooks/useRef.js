/**
 * @fileoverview Implementação do hook useRef do MiniReact
 * @module hooks/useRef
 * @description
 * Hook para criar referências mutáveis que persistem durante todo o ciclo de vida
 * do componente. Útil para acessar elementos DOM diretamente e armazenar valores
 * mutáveis que não causam re-renderização quando alterados.
 *
 * **Características:**
 * - Retorna um objeto ref com propriedade `current`
 * - A propriedade `current` é mutável
 * - Mudanças em `current` não causam re-renderização
 * - A identidade do objeto ref é preservada entre renders
 * - Útil para referencias DOM e valores mutáveis
 *
 * **Casos de uso:**
 * - Focar elementos DOM
 * - Armazenar valores de instância
 * - Integração com bibliotecas terceiras
 * - Manter referências para timers/intervalos
 */

import {
  validateHookCall,
  getCurrentFiber,
  getCurrentHookIndex,
  incrementHookIndex,
  getPreviousHook
} from './hookUtils.js';

/**
 * Hook para criar referências mutáveis
 *
 * @description
 * Retorna um objeto ref mutável cuja propriedade `.current` é inicializada
 * com o valor passado (initialValue). O objeto retornado persistirá durante
 * todo o ciclo de vida do componente.
 *
 * Diferente do state, alterar a propriedade `current` não causa uma
 * re-renderização do componente.
 *
 * @param {*} initialValue - Valor inicial para ref.current
 * @returns {Object} Objeto ref com propriedade current mutável
 *
 * @throws {Error} Se chamado fora de um componente funcional
 *
 * @example
 * // Referência para elemento DOM
 * function InputComponent() {
 *   const inputRef = useRef(null);
 *
 *   const focusInput = () => {
 *     inputRef.current?.focus();
 *   };
 *
 *   return (
 *     <div>
 *       <input ref={inputRef} />
 *       <button onClick={focusInput}>Focus Input</button>
 *     </div>
 *   );
 * }
 *
 * @example
 * // Armazenar valor mutável
 * function Timer() {
 *   const countRef = useRef(0);
 *
 *   const increment = () => {
 *     countRef.current += 1;
 *     console.log(countRef.current); // Não causa re-render
 *   };
 *
 *   return <button onClick={increment}>Count: {countRef.current}</button>;
 * }
 *
 * @example
 * // Múltiplas refs independentes
 * function MultiRef() {
 *   const ref1 = useRef(1);
 *   const ref2 = useRef(2);
 *
 *   // ref1 e ref2 são completamente independentes
 *   ref1.current = 10;
 *   ref2.current = 20;
 * }
 */
export function useRef(initialValue) {
  // Valida se está sendo chamado dentro de um componente
  validateHookCall('useRef');

  // Obtém o fiber e índice atual
  const fiber = getCurrentFiber();
  const hookIndex = getCurrentHookIndex();

  // Verifica se existe um hook anterior (re-render)
  const previousHook = getPreviousHook(fiber, hookIndex);

  let hook;

  if (previousHook) {
    // Re-render: reutiliza o hook existente para preservar a identidade do objeto
    hook = previousHook;
  } else {
    // Primeiro render: cria novo hook com objeto ref
    hook = {
      ref: {
        current: initialValue
      }
    };
  }

  // Garante que o array de hooks existe
  if (!fiber.hooks) {
    fiber.hooks = [];
  }

  // Armazena o hook no fiber
  fiber.hooks[hookIndex] = hook;

  // Incrementa o índice para o próximo hook
  incrementHookIndex();

  // Retorna o objeto ref (sempre o mesmo objeto entre renders)
  return hook.ref;
}