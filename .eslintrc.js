/** @type {import('eslint').Linter.Config} */
const config = {
    extends: ['next/core-web-vitals'],
    rules: {
        '@typescript-eslint/no-explicit-any': 'off',
    },
}

module.exports = config
