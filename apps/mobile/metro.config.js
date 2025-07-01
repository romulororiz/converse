const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

config.watchFolders = [
	path.resolve(__dirname, '../../node_modules'),
	path.resolve(__dirname, '../../'),
];

// Handle TypeScript files properly
config.resolver.sourceExts = ['js', 'jsx', 'json', 'ts', 'tsx'];
config.resolver.platforms = ['ios', 'android', 'native', 'web'];

// Exclude problematic TypeScript files from node_modules
config.resolver.resolverMainFields = ['react-native', 'browser', 'main'];

module.exports = config;
