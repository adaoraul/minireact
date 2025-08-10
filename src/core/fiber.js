/**
 * @fileoverview Implementação da arquitetura Fiber e work loop
 * @module core/fiber
 * @description
 * Módulo central que implementa a arquitetura Fiber do MiniReact.
 *
 * O Fiber é uma reimplementação do algoritmo de reconciliação que permite:
 * - **Renderização Incremental**: Divide o trabalho em pequenas unidades
 * - **Interruptibilidade**: Pode pausar e retomar o trabalho
 * - **Priorização**: Permite que trabalhos urgentes interrompam outros
 * - **Concorrência**: Prepara o terreno para features concorrentes
 *
 * Cada fiber é uma unidade de trabalho que representa um componente na árvore.
 * O work loop processa essas unidades incrementalmente usando `requestIdleCallback`.
 *
 * @example
 * // Renderizando uma aplicação
 * import { render } from './core/fiber.js';
 * import { createElement } from './vdom/createElement.js';
 *
 * const App = () => createElement('h1', null, 'Hello World');
 * render(createElement(App), document.getElementById('root'));
 */

import { updateFunctionComponent, updateHostComponent } from './reconciler.js';
import { commitRoot, runEffects } from './commit.js';

// Estado global do fiber
let nextUnitOfWork = null;
let currentRoot = null;
let wipRoot = null;
let wipFiber = null;
let hookIndex = null;
let rootContainer = null;
let isWorkLoopRunning = false;

// Estado global para deleções (usa window no browser)
let globalDeletions = [];
if (typeof window !== 'undefined') {
  window.minireact = window.minireact || {};
  window.minireact.deletions = null;
  window.minireact.scheduleRerender = null;
}

/**
 * Obtém o fiber atualmente sendo processado
 * @returns {Object} Fiber atual (work in progress)
 */
export function getWipFiber() {
  return wipFiber;
}

/**
 * Define o fiber atualmente sendo processado
 * @param {Object} fiber - Fiber a ser definido como atual
 */
export function setWipFiber(fiber) {
  wipFiber = fiber;
}

/**
 * Obtém o índice do hook atual
 * @returns {number} Índice do hook
 */
export function getHookIndex() {
  return hookIndex;
}

/**
 * Incrementa o índice do hook
 */
export function incrementHookIndex() {
  hookIndex++;
}

/**
 * Define o índice do hook (usado em testes)
 * @param {number} index - Novo índice
 */
export function setHookIndex(index) {
  hookIndex = index;
}

/**
 * Obtém a raiz atual da árvore fiber
 * @returns {Object} Raiz atual
 */
export function getCurrentRoot() {
  return currentRoot;
}

/**
 * Adiciona um fiber à lista de deleções
 * @param {Object} fiber - Fiber a ser deletado
 */
export function addDeletion(fiber) {
  if (typeof window !== 'undefined') {
    if (!window.minireact.deletions) window.minireact.deletions = [];
    window.minireact.deletions.push(fiber);
  } else {
    globalDeletions.push(fiber);
  }
}

/**
 * Define a raiz atual da árvore fiber
 * @param {Object} root - Nova raiz
 */
export function setCurrentRoot(root) {
  currentRoot = root;
}

/**
 * Reseta o container raiz (usado em testes)
 */
export function resetRootContainer() {
  rootContainer = null;
}

/**
 * Loop de trabalho principal (Work Loop)
 *
 * @description
 * Implementa renderização incremental usando requestIdleCallback.
 * Processa unidades de trabalho (fibers) enquanto há tempo disponível,
 * permitindo que o navegador mantenha responsividade.
 *
 * @param {IdleDeadline} deadline - Objeto fornecido por requestIdleCallback
 */
function workLoop(deadline) {
  let shouldYield = false;

  // Processa trabalho enquanto há tempo disponível
  while (nextUnitOfWork && !shouldYield) {
    nextUnitOfWork = performUnitOfWork(nextUnitOfWork);
    shouldYield = deadline.timeRemaining() < 1;
  }

  // Se completou a fase de renderização, inicia fase de commit
  if (!nextUnitOfWork && wipRoot) {
    const deletions = typeof window !== 'undefined' ? window.minireact.deletions || [] : globalDeletions;
    const completedRoot = wipRoot;
    
    // Commits mudanças no DOM
    commitRoot(wipRoot, deletions);
    
    // Atualiza referência da raiz atual ANTES de executar efeitos
    currentRoot = completedRoot;
    
    // Limpa estado de renderização ANTES de executar efeitos
    // para que efeitos que chamam setState possam agendar novo trabalho
    wipRoot = null;
    globalDeletions = [];
    if (typeof window !== 'undefined') {
      window.minireact.deletions = null;
    }
    
    // Executa efeitos após DOM estar atualizado e currentRoot definido
    // Os efeitos podem chamar setState e criar um novo wipRoot
    runEffects(currentRoot);
  }

  // Continua o loop se ainda há trabalho (inclui trabalho agendado por efeitos)
  if (nextUnitOfWork || wipRoot) {
    requestIdleCallback(workLoop);
  } else {
    isWorkLoopRunning = false;
  }
}

