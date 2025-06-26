module.exports = {
  extends: ['./eslint.config.js'],
  rules: {
    // Performance-related rules
    'no-console': ['warn', { allow: ['warn', 'error'] }],
    'prefer-const': 'error',
    'no-var': 'error',
    
    // React-specific rules for inventory components
    'react-hooks/exhaustive-deps': 'error',
    'react/jsx-key': 'error',
    'react/no-array-index-key': 'warn',
    
    // TypeScript rules for better type safety
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/prefer-nullish-coalescing': 'error',
    '@typescript-eslint/prefer-optional-chain': 'error',
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    
    // Custom rules for inventory management
    'no-magic-numbers': ['warn', { 
      ignore: [0, 1, -1, 100],
      ignoreArrayIndexes: true,
      enforceConst: true
    }],
    
    // Security rules
    'no-eval': 'error',
    'no-implied-eval': 'error',
    'no-new-func': 'error',
    
    // Error handling rules
    'no-throw-literal': 'error',
    'prefer-promise-reject-errors': 'error',
  },
  
  overrides: [
    {
      files: ['**/*.test.ts', '**/*.test.tsx', '**/__tests__/**/*'],
      rules: {
        'no-magic-numbers': 'off',
        '@typescript-eslint/no-explicit-any': 'off',
      },
    },
    {
      files: ['**/hooks/**/*.ts', '**/hooks/**/*.tsx'],
      rules: {
        'react-hooks/rules-of-hooks': 'error',
        'react-hooks/exhaustive-deps': 'error',
      },
    },
    {
      files: ['**/utils/**/*.ts'],
      rules: {
        'no-console': ['error', { allow: ['warn', 'error'] }],
        'prefer-const': 'error',
      },
    },
  ],
};