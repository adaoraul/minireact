/**
 * @fileoverview Implementação do hook useMemo
 * @module hooks/useMemo
 * @description
 * Implementa o hook useMemo para memoização de valores computacionalmente pesados.
 *
 * O useMemo é um hook de otimização que memoriza o resultado de uma computação
 * e só recalcula quando suas dependências mudam. Isso evita cálculos desnecessários
 * em cada renderização, melhorando a performance.
 *
 * **Quando Usar:**
 * - Cálculos computacionalmente pesados
 * - Transformações complexas de dados
 * - Criação de objetos/arrays que são dependências de outros hooks
 * - Evitar re-renderizações desnecessárias de componentes filhos
 *
 * **Como Funciona:**
 * 1. Executa a função compute na primeira renderização
 * 2. Armazena o resultado e as dependências
 * 3. Nas próximas renderizações, compara dependências
 * 4. Se mudaram, recalcula; senão, retorna valor memoizado
 *
 * **Cuidados:**
 * - Não use para cálculos simples (overhead da memoização)
 * - Sempre declare todas as dependências
 * - A função compute não deve ter efeitos colaterais
 */

/**
 * Hook para memoizar valores computados pesados
 *
 * @description
 * Memoriza o resultado de uma computação pesada e só recalcula quando
 * as dependências mudam. Útil para otimizar performance evitando
 * cálculos desnecessários em cada renderização.
 *
 * O hook mantém o valor calculado entre renderizações e só executa
 * a função compute quando:
 * - É a primeira renderização
 * - Uma ou mais dependências mudaram desde a última renderização
 *
 * @template T
 * @param {function():T} compute - Função que computa o valor a ser memoizado
 * @param {Array<any>} deps - Array de dependências que disparam recálculo
 * @returns {T} Valor memoizado
 * @throws {Error} Se chamado fora de um componente
 * @throws {TypeError} Se compute não for uma função
 *
 * @example
 * // Cálculo pesado apenas quando items mudar
 * const sortedItems = useMemo(() => {
 *   console.log('Ordenando items...');
 *   return items.sort((a, b) => a.value - b.value);
 * }, [items]);
 *
 * @example
 * // Objeto memoizado para evitar re-renderizações
 * const config = useMemo(() => ({
 *   api: apiUrl,
 *   timeout: 5000,
 *   retries: 3
 * }), [apiUrl]);
 *
 * @example
 * // Filtro computado baseado em múltiplas dependências
 * const filteredData = useMemo(() => {
 *   return data
 *     .filter(item => item.category === selectedCategory)
 *     .filter(item => item.price <= maxPrice)
 *     .sort((a, b) => b.rating - a.rating);
 * }, [data, selectedCategory, maxPrice]);
 *
 * @see {@link useCallback} Para memoizar funções callback
 * @see {@link useEffect} Para efeitos colaterais baseados em dependências
 */
export function useMemo(compute, deps) {
  // Valida se compute é uma função
  if (typeof compute !== 'function') {
    throw new TypeError('useMemo: first argument must be a function');
  }

  // Obtém fiber e hookIndex do contexto global
  let wipFiber, hookIndex;
  
  if (typeof window !== 'undefined' && window.minireact) {
    wipFiber = window.minireact.wipFiber;
    hookIndex = window.minireact.hookIndex;
  } else {
    // Fallback para testes - importa diretamente
    const { getWipFiber, getHookIndex } = require('../core/fiber.js');
    wipFiber = getWipFiber();
    hookIndex = getHookIndex();
  }

  // Valida se está sendo chamado dentro de um componente
  if (!wipFiber) {
    throw new Error('useMemo: must be called within a component');
  }

  // Inicializa a array de hooks se não existir
  if (!wipFiber.hooks) {
    wipFiber.hooks = [];
  }

  // Obtém o hook anterior se existir
  const oldHook = wipFiber.alternate?.hooks?.[hookIndex];

  // Verifica se as dependências mudaram
  let hasChanged = true;
  
  if (oldHook && deps !== undefined) {
    // Se temos deps e hook anterior, compara as dependências
    if (oldHook.deps !== undefined && Array.isArray(deps) && Array.isArray(oldHook.deps) && deps.length === oldHook.deps.length) {
      hasChanged = deps.some((dep, i) => !Object.is(dep, oldHook.deps[i]));
    }
  } else if (oldHook && deps === undefined && oldHook.deps === undefined) {
    // Caso especial: ambos são undefined, não mudaram
    hasChanged = false;
  }

  // Cria novo hook com valor computado ou valor anterior
  const hook = {
    value: hasChanged ? compute() : oldHook?.value,
    deps,
  };

  // Adiciona hook à lista do fiber
  wipFiber.hooks.push(hook);
  
  // Incrementa hookIndex
  if (typeof window !== 'undefined' && window.minireact) {
    window.minireact.hookIndex++;
  } else {
    const { incrementHookIndex } = require('../core/fiber.js');
    incrementHookIndex();
  }

  return hook.value;
}
