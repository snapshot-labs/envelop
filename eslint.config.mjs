import config from '@snapshot-labs/eslint-config';

export default [
  ...config,
  {
    rules: {
      '@typescript-eslint/consistent-type-imports': 'off',
      'import-x/order': 'off',
      'prettier/prettier': 'off',
      'sort-imports': 'off'
    }
  }
];
