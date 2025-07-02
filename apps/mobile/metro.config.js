const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Workspace root paths
const workspaceRoot = path.resolve(__dirname, '../..');
const projectRoot = __dirname;

config.watchFolders = [workspaceRoot];
config.resolver.nodeModulesPaths = [
	path.resolve(projectRoot, 'node_modules'),
	path.resolve(workspaceRoot, 'node_modules'),
];

// Handle TypeScript files properly
config.resolver.sourceExts = ['js', 'jsx', 'json', 'ts', 'tsx'];
config.resolver.platforms = ['ios', 'android', 'native'];

// Exclude problematic TypeScript files from node_modules
config.resolver.resolverMainFields = ['react-native', 'browser', 'main'];

// Block list for problematic modules
config.resolver.blockList = [
	// Block Node.js specific modules
	/.*\.server\.(js|ts|tsx)$/,
	/.*@upstash\/redis.*/,
	/.*uncrypto.*/,
];

module.exports = config;
