/**
 * ESLint Flat Config
 * Configuração moderna do ESLint com suporte a ESM e JSX
 */

import js from '@eslint/js';
import prettier from 'eslint-config-prettier';
import babelParser from '@babel/eslint-parser';

export default [
  // Configuração base recomendada do ESLint
  js.configs.recommended,

  // Desabilita regras que conflitam com Prettier
  prettier,

  // Configuração personalizada
  {
    files: ['**/*.js'],

    languageOptions: {
      ecmaVersion: 2024,
      sourceType: 'module',
      globals: {
        // Globals do browser
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

        // Globals customizados do MiniReact
        global: 'writable',
      },
    },

    rules: {
      // Regras de estilo (que não conflitam com Prettier)
      camelcase: ['error', { properties: 'never' }],
      'consistent-return': 'error',
      curly: ['error', 'multi-line'],
      'default-case': 'warn',
      'dot-notation': 'error',
      eqeqeq: ['error', 'always', { null: 'ignore' }],
      'guard-for-in': 'error',
      'no-alert': 'warn',
      'no-console': 'off', // Permitir console para desenvolvimento
      'no-else-return': 'error',
      'no-empty-function': 'error',
      'no-eval': 'error',
      'no-extend-native': 'error',
      'no-extra-bind': 'error',
      'no-implicit-coercion': 'error',
      'no-implied-eval': 'error',
      'no-invalid-this': 'off', // Necessário para classes
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

      // Regras de ES6+
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

      // Regras específicas do projeto
      'no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
        },
      ],
    },
  },

  // Configuração para arquivos JSX
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
        // Globals do browser
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
      // Regras básicas para JSX - components that are used in JSX
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
      // Desabilitar algumas regras que podem conflitar com JSX
      'no-unused-expressions': ['error', { allowShortCircuit: true, allowTernary: true }],
    },
  },

  // Ignorar arquivos de exemplo e documentação
  {
    ignores: [
      'examples/**/*.html',
      'docs/**',
      'node_modules/**',
      '*.config.js',
      'examples/jsx/app.js', // Este é o arquivo transpilado, não o fonte
    ],
  },
];
