import '@testing-library/jest-native/extend-expect';

// Mock Expo modules
jest.mock('expo-constants', () => ({
	default: {
		expoConfig: {
			extra: {
				supabaseUrl: 'https://test.supabase.co',
				supabaseAnonKey: 'test-key',
			},
		},
	},
}));

jest.mock('expo-secure-store', () => ({
	getItemAsync: jest.fn(),
	setItemAsync: jest.fn(),
	deleteItemAsync: jest.fn(),
}));

jest.mock('expo-auth-session', () => ({
	makeRedirectUri: jest.fn(() => 'test://auth'),
	useAuthRequest: jest.fn(() => [null, null, jest.fn()]),
}));

jest.mock('expo-web-browser', () => ({
	openAuthSessionAsync: jest.fn(),
}));

// Mock React Native modules
jest.mock('react-native/Libraries/Animated/NativeAnimatedHelper');

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () =>
	require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

// Mock Supabase
jest.mock('../lib/supabase', () => ({
	supabase: {
		auth: {
			signInWithOAuth: jest.fn(),
			signOut: jest.fn(),
			getSession: jest.fn(),
			onAuthStateChange: jest.fn(),
		},
		from: jest.fn(() => ({
			select: jest.fn().mockReturnThis(),
			insert: jest.fn().mockReturnThis(),
			update: jest.fn().mockReturnThis(),
			delete: jest.fn().mockReturnThis(),
			eq: jest.fn().mockReturnThis(),
			single: jest.fn(),
		})),
	},
}));

// Mock environment variables
process.env.EXPO_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';
process.env.EXPO_PUBLIC_OPENAI_API_KEY = 'test-openai-key';
process.env.EXPO_PUBLIC_ELEVENLABS_API_KEY = 'test-elevenlabs-key';

// Global test utilities
global.console = {
	...console,
	// Uncomment to ignore a specific log level
	// log: jest.fn(),
	// debug: jest.fn(),
	// info: jest.fn(),
	// warn: jest.fn(),
	// error: jest.fn(),
};
