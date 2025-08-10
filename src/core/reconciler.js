/**
 * @fileoverview Algoritmo de reconciliação do MiniReact
 * @module core/reconciler
 * @description
 * Implementa o algoritmo de reconciliação (diffing) do MiniReact.
 *
 * A reconciliação é o processo de comparar a árvore Virtual DOM anterior
 * com a nova para determinar as mudanças mínimas necessárias no DOM real.
 *
 * **Princípios do Algoritmo:**
 * - Comparação por nível (não compara entre níveis diferentes)
 * - Tipos diferentes resultam em subárvore completamente nova
 * - Keys identificam elementos únicos em listas
 * - Complexidade O(n) ao invés de O(n³)
 *
 * **Tags de Efeito:**
 * - `PLACEMENT`: Novo elemento a ser inserido
 * - `UPDATE`: Elemento existente com props alteradas
 * - `DELETION`: Elemento a ser removido
 *
 * @example
 * // O reconciliador é usado internamente pelo fiber
 * // Ele compara elementos e marca mudanças:
 * // oldFiber: <div className="old">Hello</div>
 * // newElement: <div className="new">World</div>
 * // Resultado: fiber marcado com UPDATE
 */

import { EFFECT_TAGS } from './constants.js';
import { createDom } from '../vdom/updateDom.js';
import { addDeletion } from './fiber.js';

/**
 * Atualiza um componente funcional
 *
 * @description
 * Processa um componente funcional, executando a função do componente
 * e reconciliando seus filhos com o Virtual DOM anterior.
 *
 * @param {Object} fiber - Fiber do componente funcional
 * @param {Object} fiber.type - Função do componente
 * @param {Object} fiber.props - Propriedades do componente
 */
export function updateFunctionComponent(fiber) {
  // Prepara contexto para hooks
  // Inicializa array de hooks vazio - hooks são reconstruídos a cada render
  // O estado persistente é mantido pelos próprios hooks (useState, etc.)
  fiber.hooks = [];

  let children;

  // Verifica se é um componente de classe
  if (fiber.type.prototype && fiber.type.prototype.render) {
    // Componente de classe
    let instance;

    // Reutiliza instância existente ou cria nova
    if (fiber.alternate && fiber.alternate.instance) {
      ({ instance } = fiber.alternate);
      instance.props = fiber.props;
    } else {
      instance = new fiber.type(fiber.props);
    }

    // Salva instância no fiber
    instance._internalFiber = fiber;
    fiber.instance = instance;

    // Chama render() para obter elementos filhos
    children = [instance.render()];
  } else {
    // Componente funcional
    const result = fiber.type(fiber.props);
    // Trata caso onde componente funcional retorna array de elementos
    children = Array.isArray(result) ? result : [result];
  }

  // Hook cleanup is handled by commit phase runEffects function

  reconcileChildren(fiber, children);
}

/**
 * Atualiza um componente host (elemento DOM)
 *
 * @description
 * Processa um elemento DOM, criando o nó DOM se necessário
 * e reconciliando seus filhos.
 *
 * @param {Object} fiber - Fiber do elemento DOM
 * @param {string} fiber.type - Tipo do elemento (div, span, etc)
 * @param {Object} fiber.props - Propriedades e filhos do elemento
 */
export function updateHostComponent(fiber) {
  // Cria DOM node se não existir, ou reutiliza do fiber anterior APENAS se for do mesmo tipo
  if (!fiber.dom) {
    if (fiber.alternate && fiber.alternate.dom && 
        (!fiber.alternate.type || fiber.alternate.type === fiber.type)) {
      // Reutiliza DOM do fiber anterior apenas se for do mesmo tipo ou tipo não especificado
      fiber.dom = fiber.alternate.dom;
    } else {
      // Cria novo DOM node (novo elemento ou tipo mudou)
      fiber.dom = createDom(fiber);
    }
  }
  // Reconcilia filhos
  reconcileChildren(fiber, fiber.props.children);
}

