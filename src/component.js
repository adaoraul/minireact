/**
 * @fileoverview Classe base para componentes de classe
 * @module component
 * @description
 * Módulo que fornece a classe base Component para criar componentes usando classes.
 *
 * Este módulo oferece uma API familiar para desenvolvedores acostumados com
 * React.Component, permitindo a criação de componentes com estado e métodos
 * de ciclo de vida usando a sintaxe de classes do JavaScript.
 *
 * **Características Principais:**
 * - **Estado Local**: Gerenciado através de this.state e this.setState
 * - **Props**: Acessíveis via this.props
 * - **Render Method**: Método obrigatório que retorna elementos virtuais
 * - **Lifecycle**: Base para métodos de ciclo de vida (parcialmente implementado)
 *
 * **Diferenças dos Componentes Funcionais:**
 * - Estado gerenciado com this.state ao invés de hooks
 * - Métodos de classe ao invés de funções internas
 * - Necessita binding explícito ou arrow functions para callbacks
 * - Sintaxe mais verbosa mas familiar para OOP
 *
 * **Quando Usar:**
 * - Migração de código React existente
 * - Preferência por programação orientada a objetos
 * - Casos onde a sintaxe de classe é mais clara
 *
 * **Limitações Atuais:**
 * - Ciclo de vida não totalmente implementado
 * - Sem componentDidMount, componentDidUpdate, componentWillUnmount
 * - Sem shouldComponentUpdate para otimizações
 * - Sem error boundaries ou componentDidCatch
 *
 * **Recomendação:**
 * Para novos componentes, prefira componentes funcionais com hooks,
 * que são mais simples, performáticos e o padrão moderno.
 */

import { scheduleRerender } from './core/fiber.js';

/**
 * Classe base para criar componentes com estado
 *
 * @description
 * Fornece uma API similar ao React.Component para criar componentes
 * usando classes ao invés de funções. Suporta estado local e métodos
 * de ciclo de vida.
 *
 * @class Component
 *
 * @example
 * // Componente de classe simples
 * class Counter extends Component {
 *   constructor(props) {
 *     super(props);
 *     this.state = { count: 0 };
 *   }
 *
 *   increment = () => {
 *     this.setState({ count: this.state.count + 1 });
 *   }
 *
 *   render() {
 *     return createElement(
 *       'button',
 *       { onClick: this.increment },
 *       `Count: ${this.state.count}`
 *     );
 *   }
 * }
 *
 * @example
 * // Usando setState funcional
 * class TodoList extends Component {
 *   constructor(props) {
 *     super(props);
 *     this.state = { todos: [] };
 *   }
 *
 *   addTodo = (text) => {
 *     this.setState(prevState => ({
 *       todos: [...prevState.todos, { id: Date.now(), text }]
 *     }));
 *   }
 *
 *   render() {
 *     // ... renderização dos todos
 *   }
 * }
 */
export class Component {
  /**
   * Construtor do componente
   *
   * @param {Object} props - Propriedades passadas ao componente
   */
  constructor(props) {
    this.props = props;
    this.state = {};
    this._internalFiber = null;
  }

  /**
   * Atualiza o estado do componente e dispara re-renderização
   *
   * @description
   * Pode receber um objeto com o estado parcial ou uma função
   * que recebe o estado anterior e retorna o novo estado.
   * As atualizações são mescladas com o estado atual.
   *
   * @param {Object|Function} partialState - Novo estado ou função updater
   *
   * @example
   * // Atualização com objeto
   * this.setState({ count: 5 });
   *
   * @example
   * // Atualização funcional (recomendada para valores dependentes)
   * this.setState(prevState => ({
   *   count: prevState.count + 1
   * }));
   *
   * @example
   * // Múltiplas propriedades
   * this.setState({
   *   loading: false,
   *   data: responseData,
   *   error: null
   * });
   */
  setState(partialState) {
    // Calcula novo estado
    const newState = typeof partialState === 'function' ? partialState(this.state) : partialState;

    // Mescla com estado atual
    this.state = {
      ...this.state,
      ...newState,
    };

    // Dispara re-renderização
    this.forceUpdate();
  }

  /**
   * Força re-renderização do componente
   *
   * @description
   * Ignora shouldComponentUpdate e força o componente a re-renderizar.
   * Deve ser usado com moderação, prefira setState na maioria dos casos.
   *
   * @example
   * // Força atualização após mudança externa
   * handleExternalChange = () => {
   *   this.forceUpdate();
   * }
   */
  forceUpdate() {
    // Agenda re-renderização através do sistema de fibers
    if (typeof window !== 'undefined' && window.minireact && window.minireact.scheduleRerender) {
      window.minireact.scheduleRerender();
    } else {
      // Fallback para ambiente de teste - usa importação direta
      scheduleRerender();
    }
  }

  /**
   * Método de renderização (deve ser implementado pela subclasse)
   *
   * @abstract
   * @returns {Object} Elemento virtual a ser renderizado
   * @throws {Error} Se não for implementado pela subclasse
   */
  render() {
    throw new Error('Component subclass must implement render() method');
  }
}

/**
 * Informações sobre Componentes de Classe
 *
 * @description
 * Componentes de classe são uma forma alternativa de criar componentes
 * com estado e métodos de ciclo de vida.
 *
 * Diferenças dos componentes funcionais:
 *
 * 1. **Estado**: Usa this.state ao invés de useState
 * 2. **Métodos**: Métodos da classe ao invés de funções internas
 * 3. **This binding**: Precisa fazer bind ou usar arrow functions
 * 4. **Ciclo de vida**: Métodos específicos (não implementados completamente)
 *
 * Quando usar componentes de classe:
 * - Código legado que usa classes
 * - Preferência pessoal/equipe
 * - Casos específicos de ciclo de vida complexo
 *
 * Quando usar componentes funcionais:
 * - Código novo (recomendado)
 * - Melhor performance (menos overhead)
 * - Hooks fornecem toda funcionalidade necessária
 * - Mais simples e conciso
 *
 * Limitações atuais:
 * - Ciclo de vida não totalmente implementado
 * - Sem componentDidMount, componentDidUpdate, etc
 * - Sem shouldComponentUpdate para otimização
 * - Sem error boundaries
 */
