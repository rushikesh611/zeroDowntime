import js from '@eslint/js';

export default [
  {
    ignores: [
      '.next/**',
      'node_modules/**',
      'out/**',
      '.git/**',
      'dist/**',
      'build/**',
    ],
  },
  js.configs.recommended,
  {
    files: ['**/*.{js,jsx,ts,tsx,mjs}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    rules: {
      'react/no-unknown-property': 'off',
      'no-unused-vars': 'warn',
      'no-undef': 'off', // TypeScript handles this
    },
  },
];