/**
 * Reconcilia filhos de um fiber com novos elementos
 *
 * @description
 * Algoritmo de reconciliação que compara a árvore de fibers anterior
 * com os novos elementos, determinando quais operações DOM são necessárias.
 * Marca fibers com tags de efeito: PLACEMENT, UPDATE ou DELETION.
 *
 * @param {Object} wipFiber - Fiber pai sendo processado
 * @param {Array} elements - Novos elementos filhos
 *
 * @example
 * // Internamente usado durante a renderização
 * reconcileChildren(parentFiber, [
 *   createElement('div', null, 'Hello'),
 *   createElement('span', null, 'World')
 * ]);
 */
export function reconcileChildren(wipFiber, elements) {
  let index = 0;
  let oldFiber = wipFiber.alternate && wipFiber.alternate.child;
  let prevSibling = null;

  // Inicializa lista de deleções se não existir
  if (!wipFiber.deletions) {
    wipFiber.deletions = [];
  }

  // Itera sobre elementos novos e fibers antigos em paralelo
  while (index < elements.length || oldFiber != null) {
    const element = elements[index];
    let newFiber = null;

    // Verifica se o tipo é o mesmo para reutilizar o fiber
    const sameType = oldFiber && element && element.type === oldFiber.type;
    

    if (sameType) {
      // ATUALIZAÇÃO: mesmo tipo, atualiza propriedades
      newFiber = {
        type: oldFiber.type,
        props: element.props,
        dom: oldFiber.dom,
        parent: wipFiber,
        return: wipFiber,
        alternate: oldFiber,
        effectTag: EFFECT_TAGS.UPDATE,
      };
    }

    if (element && !sameType) {
      // INSERÇÃO: novo elemento
      newFiber = {
        type: element.type,
        props: element.props,
        dom: null,
        parent: wipFiber,
        return: wipFiber,
        alternate: null,
        effectTag: EFFECT_TAGS.PLACEMENT,
      };
    }

    if (oldFiber && !sameType) {
      // DELEÇÃO: elemento removido
      oldFiber.effectTag = EFFECT_TAGS.DELETION;

      // Adiciona à lista de deleções local do wipFiber
      wipFiber.deletions.push(oldFiber);

      // Adiciona à lista global de deleções também
      addDeletion(oldFiber);
    }

    // Move para próximo fiber antigo
    if (oldFiber) {
      oldFiber = oldFiber.sibling;
    }

    // Conecta novo fiber à árvore
    if (index === 0) {
      wipFiber.child = newFiber;
    } else if (element) {
      prevSibling.sibling = newFiber;
    }

    // Define sibling como null explicitamente se não há mais elementos
    if (newFiber && index === elements.length - 1) {
      newFiber.sibling = null;
    }

    prevSibling = newFiber;
    index++;
  }
}

/**
 * Reconcilia filhos com suporte a keys
 *
 * @description
 * Versão otimizada da reconciliação que usa keys para identificar
 * elementos únicos em listas, permitindo reordenação eficiente.
 *
 * @param {Object} wipFiber - Fiber pai sendo processado
 * @param {Array} elements - Novos elementos filhos
 *
 * @example
 * // Elementos com keys para lista otimizada
 * const items = data.map(item =>
 *   createElement('li', { key: item.id }, item.text)
 * );
 */