/**
 * Inicia o work loop se não estiver rodando
 *
 * @description
 * Garante que apenas um work loop está ativo por vez,
 * evitando múltiplas renderizações concorrentes.
 */
function startWorkLoop() {
  if (!isWorkLoopRunning) {
    isWorkLoopRunning = true;
    requestIdleCallback(workLoop);
  }
}

/**
 * Processa uma unidade de trabalho (fiber)
 *
 * @description
 * Executa o trabalho para um fiber específico e retorna
 * o próximo fiber a ser processado seguindo a ordem:
 * filho -> irmão -> pai
 *
 * @param {Object} fiber - Fiber a ser processado
 * @returns {Object|null} Próximo fiber a processar ou null
 */
function performUnitOfWork(fiber) {
  // Define fiber atual globalmente para hooks
  wipFiber = fiber;
  hookIndex = 0;
  if (typeof window !== 'undefined') {
    window.minireact.wipFiber = fiber;
    window.minireact.hookIndex = 0;
  }

  // Processa fiber baseado no tipo
  const isFunctionComponent = fiber.type instanceof Function;

  if (isFunctionComponent) {
    updateFunctionComponent(fiber);
  } else {
    updateHostComponent(fiber);
  }

  // Retorna próxima unidade de trabalho
  // Ordem: filho -> irmão -> pai (subindo na árvore)
  if (fiber.child) {
    return fiber.child;
  }

  let nextFiber = fiber;
  while (nextFiber) {
    if (nextFiber.sibling) {
      return nextFiber.sibling;
    }
    nextFiber = nextFiber.parent;
  }

  return null;
}

/**
 * Renderiza elemento no container
 *
 * @description
 * Ponto de entrada principal para renderização. Cria a raiz fiber
 * e inicia o processo de reconciliação e renderização.
 *
 * @param {Object} element - Elemento Virtual DOM a renderizar
 * @param {HTMLElement} container - Container DOM onde renderizar
 *
 * @example
 * const element = createElement('div', null, 'Hello World');
 * render(element, document.getElementById('root'));
 */
export function render(element, container) {
  // Always allow new containers - reset state when needed
  if (rootContainer !== container) {
    // Reset global state for new container
    currentRoot = null;
    wipRoot = null;
    nextUnitOfWork = null;
    wipFiber = null;
    hookIndex = null;
    isWorkLoopRunning = false;
    
    // Clear container and set as new root
    container.innerHTML = '';
    rootContainer = container;
  }

  // Cria raiz fiber (work in progress root)
  wipRoot = {
    dom: container,
    props: {
      children: [element],
    },
    alternate: currentRoot,
  };

  // Inicializa estado de deleções
  globalDeletions = [];
  if (typeof window !== 'undefined') {
    window.minireact.deletions = [];
  }
  nextUnitOfWork = wipRoot;

  // Inicia work loop
  startWorkLoop();
}

/**
 * Agenda re-renderização do componente atual
 *
 * @description
 * Usado internamente pelos hooks para agendar uma nova renderização
 * quando o estado muda. Cria uma nova árvore fiber mantendo o DOM atual.
 */
export function scheduleRerender() {
  // Verifica se há uma raiz atual para re-renderizar
  if (!currentRoot) {
    console.warn('scheduleRerender: No current root to re-render');
    return;
  }

  // Cria nova raiz mantendo props e DOM atuais
  wipRoot = {
    dom: currentRoot.dom,
    props: currentRoot.props,
    alternate: currentRoot,
  };

  // Reinicializa estado
  nextUnitOfWork = wipRoot;
  if (typeof window !== 'undefined') {
    window.minireact.deletions = [];
  }

  // Inicia work loop
  startWorkLoop();
}

// Expõe scheduleRerender globalmente para hooks
if (typeof window !== 'undefined') {
  window.minireact.scheduleRerender = scheduleRerender;
}

/**
 * Informações sobre a arquitetura Fiber
 *
 * @description
 * Fiber é uma unidade de trabalho que representa um componente ou elemento.
 * Cada fiber contém:
 * - type: tipo do elemento ou função do componente
 * - props: propriedades incluindo children
 * - dom: referência ao nó DOM real
 * - parent: referência ao fiber pai
 * - child: referência ao primeiro filho
 * - sibling: referência ao próximo irmão
 * - alternate: referência ao fiber da renderização anterior
 * - effectTag: tipo de mudança (PLACEMENT, UPDATE, DELETION)
 * - hooks: array de hooks para componentes funcionais
 *
 * A arquitetura Fiber permite:
 * - Renderização incremental (pausável e resumível)
 * - Priorização de trabalho
 * - Melhor tratamento de erros
 * - Suporte para concurrent features
 *
 * @typedef {Object} Fiber
 * @property {Function|string} type - Tipo do componente ou tag HTML
 * @property {Object} props - Propriedades do componente
 * @property {HTMLElement} [dom] - Elemento DOM associado
 * @property {Fiber} [parent] - Fiber pai
 * @property {Fiber} [child] - Primeiro fiber filho
 * @property {Fiber} [sibling] - Próximo fiber irmão
 * @property {Fiber} [alternate] - Fiber da renderização anterior
 * @property {string} [effectTag] - Tag indicando tipo de efeito
 * @property {Array} [hooks] - Hooks do componente funcional
 */
