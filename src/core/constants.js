/**
 * @fileoverview Shared constants for MiniReact
 * @module core/constants
 * @description
 * Defines global constants used throughout the MiniReact framework.
 *
 * This module centralizes constant values to ensure consistency
 * and ease maintenance. It includes effect tags for reconciliation,
 * special element types, and other system constants.
 *
 * **Exported Constants:**
 * - `TEXT_ELEMENT`: Special type for text nodes
 * - `EFFECT_TAGS`: Enum with tags for marking DOM changes
 * - `Fragment`: Symbol for fragment components
 */

/**
 * Types of effects that can be applied to a fiber
 * @enum {string}
 */
export const EFFECT_TAGS = {
  /** Insert new element into the DOM */
  PLACEMENT: 'PLACEMENT',
  /** Update existing element */
  UPDATE: 'UPDATE',
  /** Remove element from the DOM */
  DELETION: 'DELETION',
};

/**
 * Special type for text elements
 * @const {string}
 */
export const TEXT_ELEMENT = 'TEXT_ELEMENT';

/**
 * Symbol used to identify fragments
 * @const {Symbol}
 */
export const Fragment = Symbol('Fragment');
