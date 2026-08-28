import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'
import { importX as pluginImportX } from 'eslint-plugin-import-x'

export default defineConfig([
  globalIgnores(['dist', 'dev-dist', 'node_modules', 'modules', 'playwright-report', 'test-results', '*.config.js', 'playwright.config.ts']),
  ...tseslint.configs.recommended,
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    plugins: {
      'import-x': pluginImportX,
    },
    settings: {
      'import-x/core-modules': ['virtual:pwa-register'],
      'import-x/resolver': {
        typescript: { alwaysTryTypes: true },
        node: true,
      },
      'import-x/ignore': ['\\.(css|scss|less|svg|png|jpg|jpeg|gif|webp|ico|woff2?|pdf|json)$'],
    },
    languageOptions: {
      ecmaVersion: 2020,
      globals: { ...globals.browser, process: 'readonly', IDBValidKey: 'readonly' },
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    rules: {
      // Faz6: no-console – prod log sızıntısını engelle
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'import-x/no-unresolved': 'error',
      'no-unused-vars': 'off',
      'react-refresh/only-export-components': 'off',
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unused-vars': 'off',
      'react-hooks/exhaustive-deps': 'off',
      'react-hooks/set-state-in-effect': 'off',
      'react-hooks/purity': 'off',
      'prefer-const': 'off',
      'no-useless-escape': 'off',
      'no-empty': 'off',
      'no-unused-expressions': 'off',
      '@typescript-eslint/no-unused-expressions': 'off',
      '@typescript-eslint/ban-ts-comment': 'off',
      'no-prototype-builtins': 'off',
      'react-hooks/immutability': 'off',
      // as any regresyonunu engelle: yeni `as any` cast'leri lint hatası verir
      'no-restricted-syntax': ['error', {
        selector: 'TSAsExpression[typeAnnotation.type="TSAnyKeyword"], TSAsExpression[typeAnnotation.type="TSArrayType"][typeAnnotation.elementType.type="TSAnyKeyword"]',
        message: "'as any' kullanimi yasak: tip guvenli cast kullan (dogru tip veya `as unknown as X`)",
      }],
      '@typescript-eslint/consistent-type-assertions': ['error', { assertionStyle: 'as' }],
      'import-x/order': ['warn', {
        groups: ['builtin', 'external', 'internal', ['parent', 'sibling', 'index'], 'type'],
        'newlines-between': 'ignore',
        alphabetize: { order: 'asc', caseInsensitive: true },
        pathGroups: [
          {
            pattern: '@/**',
            group: 'internal',
            position: 'before',
          },
        ],
        pathGroupsExcludedImportTypes: ['builtin', 'type'],
      }],
    },
  },
  {
    files: ['src/utils/logger.ts'],
    rules: { 'no-console': 'off' },
  },
])