export function reconcileChildrenWithKeys(wipFiber, elements) {
  let index = 0;
  const oldFiber = wipFiber.alternate && wipFiber.alternate.child;
  let prevSibling = null;

  // Inicializa lista de deleções se não existir
  if (!wipFiber.deletions) {
    wipFiber.deletions = [];
  }

  // Cria mapa de fibers antigos por key para busca eficiente
  const oldFiberMap = new Map();
  let temp = oldFiber;
  let tempIndex = 0;

  while (temp) {
    const key = temp.props?.key ?? tempIndex;
    oldFiberMap.set(key, temp);
    temp = temp.sibling;
    tempIndex++;
  }

  // Processa elementos novos
  while (index < elements.length) {
    const element = elements[index];
    const elementKey = element?.props?.key ?? index;
    const matchingOldFiber = oldFiberMap.get(elementKey);

    let newFiber = null;
    const sameType = matchingOldFiber && element && element.type === matchingOldFiber.type;

    if (sameType) {
      // Reutiliza fiber existente
      newFiber = {
        type: matchingOldFiber.type,
        props: element.props,
        dom: matchingOldFiber.dom,
        parent: wipFiber,
        return: wipFiber,
        alternate: matchingOldFiber,
        effectTag: EFFECT_TAGS.UPDATE,
      };
      oldFiberMap.delete(elementKey);
    } else if (element) {
      // Cria novo fiber
      newFiber = {
        type: element.type,
        props: element.props,
        dom: null,
        parent: wipFiber,
        return: wipFiber,
        alternate: null,
        effectTag: EFFECT_TAGS.PLACEMENT,
      };
    }

    // Conecta fiber à árvore
    if (index === 0) {
      wipFiber.child = newFiber;
    } else {
      prevSibling.sibling = newFiber;
    }

    // Define sibling como null explicitamente se não há mais elementos
    if (newFiber && index === elements.length - 1) {
      newFiber.sibling = null;
    }

    prevSibling = newFiber;
    index++;
  }

  // Marca fibers não utilizados para deleção
  oldFiberMap.forEach((fiber) => {
    fiber.effectTag = EFFECT_TAGS.DELETION;
    
    // Adiciona à lista de deleções local do wipFiber
    wipFiber.deletions.push(fiber);
    
    // Adiciona à lista global de deleções também
    if (typeof window !== 'undefined') {
      if (!window.minireact.deletions) window.minireact.deletions = [];
      window.minireact.deletions.push(fiber);
    }
  });
}

/**
 * Informações sobre o algoritmo de Reconciliação
 *
 * @description
 * A reconciliação é o processo de comparar a árvore Virtual DOM anterior
 * com a nova árvore para determinar as mudanças mínimas necessárias no DOM real.
 *
 * Princípios fundamentais:
 *
 * 1. **Comparação por nível**: Compara elementos no mesmo nível da árvore
 * 2. **Tipos diferentes = subárvore nova**: Se o tipo mudou, recria toda a subárvore
 * 3. **Keys para listas**: Identifica elementos únicos em listas para reordenação eficiente
 *
 * Processo de reconciliação:
 *
 * 1. **Comparação de tipos**:
 *    - Mesmo tipo: Atualiza propriedades (UPDATE)
 *    - Tipo diferente: Remove antigo e cria novo (DELETION + PLACEMENT)
 *
 * 2. **Reconciliação de filhos**:
 *    - Itera filhos novos e antigos em paralelo
 *    - Usa keys quando disponíveis para matching otimizado
 *    - Marca operações necessárias com effectTags
 *
 * 3. **Effect Tags**:
 *    - PLACEMENT: Inserir novo elemento
 *    - UPDATE: Atualizar propriedades
 *    - DELETION: Remover elemento
 *
 * Otimizações implementadas:
 *
 * - **Reutilização de DOM nodes**: Mantém referências DOM quando possível
 * - **Batching**: Acumula mudanças para aplicar de uma vez
 * - **Keys**: Permite reordenação eficiente de listas
 * - **Bailout**: Para reconciliação se não há mudanças
 *
 * Complexidade:
 * - Sem keys: O(n) onde n = número de elementos
 * - Com keys: O(n) com melhor constante para reordenações
 *
 * Diferenças do React real:
 * - React usa heurísticas mais sofisticadas
 * - React tem otimizações para componentes puros
 * - React suporta Suspense e concurrent features
 */
