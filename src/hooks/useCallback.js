/**
 * @fileoverview Implementação do hook useCallback
 * @module hooks/useCallback
 * @description
 * Implementa o hook useCallback para memoização de funções callback.
 *
 * O useCallback é um hook de otimização que retorna uma versão memoizada
 * de uma função callback que só muda se suas dependências mudarem.
 * Isso é útil para evitar re-criação desnecessária de funções e
 * consequentes re-renderizações de componentes filhos.
 *
 * **Quando Usar:**
 * - Passar callbacks para componentes filhos otimizados com React.memo
 * - Callbacks que são dependências de outros hooks
 * - Event handlers complexos que não precisam ser recriados
 * - Funções passadas para múltiplos componentes
 *
 * **Relação com useMemo:**
 * - `useCallback(fn, deps)` é equivalente a `useMemo(() => fn, deps)`
 * - useCallback memoiza a função em si
 * - useMemo memoiza o resultado da função
 *
 * **Performance:**
 * - Evita re-renderizações desnecessárias de componentes filhos
 * - Reduz pressure no garbage collector
 * - Mantém referência estável entre renders
 */

import { useMemo } from './useMemo.js';

/**
 * Hook para memoizar funções callback
 *
 * @description
 * Retorna uma versão memoizada da função callback que só muda quando
 * as dependências mudam. Útil para otimizar componentes filhos que
 * dependem de igualdade referencial para evitar re-renderizações.
 *
 * @template {Function} T
 * @param {T} callback - Função callback a ser memoizada
 * @param {Array<any>} deps - Array de dependências
 * @returns {T} Função callback memoizada
 *
 * @example
 * // Evitar re-criação de handlers
 * const handleClick = useCallback(() => {
 *   console.log(`Clicado com valor: ${value}`);
 * }, [value]);
 *
 * @example
 * // Callback para componente filho otimizado
 * const TodoItem = React.memo(({ todo, onToggle }) => {
 *   return (
 *     <li onClick={() => onToggle(todo.id)}>
 *       {todo.text}
 *     </li>
 *   );
 * });
 *
 * function TodoList({ todos }) {
 *   const handleToggle = useCallback((id) => {
 *     dispatch({ type: 'TOGGLE', id });
 *   }, []); // Não recria pois dispatch é estável
 *
 *   return todos.map(todo => (
 *     <TodoItem
 *       key={todo.id}
 *       todo={todo}
 *       onToggle={handleToggle}
 *     />
 *   ));
 * }
 *
 * @example
 * // Função complexa com múltiplas dependências
 * const fetchData = useCallback(async () => {
 *   const params = {
 *     page: currentPage,
 *     filter: selectedFilter,
 *     sort: sortOrder
 *   };
 *   const data = await api.getData(params);
 *   setData(data);
 * }, [currentPage, selectedFilter, sortOrder]);
 */
export function useCallback(callback, deps) {
  // useCallback é essencialmente useMemo para funções
  return useMemo(() => callback, deps);
}
