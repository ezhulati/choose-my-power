import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['dist'] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],
      
      // Texas Branding Enforcement Rules
      'no-restricted-syntax': [
        'error',
        {
          selector: 'Literal[value=/bg-blue-[0-9]+/]',
          message: 'Use texas-navy instead of generic blue backgrounds. Replace with bg-texas-navy or bg-texas-navy/[opacity]'
        },
        {
          selector: 'Literal[value=/bg-red-[0-9]+/]',
          message: 'Use texas-red instead of generic red backgrounds. Replace with bg-texas-red or bg-texas-red/[opacity]'
        },
        {
          selector: 'Literal[value=/text-blue-[0-9]+/]',
          message: 'Use texas-navy instead of generic blue text. Replace with text-texas-navy'
        },
        {
          selector: 'Literal[value=/text-red-[0-9]+/]',
          message: 'Use texas-red instead of generic red text. Replace with text-texas-red'
        },
        {
          selector: 'Literal[value=/border-blue-[0-9]+/]',
          message: 'Use texas-navy instead of generic blue borders. Replace with border-texas-navy or border-texas-navy/[opacity]'
        },
        {
          selector: 'Literal[value=/border-red-[0-9]+/]',
          message: 'Use texas-red instead of generic red borders. Replace with border-texas-red or border-texas-red/[opacity]'
        },
        {
          selector: 'Literal[value=/hover:bg-white(?!\\s+hover:text-)/]',
          message: 'hover:bg-white must be paired with hover:text-[color] to maintain contrast accessibility'
        },
        {
          selector: 'Literal[value=/focus:ring-blue-[0-9]+/]',
          message: 'Use texas-navy for focus rings. Replace with focus:ring-texas-navy'
        }
      ]
    },
  }
);
