module.exports = {
  env: { node: true, es2020: true },
  parser: '@typescript-eslint/parser',
  parserOptions: { sourceType: 'module' },
  plugins: ['@typescript-eslint', 'prettier'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:prettier/recommended',
  ],
  ignorePatterns: ['dist/', 'node_modules/'],
  rules: { 'prettier/prettier': 'error' },
};
