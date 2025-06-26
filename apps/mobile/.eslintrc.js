module.exports = {
	extends: ['expo', '@react-native', 'prettier'],
	plugins: ['@typescript-eslint', 'prettier'],
	parser: '@typescript-eslint/parser',
	parserOptions: {
		ecmaVersion: 2020,
		sourceType: 'module',
		ecmaFeatures: {
			jsx: true,
		},
	},
	rules: {
		'prettier/prettier': 'error',
		'@typescript-eslint/no-unused-vars': 'error',
		'@typescript-eslint/explicit-function-return-type': 'off',
		'@typescript-eslint/explicit-module-boundary-types': 'off',
		'@typescript-eslint/no-explicit-any': 'warn',
		'react-hooks/rules-of-hooks': 'error',
		'react-hooks/exhaustive-deps': 'warn',
		'react-native/no-unused-styles': 'error',
		'react-native/split-platform-components': 'error',
		'react-native/no-inline-styles': 'warn',
		'react-native/no-color-literals': 'warn',
		'react-native/no-raw-text': 'off',
	},
	env: {
		'react-native/react-native': true,
		jest: true,
	},
	settings: {
		react: {
			version: 'detect',
		},
	},
	ignorePatterns: [
		'node_modules/',
		'.expo/',
		'dist/',
		'*.config.js',
		'*.config.ts',
	],
};
