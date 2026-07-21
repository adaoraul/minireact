/**
 * ESLint Flat Config
 * Modern ESLint configuration with ESM and JSX support
 */

import js from '@eslint/js';
import prettier from 'eslint-config-prettier';
import babelParser from '@babel/eslint-parser';

export default [
  // Recommended base ESLint configuration
  js.configs.recommended,

  // Disables rules that conflict with Prettier
  prettier,

  // Custom configuration
  {
    files: ['**/*.js'],

    languageOptions: {
      ecmaVersion: 2024,
      sourceType: 'module',
      globals: {
        // Browser globals
        document: 'readonly',
        window: 'readonly',
        console: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
        requestIdleCallback: 'readonly',
        IdleDeadline: 'readonly',
        HTMLElement: 'readonly',
        Text: 'readonly',
        Event: 'readonly',
        Node: 'readonly',

        // Custom MiniReact globals
        global: 'writable',
      },
    },

    rules: {
      // Style rules (that don't conflict with Prettier)
      camelcase: ['error', { properties: 'never' }],
      'consistent-return': 'error',
      curly: ['error', 'multi-line'],
      'default-case': 'warn',
      'dot-notation': 'error',
      eqeqeq: ['error', 'always', { null: 'ignore' }],
      'guard-for-in': 'error',
      'no-alert': 'warn',
      'no-console': 'off', // Allow console for development
      'no-else-return': 'error',
      'no-empty-function': 'error',
      'no-eval': 'error',
      'no-extend-native': 'error',
      'no-extra-bind': 'error',
      'no-implicit-coercion': 'error',
      'no-implied-eval': 'error',
      'no-invalid-this': 'off', // Required for classes
      'no-lone-blocks': 'error',
      'no-loop-func': 'error',
      'no-new': 'error',
      'no-new-func': 'error',
      'no-new-wrappers': 'error',
      'no-param-reassign': 'error',
      'no-proto': 'error',
      'no-return-assign': 'error',
      'no-script-url': 'error',
      'no-self-compare': 'error',
      'no-sequences': 'error',
      'no-throw-literal': 'error',
      'no-unused-expressions': ['error', { allowShortCircuit: true, allowTernary: true }],
      'no-useless-call': 'error',
      'no-useless-concat': 'error',
      'no-useless-return': 'error',
      'no-void': 'error',
      'no-with': 'error',
      'prefer-const': 'error',
      'prefer-promise-reject-errors': 'error',
      radix: 'error',
      'require-await': 'error',
      'vars-on-top': 'error',
      yoda: 'error',

      // ES6+ rules
      'arrow-body-style': ['error', 'as-needed'],
      'no-confusing-arrow': 'error',
      'no-duplicate-imports': 'error',
      'no-useless-computed-key': 'error',
      'no-useless-constructor': 'error',
      'no-useless-rename': 'error',
      'object-shorthand': 'error',
      'prefer-arrow-callback': 'error',
      'prefer-destructuring': ['error', { object: true, array: false }],
      'prefer-rest-params': 'error',
      'prefer-spread': 'error',
      'prefer-template': 'error',
      'rest-spread-spacing': 'error',
      'template-curly-spacing': 'error',

      // Project-specific rules
      'no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
        },
      ],
    },
  },

  // Configuration for JSX files
  {
    files: ['**/*.jsx'],

    languageOptions: {
      parser: babelParser,
      ecmaVersion: 2024,
      sourceType: 'module',
      parserOptions: {
        requireConfigFile: false,
        babelOptions: {
          presets: ['@babel/preset-react'],
        },
      },
      globals: {
        // Browser globals
        document: 'readonly',
        window: 'readonly',
        console: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
        requestIdleCallback: 'readonly',
        IdleDeadline: 'readonly',
        HTMLElement: 'readonly',
        Text: 'readonly',
        Event: 'readonly',
        global: 'writable',
      },
    },

    rules: {
      // Basic rules for JSX - components that are used in JSX
      'no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_|^(Counter|TodoList|Timer|DynamicList|ProgressBar|ControlledForm|NotificationSystem|ExpensiveCalculation|ClassCounter|App)$',
          ignoreRestSiblings: true,
        },
      ],
      'consistent-return': 'error',
      'no-alert': 'warn',
      radix: 'error',
      'prefer-const': 'error',
      'no-console': 'off',
      // Disable some rules that can conflict with JSX
      'no-unused-expressions': ['error', { allowShortCircuit: true, allowTernary: true }],
    },
  },

  // Configuration for Jest test files
  {
    files: ['tests/**/*.js'],

    languageOptions: {
      globals: {
        describe: 'readonly',
        test: 'readonly',
        it: 'readonly',
        expect: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
        beforeAll: 'readonly',
        afterAll: 'readonly',
        jest: 'readonly',
        require: 'readonly',
        Node: 'readonly',
      },
    },
  },

  // Ignore example and documentation files
  {
    ignores: [
      'examples/**/*.html',
      'docs/**',
      'node_modules/**',
      '*.config.js',
      'examples/jsx/app.js', // This is the transpiled file, not the source
    ],
  },
];
