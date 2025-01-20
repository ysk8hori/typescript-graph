import globals from 'globals';
import pluginJs from '@eslint/js';
import { flatConfigs as pluginImportFlatConfigs } from 'eslint-plugin-import';
import tseslint from 'typescript-eslint';

/** @type {import('eslint').Linter.Config[]} */
export default [
  { files: ['**/*.{js,mjs,cjs,ts}'] },
  { languageOptions: { globals: globals.browser } },
  pluginJs.configs.recommended,
  pluginImportFlatConfigs.recommended,
  pluginImportFlatConfigs.typescript,
  ...tseslint.configs.strict,
  ...tseslint.configs.stylistic,
  {
    // eslint
    rules: {
      'import/order': 'error',
    },
  },
  {
    // typescript-eslint
    rules: {
      '@typescript-eslint/no-invalid-void-type': 'off',
      '@typescript-eslint/consistent-type-imports': 'error',
    },
  },
];
