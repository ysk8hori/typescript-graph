import globals from 'globals';
import pluginJs from '@eslint/js';
import { flatConfigs as pluginImportFlatConfigs } from 'eslint-plugin-import';
import tseslint from 'typescript-eslint';

/** @type {import('eslint').Linter.Config[]} */
export default [
  { files: ['**/*.{ts}'] },
  {
    files: ['**/*.{js,mjs,cjs}'],
    extends: [tseslint.configs.disableTypeChecked],
  },
  { languageOptions: { globals: globals.browser } },
  pluginJs.configs.recommended,
  pluginImportFlatConfigs.recommended,
  pluginImportFlatConfigs.typescript,
  ...tseslint.configs.recommended,
  ...tseslint.configs.strict,
  ...tseslint.configs.stylistic,
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  {
    // eslint
    rules: {
      'import/order': 'error',
      'import/no-unresolved': 'off',
    },
  },
  {
    // typescript-eslint
    rules: {
      '@typescript-eslint/no-invalid-void-type': 'off',
      '@typescript-eslint/consistent-type-imports': 'error',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { args: 'all', argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/no-floating-promises': 'error',
    },
  },
];
