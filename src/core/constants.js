/**
 * @fileoverview Constantes compartilhadas do MiniReact
 * @module core/constants
 * @description
 * Define constantes globais utilizadas em todo o framework MiniReact.
 *
 * Este módulo centraliza valores constantes para garantir consistência
 * e facilitar manutenção. Inclui tags de efeito para reconciliação,
 * tipos especiais de elementos e outras constantes do sistema.
 *
 * **Constantes Exportadas:**
 * - `TEXT_ELEMENT`: Tipo especial para nós de texto
 * - `EFFECT_TAGS`: Enum com tags para marcar mudanças no DOM
 * - `Fragment`: Símbolo para componentes fragment
 */

/**
 * Tipos de efeitos que podem ser aplicados a um fiber
 * @enum {string}
 */
export const EFFECT_TAGS = {
  /** Inserir novo elemento no DOM */
  PLACEMENT: 'PLACEMENT',
  /** Atualizar elemento existente */
  UPDATE: 'UPDATE',
  /** Remover elemento do DOM */
  DELETION: 'DELETION',
};

/**
 * Tipo especial para elementos de texto
 * @const {string}
 */
export const TEXT_ELEMENT = 'TEXT_ELEMENT';

/**
 * Símbolo para identificar fragmentos
 * @const {Symbol}
 */
export const Fragment = Symbol('Fragment');
