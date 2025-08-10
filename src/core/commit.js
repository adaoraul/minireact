/**
 * @fileoverview Fase de commit - aplicação de mudanças no DOM real
 * @module core/commit
 * @description
 * Gerencia a fase de commit do processo de renderização do MiniReact.
 *
 * A fase de commit é executada após a fase de reconciliação e é responsável
 * por aplicar todas as mudanças acumuladas ao DOM real de forma síncrona.
 *
 * **Características da Fase de Commit:**
 * - **Síncrona**: Não pode ser interrompida, executa completamente
 * - **Ordem garantida**: Processa mudanças na ordem correta da árvore
 * - **Batch updates**: Aplica todas as mudanças de uma vez
 * - **Side effects**: Executa efeitos após mudanças no DOM
 *
 * **Ordem de Execução:**
 * 1. Processa deleções (remove elementos)
 * 2. Aplica inserções e atualizações
 * 3. Executa efeitos (useEffect)
 * 4. Armazena funções de cleanup
 *
 * @example
 * // A fase de commit é executada automaticamente após reconciliação
 * // Quando commitRoot é chamado:
 * // 1. Remove: <div id="old" />
 * // 2. Insere: <span id="new">Hello</span>
 * // 3. Atualiza: <p className="updated">World</p>
 * // 4. Executa: useEffect callbacks
 */

import { EFFECT_TAGS } from './constants.js';
import { updateDom } from '../vdom/updateDom.js';

/**
 * Executa a fase de commit
 *
 * @description
 * Aplica todas as mudanças acumuladas durante a fase de renderização
 * ao DOM real. Esta fase não pode ser interrompida e executa de forma
 * síncrona para garantir consistência visual.
 *
 * @param {Object} wipRoot - Raiz da árvore fiber work-in-progress
 * @param {Array} deletions - Lista de fibers a serem deletados
 */
export function commitRoot(wipRoot, deletions) {
  // Processa deleções primeiro
  if (deletions) {
    deletions.forEach(deletion => {
      // Find parent DOM node for deletion
      let domParentFiber = deletion.parent || deletion.return;
      while (domParentFiber && !domParentFiber.dom) {
        domParentFiber = domParentFiber.parent || domParentFiber.return;
      }
      const domParent = domParentFiber?.dom;
      commitDeletion(deletion, domParent);
    });
  }

  // Processa mudanças na árvore
  commitWork(wipRoot.child);
  
  // NOTE: Effects are now run by the workLoop after currentRoot is set
  // to ensure proper timing and avoid duplicate execution
  
  // Retorna a raiz para ser usada como currentRoot
  return wipRoot;
}

/**
 * Aplica mudanças de um fiber ao DOM
 *
 * @description
 * Processa um fiber e seus descendentes, aplicando as mudanças
 * necessárias ao DOM baseado na effectTag de cada fiber.
 *
 * @param {Object} fiber - Fiber a ser processado
 * @param {string} fiber.effectTag - Tipo de operação (PLACEMENT, UPDATE, DELETION)
 * @param {HTMLElement} fiber.dom - Elemento DOM associado
 */
function commitWork(fiber) {
  if (!fiber) {
    return;
  }


  // For deletions, find parent from fiber's own parent/return property
  if (fiber.effectTag === EFFECT_TAGS.DELETION) {
    // Find parent DOM node for deletion
    let domParentFiber = fiber.parent || fiber.return;
    while (domParentFiber && !domParentFiber.dom) {
      domParentFiber = domParentFiber.parent || domParentFiber.return;
    }
    const domParent = domParentFiber?.dom;
    commitDeletion(fiber, domParent);
    return; // Skip processing children/siblings for deleted elements
  }

  // For non-deletions, find parent normally
  let domParentFiber = fiber.parent;
  while (domParentFiber && !domParentFiber.dom) {
    domParentFiber = domParentFiber.parent;
  }
  const domParent = domParentFiber?.dom;

  // Aplica mudança baseada no tipo de efeito
  if (fiber.effectTag === EFFECT_TAGS.PLACEMENT && fiber.dom != null) {
    // INSERÇÃO: adiciona novo elemento ao DOM
    domParent.appendChild(fiber.dom);
  } else if (fiber.effectTag === EFFECT_TAGS.UPDATE && fiber.dom != null) {
    // ATUALIZAÇÃO: atualiza propriedades do elemento existente
    updateDom(fiber.dom, fiber.alternate.props, fiber.props);
  }

  // Processa filhos e irmãos recursivamente (only if not deleted)
  commitWork(fiber.child);
  commitWork(fiber.sibling);
}

/**
 * Remove um fiber e seus descendentes do DOM
 *
 * @description
 * Remove elementos do DOM, tratando especialmente componentes funcionais
 * que não possuem DOM node próprio, descendo até encontrar um elemento
 * com DOM para remover.
 *
 * @param {Object} fiber - Fiber a ser removido
 * @param {HTMLElement} domParent - Elemento pai no DOM
 */
