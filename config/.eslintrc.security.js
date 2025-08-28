/**
 * Security-focused ESLint configuration
 * Detects potential security vulnerabilities in JavaScript/TypeScript code
 */

module.exports = {
  extends: [
    'eslint:recommended',
    '@typescript-eslint/recommended',
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true
    }
  },
  env: {
    browser: true,
    node: true,
    es2022: true
  },
  plugins: [
    '@typescript-eslint',
    'security'
  ],
  rules: {
    // Security-specific rules
    'security/detect-object-injection': 'error',
    'security/detect-non-literal-regexp': 'error',
    'security/detect-unsafe-regex': 'error',
    'security/detect-buffer-noassert': 'error',
    'security/detect-child-process': 'error',
    'security/detect-disable-mustache-escape': 'error',
    'security/detect-eval-with-expression': 'error',
    'security/detect-no-csrf-before-method-override': 'error',
    'security/detect-non-literal-fs-filename': 'warn',
    'security/detect-non-literal-require': 'warn',
    'security/detect-possible-timing-attacks': 'error',
    'security/detect-pseudoRandomBytes': 'error',

    // Prevent dangerous patterns
    'no-eval': 'error',
    'no-implied-eval': 'error',
    'no-new-func': 'error',
    'no-script-url': 'error',
    'no-console': 'warn', // Prevent info leakage in production

    // Prevent prototype pollution
    'no-proto': 'error',
    'no-extend-native': 'error',

    // XSS prevention
    'no-inner-declarations': 'error',

    // Type safety for security
    '@typescript-eslint/no-explicit-any': 'error',
    '@typescript-eslint/no-unsafe-assignment': 'error',
    '@typescript-eslint/no-unsafe-call': 'error',
    '@typescript-eslint/no-unsafe-member-access': 'error',
    '@typescript-eslint/no-unsafe-return': 'error',

    // Environment variable security
    'no-process-env': 'off', // Allow process.env usage
    
    // Custom security rules
    'no-restricted-syntax': [
      'error',
      {
        selector: 'CallExpression[callee.name="eval"]',
        message: 'eval() is dangerous and should not be used'
      },
      {
        selector: 'NewExpression[callee.name="Function"]',
        message: 'new Function() is dangerous and should not be used'
      },
      {
        selector: 'MemberExpression[property.name="innerHTML"]',
        message: 'innerHTML can lead to XSS attacks. Use textContent or sanitize input.'
      },
      {
        selector: 'JSXAttribute[name.name="dangerouslySetInnerHTML"]',
        message: 'dangerouslySetInnerHTML can lead to XSS attacks. Ensure input is sanitized.'
      }
    ],

    // Prevent hardcoded credentials
    'no-restricted-patterns': 'off', // Handled by custom patterns below
  },
  
  // Custom rules for detecting hardcoded secrets
  overrides: [
    {
      files: ['**/*.js', '**/*.ts', '**/*.jsx', '**/*.tsx'],
      rules: {
        'no-restricted-syntax': [
          'error',
          // Detect potential hardcoded API keys
          {
            selector: 'VariableDeclarator[id.name=/(?i)(api[_-]?key|secret|password|token)/] > Literal[value=/^[a-zA-Z0-9]{20,}$/]',
            message: 'Potential hardcoded API key or secret detected. Use environment variables instead.'
          },
          // Detect hardcoded passwords
          {
            selector: 'Property[key.name=/(?i)(password|secret|token)/] > Literal[value=/^[a-zA-Z0-9!@#$%^&*]{8,}$/]',
            message: 'Potential hardcoded password or secret detected. Use environment variables instead.'
          },
          // Detect eval usage
          {
            selector: 'CallExpression[callee.name="eval"]',
            message: 'eval() is dangerous and should not be used'
          },
          // Detect Function constructor
          {
            selector: 'NewExpression[callee.name="Function"]',
            message: 'new Function() is dangerous and should not be used'
          },
          // Detect innerHTML usage
          {
            selector: 'MemberExpression[property.name="innerHTML"]',
            message: 'innerHTML can lead to XSS attacks. Use textContent or sanitize input.'
          },
          // Detect document.write
          {
            selector: 'MemberExpression[object.name="document"][property.name="write"]',
            message: 'document.write() can lead to XSS attacks and should be avoided.'
          }
        ]
      }
    }
  ],

  settings: {
    react: {
      version: 'detect'
    }
  },

  ignorePatterns: [
    'node_modules/',
    'dist/',
    '.astro/',
    'public/',
    '*.config.js',
    '*.config.mjs',
    '.eslintrc.js'
  ]
};