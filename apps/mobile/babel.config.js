/** @type {import('@babel/core').TransformOptions} */
module.exports = function (api) {
	api.cache(true);
	return {
		presets: [
			[
				'babel-preset-expo',
				{
					jsxRuntime: 'automatic',
				},
			],
		],
		plugins: ['react-native-reanimated/plugin'],
		env: {
			test: {
				plugins: ['@babel/plugin-transform-modules-commonjs'],
			},
		},
	};
};
