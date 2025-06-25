import Constants from 'expo-constants';

// API key validation and security utilities
interface ApiKeys {
	openai?: string;
	elevenlabs?: string;
	supabaseUrl?: string;
	supabaseAnonKey?: string;
}

class ApiKeyManager {
	private static instance: ApiKeyManager;
	private keys: ApiKeys = {};
	private validated: Set<string> = new Set();

	private constructor() {
		this.loadKeys();
	}

	static getInstance(): ApiKeyManager {
		if (!ApiKeyManager.instance) {
			ApiKeyManager.instance = new ApiKeyManager();
		}
		return ApiKeyManager.instance;
	}

	private loadKeys() {
		// Load keys from environment variables
		this.keys = {
			openai:
				process.env.EXPO_PUBLIC_OPENAI_API_KEY || process.env.OPENAI_API_KEY,
			elevenlabs:
				process.env.EXPO_PUBLIC_ELEVENLABS_API_KEY ||
				process.env.ELEVENLABS_API_KEY,
			supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL,
			supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
		};
	}

	private validateKeyFormat(
		key: string,
		type: 'openai' | 'elevenlabs' | 'supabase'
	): boolean {
		if (!key || typeof key !== 'string') {
			return false;
		}

		switch (type) {
			case 'openai':
				// OpenAI keys start with 'sk-' and are 51 characters long
				return key.startsWith('sk-') && key.length >= 50;

			case 'elevenlabs':
				// ElevenLabs keys are typically 32 characters long
				return key.length >= 20 && /^[a-f0-9]+$/i.test(key);

			case 'supabase':
				// Supabase URLs should be valid URLs
				if (key.includes('supabase')) {
					try {
						new URL(key);
						return true;
					} catch {
						return false;
					}
				}
				// Supabase keys are base64-like strings
				return key.length >= 20;

			default:
				return false;
		}
	}

	getOpenAIKey(): string {
		const key = this.keys.openai;

		if (!key) {
			console.error(
				'OpenAI API key not found. Please check your environment variables.'
			);
			throw new Error('OpenAI API key not configured');
		}

		if (!this.validated.has('openai')) {
			if (!this.validateKeyFormat(key, 'openai')) {
				console.error('Invalid OpenAI API key format');
				throw new Error('Invalid OpenAI API key format');
			}
			this.validated.add('openai');
		}

		return key;
	}

	getElevenLabsKey(): string | null {
		const key = this.keys.elevenlabs;

		if (!key) {
			console.warn(
				'ElevenLabs API key not found. Voice features will use fallback.'
			);
			return null;
		}

		if (!this.validated.has('elevenlabs')) {
			if (!this.validateKeyFormat(key, 'elevenlabs')) {
				console.warn(
					'Invalid ElevenLabs API key format. Voice features will use fallback.'
				);
				return null;
			}
			this.validated.add('elevenlabs');
		}

		return key;
	}

	getSupabaseConfig(): { url: string; anonKey: string } {
		const url = this.keys.supabaseUrl;
		const anonKey = this.keys.supabaseAnonKey;

		if (!url || !anonKey) {
			throw new Error(
				'Supabase configuration not found. Please check your environment variables.'
			);
		}

		if (!this.validated.has('supabase')) {
			if (
				!this.validateKeyFormat(url, 'supabase') ||
				!this.validateKeyFormat(anonKey, 'supabase')
			) {
				throw new Error('Invalid Supabase configuration');
			}
			this.validated.add('supabase');
		}

		return { url, anonKey };
	}

	// Obfuscate key for logging purposes
	obfuscateKey(key: string): string {
		if (!key || key.length < 8) {
			return '[INVALID_KEY]';
		}

		const start = key.slice(0, 4);
		const end = key.slice(-4);
		const middle = '*'.repeat(Math.max(4, key.length - 8));

		return `${start}${middle}${end}`;
	}

	// Validate all keys at startup
	validateAllKeys(): { valid: boolean; errors: string[] } {
		const errors: string[] = [];

		try {
			this.getOpenAIKey();
		} catch (error) {
			errors.push(
				`OpenAI: ${error instanceof Error ? error.message : 'Unknown error'}`
			);
		}

		try {
			this.getElevenLabsKey();
		} catch (error) {
			// ElevenLabs is optional, only warn
			console.warn('ElevenLabs key validation failed:', error);
		}

		try {
			this.getSupabaseConfig();
		} catch (error) {
			errors.push(
				`Supabase: ${error instanceof Error ? error.message : 'Unknown error'}`
			);
		}

		return {
			valid: errors.length === 0,
			errors,
		};
	}