function commitDeletion(fiber, domParent) {
  if (!fiber) {
    return;
  }
  
  if (fiber.dom) {
    // Elemento com DOM: remove diretamente
    if (domParent && domParent.contains(fiber.dom)) {
      // Executa cleanup de efeitos antes de remover
      cleanupEffects(fiber);
      domParent.removeChild(fiber.dom);
    }
    // When we have a DOM element, we still need to process siblings if this is a child deletion
    // but not the children since they are part of the DOM node being removed
    commitDeletion(fiber.sibling, domParent);
    return;
  } else {
    // Componente funcional: executa cleanup e desce até encontrar elementos com DOM
    cleanupEffects(fiber);
    // Process all children to remove their DOM nodes
    commitDeletion(fiber.child, domParent);
    // Also process siblings to handle multiple children deletion
    commitDeletion(fiber.sibling, domParent);
  }
}

/**
 * Executa efeitos após mudanças no DOM
 *
 * @description
 * Percorre a árvore fiber executando efeitos (useEffect) que foram
 * marcados para execução. Limpa efeitos anteriores se necessário
 * e executa novos efeitos.
 *
 * @param {Object} fiber - Fiber raiz para executar efeitos
 */
export function runEffects(fiber) {
  if (!fiber) return;

  // Executa efeitos do fiber atual
  if (fiber.hooks) {
    // Primeiro: executa todos os cleanups dos hooks antigos
    fiber.hooks.forEach((hook, index) => {
      if (hook.tag === 'effect') {
        const oldHook = fiber.alternate && fiber.alternate.hooks && fiber.alternate.hooks[index];
        
        // Check if we should run cleanup - if deps changed and old hook has cleanup
        const shouldRunCleanup = oldHook && oldHook.cleanup && (
          !hook.deps || // No deps means always run
          !oldHook.deps || // Old hook had no deps
          depsChanged(oldHook.deps, hook.deps) // Deps changed
        );
        
        if (shouldRunCleanup) {
          try {
            oldHook.cleanup();
          } catch (error) {
            console.error(`Error in useEffect cleanup at index ${index}:`, error);
          }
        }
      }
    });
    
    // Segundo: executa todos os novos efeitos
    fiber.hooks.forEach((hook, index) => {
      if (hook.tag === 'effect') {
        // Check if we should run effect - if deps changed or no deps or first time
        const oldHook = fiber.alternate && fiber.alternate.hooks && fiber.alternate.hooks[index];
        const shouldRunEffect = !hook.deps || // No deps means always run
          !oldHook || // First time
          depsChanged(oldHook.deps, hook.deps);
          
        if (shouldRunEffect && hook.effect) {
          try {
            const cleanup = hook.effect();
            // Atualiza o cleanup no hook
            if (typeof cleanup === 'function') {
              hook.cleanup = cleanup;
            } else {
              hook.cleanup = null;
            }
          } catch (error) {
            console.error(`Error in useEffect at index ${index}:`, error);
          }
        }
      }
    });
  }

  // Executa efeitos dos descendentes
  runEffects(fiber.child);
  runEffects(fiber.sibling);
}

/**
 * Verifica se as dependências de um efeito mudaram
 */
function depsChanged(prevDeps, nextDeps) {
  if (!prevDeps || !nextDeps) return true;
  if (prevDeps.length !== nextDeps.length) return true;
  return prevDeps.some((dep, i) => !Object.is(dep, nextDeps[i]));
}

/**
 * Limpa efeitos de um fiber sendo removido
 *
 * @description
 * Executa funções de cleanup para todos os efeitos de um fiber
 * antes dele ser removido do DOM. Importante para prevenir
 * vazamentos de memória.
 *
 * @param {Object} fiber - Fiber sendo removido
 */
function cleanupEffects(fiber) {
  if (!fiber) return;

  // Limpa efeitos do fiber atual
  if (fiber.hooks) {
    fiber.hooks.forEach((hook, index) => {
      if (hook.tag === 'effect' && hook.cleanup && typeof hook.cleanup === 'function') {
        try {
          hook.cleanup();
        } catch (error) {
          console.error(`Error in useEffect cleanup at index ${index}:`, error);
        }
        hook.cleanup = null;
      }
    });
  }

  // Limpa efeitos dos descendentes
  cleanupEffects(fiber.child);
  cleanupEffects(fiber.sibling);
}

/**
 * Informações sobre a fase de Commit
 *
 * @description
 * A fase de commit é a segunda fase do processo de renderização,
 * executada após a fase de render/reconciliação. Características:
 *
 * 1. **Síncrona**: Não pode ser interrompida, executa completamente
 * 2. **Mutações DOM**: Todas as mudanças são aplicadas de uma vez
 * 3. **Ordem garantida**: Processa na ordem correta da árvore
 * 4. **Efeitos**: Executa após mudanças no DOM estarem completas
 *
 * Ordem de execução:
 * 1. Processa deleções
 * 2. Aplica inserções e atualizações
 * 3. Executa efeitos (useEffect)
 * 4. Armazena funções de cleanup
 *
 * Esta separação em duas fases (render e commit) permite:
 * - Renderização incremental na fase de render
 * - Garantia de consistência visual na fase de commit
 * - Melhor performance e responsividade
 */
