import eslintReact from '@eslint-react/eslint-plugin'
import js from '@eslint/js'
import eslintConfigPrettier from 'eslint-config-prettier/flat'
import jsxA11y from 'eslint-plugin-jsx-a11y'
import perfectionist from 'eslint-plugin-perfectionist'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import unicorn from 'eslint-plugin-unicorn'
import { defineConfig, globalIgnores } from 'eslint/config'
import globals from 'globals'
import tseslint from 'typescript-eslint'

export default defineConfig([
  globalIgnores(['dist', 'coverage', 'playwright-report', 'test-results', '.lighthouseci']),

  js.configs.recommended,
  tseslint.configs.strictTypeChecked,
  tseslint.configs.stylisticTypeChecked,
  unicorn.configs.recommended,
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    linterOptions: {
      reportUnusedDisableDirectives: 'error',
    },
    plugins: { perfectionist },
    rules: {
      // Types over interfaces: unions are first-class (see DECISIONS #6)
      '@typescript-eslint/consistent-type-definitions': ['error', 'type'],
      '@typescript-eslint/consistent-type-imports': 'error',
      '@typescript-eslint/switch-exhaustiveness-check': 'error',
      eqeqeq: ['error', 'always'],
      'no-console': 'error',

      // Deterministic module surface; object keys keep their meaningful order
      'perfectionist/sort-imports': 'error',
      'perfectionist/sort-named-imports': 'error',
      'perfectionist/sort-exports': 'error',
      'perfectionist/sort-named-exports': 'error',

      // React components live in PascalCase files, everything else in camelCase
      'unicorn/filename-case': ['error', { cases: { camelCase: true, pascalCase: true } }],
      // `null` is part of the domain (unplayed scores) and of React (`return null`)
      'unicorn/no-null': 'off',
      // `props`, `ref`, `e` etc. are idiomatic in React code
      'unicorn/prevent-abbreviations': 'off',
    },
  },

  {
    files: ['**/*.tsx'],
    extends: [
      eslintReact.configs['strict-type-checked'],
      reactHooks.configs.flat['recommended-latest'],
      reactRefresh.configs.vite,
      jsxA11y.flatConfigs.strict,
    ],
    languageOptions: {
      globals: globals.browser,
    },
  },

  {
    // Config files export a config object built by a factory call by design
    files: ['*.config.{js,ts}'],
    rules: {
      'unicorn/no-top-level-side-effects': 'off',
    },
  },

  {
    files: ['**/*.js'],
    extends: [tseslint.configs.disableTypeChecked],
    languageOptions: {
      globals: globals.node,
    },
  },

  eslintConfigPrettier,
])