	// Check if we're in development mode
	isDevelopment(): boolean {
		return __DEV__ || process.env.NODE_ENV === 'development';
	}

	// Log key status for debugging (without exposing actual keys)
	logKeyStatus() {
		if (!this.isDevelopment()) {
			return;
		}

		console.log('API Key Status:');
		console.log(
			`- OpenAI: ${this.keys.openai ? this.obfuscateKey(this.keys.openai) : 'NOT_SET'}`
		);
		console.log(
			`- ElevenLabs: ${this.keys.elevenlabs ? this.obfuscateKey(this.keys.elevenlabs) : 'NOT_SET'}`
		);
		console.log(
			`- Supabase URL: ${this.keys.supabaseUrl ? this.obfuscateKey(this.keys.supabaseUrl) : 'NOT_SET'}`
		);
		console.log(
			`- Supabase Key: ${this.keys.supabaseAnonKey ? this.obfuscateKey(this.keys.supabaseAnonKey) : 'NOT_SET'}`
		);
	}
}

// Rate limiting for API calls
export class ApiRateLimiter {
	private static instance: ApiRateLimiter;
	private requestCounts: Map<string, { count: number; resetTime: number }> =
		new Map();

	// Rate limits per service (requests per minute)
	private limits = {
		openai: 20, // Conservative limit for OpenAI
		elevenlabs: 10, // Conservative limit for ElevenLabs
		supabase: 100, // Higher limit for database operations
	};

	private constructor() {}

	static getInstance(): ApiRateLimiter {
		if (!ApiRateLimiter.instance) {
			ApiRateLimiter.instance = new ApiRateLimiter();
		}
		return ApiRateLimiter.instance;
	}

	canMakeRequest(
		service: 'openai' | 'elevenlabs' | 'supabase',
		userId?: string
	): boolean {
		const key = userId ? `${service}:${userId}` : service;
		const now = Date.now();
		const windowMs = 60000; // 1 minute window

		const record = this.requestCounts.get(key);

		if (!record || now >= record.resetTime) {
			// Reset window
			this.requestCounts.set(key, {
				count: 1,
				resetTime: now + windowMs,
			});
			return true;
		}

		if (record.count >= this.limits[service]) {
			console.warn(
				`Rate limit exceeded for ${service}. Current: ${record.count}, Limit: ${this.limits[service]}`
			);
			return false;
		}

		record.count++;
		return true;
	}

	getRemainingRequests(
		service: 'openai' | 'elevenlabs' | 'supabase',
		userId?: string
	): number {
		const key = userId ? `${service}:${userId}` : service;
		const record = this.requestCounts.get(key);

		if (!record || Date.now() >= record.resetTime) {
			return this.limits[service];
		}

		return Math.max(0, this.limits[service] - record.count);
	}

	getResetTime(
		service: 'openai' | 'elevenlabs' | 'supabase',
		userId?: string
	): Date | null {
		const key = userId ? `${service}:${userId}` : service;
		const record = this.requestCounts.get(key);

		if (!record || Date.now() >= record.resetTime) {
			return null;
		}

		return new Date(record.resetTime);
	}
}

// Secure API request wrapper
export async function secureApiRequest(
	service: 'openai' | 'elevenlabs' | 'supabase',
	requestFn: () => Promise<any>,
	userId?: string
): Promise<any> {
	const rateLimiter = ApiRateLimiter.getInstance();

	// Check rate limit
	if (!rateLimiter.canMakeRequest(service, userId)) {
		const resetTime = rateLimiter.getResetTime(service, userId);
		const waitTime = resetTime
			? Math.ceil((resetTime.getTime() - Date.now()) / 1000)
			: 60;
		throw new Error(
			`Rate limit exceeded. Please wait ${waitTime} seconds before trying again.`
		);
	}

	try {
		const result = await requestFn();
		return result;
	} catch (error) {
		// Log error without exposing sensitive information
		console.error(
			`API request failed for ${service}:`,
			error instanceof Error ? error.message : 'Unknown error'
		);
		throw error;
	}
}

// Export singleton instances
export const apiKeyManager = ApiKeyManager.getInstance();
export const apiRateLimiter = ApiRateLimiter.getInstance();

// Utility functions
export function validateApiKeys(): { valid: boolean; errors: string[] } {
	return apiKeyManager.validateAllKeys();
}

export function logApiKeyStatus() {
	apiKeyManager.logKeyStatus();
}
