/**
 * @fileoverview Base class for class components
 * @module component
 * @description
 * Module that provides the base Component class for creating components using classes.
 *
 * This module offers a familiar API for developers accustomed to
 * React.Component, allowing the creation of stateful components with
 * lifecycle methods using JavaScript's class syntax.
 *
 * **Main Features:**
 * - **Local State**: Managed through this.state and this.setState
 * - **Props**: Accessible via this.props
 * - **Render Method**: Required method that returns virtual elements
 * - **Lifecycle**: Base for lifecycle methods (partially implemented)
 *
 * **Differences from Functional Components:**
 * - State managed with this.state instead of hooks
 * - Class methods instead of internal functions
 * - Requires explicit binding or arrow functions for callbacks
 * - More verbose syntax but familiar for OOP
 *
 * **When to Use:**
 * - Migrating existing React code
 * - Preference for object-oriented programming
 * - Cases where class syntax is clearer
 *
 * **Current Limitations:**
 * - Lifecycle not fully implemented
 * - No componentDidMount, componentDidUpdate, componentWillUnmount
 * - No shouldComponentUpdate for optimizations
 * - No error boundaries or componentDidCatch
 *
 * **Recommendation:**
 * For new components, prefer functional components with hooks,
 * which are simpler, more performant, and the modern standard.
 */

import { scheduleRerender } from './core/fiber.js';

/**
 * Base class for creating stateful components
 *
 * @description
 * Provides an API similar to React.Component for creating components
 * using classes instead of functions. Supports local state and
 * lifecycle methods.
 *
 * @class Component
 *
 * @example
 * // Simple class component
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
 * // Using functional setState
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
 *     // ... rendering of the todos
 *   }
 * }
 */
export class Component {
  /**
   * Component constructor
   *
   * @param {Object} props - Properties passed to the component
   */
  constructor(props) {
    this.props = props;
    this.state = {};
    this._internalFiber = null;
  }

  /**
   * Updates the component's state and triggers a re-render
   *
   * @description
   * Can receive an object with the partial state or a function
   * that receives the previous state and returns the new state.
   * Updates are merged with the current state.
   *
   * @param {Object|Function} partialState - New state or updater function
   *
   * @example
   * // Update with an object
   * this.setState({ count: 5 });
   *
   * @example
   * // Functional update (recommended for dependent values)
   * this.setState(prevState => ({
   *   count: prevState.count + 1
   * }));
   *
   * @example
   * // Multiple properties
   * this.setState({
   *   loading: false,
   *   data: responseData,
   *   error: null
   * });
   */
  setState(partialState) {
    // Calculate new state
    const newState = typeof partialState === 'function' ? partialState(this.state) : partialState;

    // Merge with current state
    this.state = {
      ...this.state,
      ...newState,
    };

    // Trigger re-render
    this.forceUpdate();
  }

  /**
   * Forces the component to re-render
   *
   * @description
   * Ignores shouldComponentUpdate and forces the component to re-render.
   * Should be used sparingly, prefer setState in most cases.
   *
   * @example
   * // Force update after an external change
   * handleExternalChange = () => {
   *   this.forceUpdate();
   * }
   */
  forceUpdate() {
    // Schedules re-render through the fiber system
    if (typeof window !== 'undefined' && window.minireact && window.minireact.scheduleRerender) {
      window.minireact.scheduleRerender();
    } else {
      // Fallback for test environment - uses direct import
      scheduleRerender();
    }
  }

  /**
   * Render method (must be implemented by the subclass)
   *
   * @abstract
   * @returns {Object} Virtual element to be rendered
   * @throws {Error} If not implemented by the subclass
   */
  render() {
    throw new Error('Component subclass must implement render() method');
  }
}

/**
 * Information about Class Components
 *
 * @description
 * Class components are an alternative way to create stateful components
 * with lifecycle methods.
 *
 * Differences from functional components:
 *
 * 1. **State**: Uses this.state instead of useState
 * 2. **Methods**: Class methods instead of internal functions
 * 3. **This binding**: Needs to bind or use arrow functions
 * 4. **Lifecycle**: Specific methods (not fully implemented)
 *
 * When to use class components:
 * - Legacy code that uses classes
 * - Personal/team preference
 * - Specific cases of complex lifecycle
 *
 * When to use functional components:
 * - New code (recommended)
 * - Better performance (less overhead)
 * - Hooks provide all the necessary functionality
 * - Simpler and more concise
 *
 * Current limitations:
 * - Lifecycle not fully implemented
 * - No componentDidMount, componentDidUpdate, etc
 * - No shouldComponentUpdate for optimization
 * - No error boundaries
 */
