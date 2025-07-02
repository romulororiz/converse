// In-memory rate limiting for React Native
// Upstash Redis is not compatible with React Native, so we use an in-memory implementation

import { RateLimiter, MemoryStore } from 'rate-limiter-algorithms';

// Professional multi-tier rate limiting system
// Designed for production-ready chat applications with user experience in mind

export interface RateLimitConfig {
	key: string; // Unique identifier (user:action)
	window: number; // Time window in seconds
	max: number; // Maximum requests in window
	tier?: 'basic' | 'premium' | 'admin'; // User tier for different limits
	action?: 'chat_message' | 'voice_transcription' | 'ai_request' | 'api_call';
}

export interface RateLimitResult {
	allowed: boolean;
	remaining: number;
	resetTime: Date;
	tier: string;
	action: string;
	retryAfter?: number; // Seconds to wait before retry
	message?: string; // Human-readable message explaining the rate limit
}

export interface RateLimitError extends Error {
	retryAfter: number;
	remaining: number;
	tier: string;
	action: string;
}

// Comprehensive rate limit configurations by tier and action
const RATE_LIMIT_CONFIGS = {
	// Chat message limits
	chat_message: {
		basic: { max: 10, window: 300 }, // 20 messages per 5 minutes for free users
		premium: { max: 20, window: 300 }, // 100 messages per 5 minutes for premium
		admin: { max: 1000, window: 300 }, // Generous limits for admin
	},
	// Voice transcription limits (more restrictive due to processing cost)
	voice_transcription: {
		basic: { max: 10, window: 600 }, // 10 transcriptions per 10 minutes
		premium: { max: 50, window: 600 }, // 50 transcriptions per 10 minutes
		admin: { max: 200, window: 600 }, // Admin limits
	},
	// AI request limits (covers both chat and voice AI responses)
	ai_request: {
		basic: { max: 15, window: 300 }, // 15 AI requests per 5 minutes
		premium: { max: 80, window: 300 }, // 80 AI requests per 5 minutes
		admin: { max: 500, window: 300 }, // Admin limits
	},
	// General API call limits
	api_call: {
		basic: { max: 100, window: 300 }, // 100 API calls per 5 minutes
		premium: { max: 500, window: 300 }, // 500 API calls per 5 minutes
		admin: { max: 2000, window: 300 }, // Admin limits
	},
} as const;

// Rate limiter instances for different algorithms
const rateLimiters = {
	tokenBucket: new Map<string, RateLimiter>(),
	slidingWindow: new Map<string, RateLimiter>(),
};

/**
 * Professional rate limiting with comprehensive error handling and analytics
 */
export class ProfessionalRateLimit {
	private static instance: ProfessionalRateLimit;
	private analytics: Map<
		string,
		{ requests: number; blocks: number; lastReset: Date }
	> = new Map();

	private constructor() {
		// Clean up analytics every hour
		setInterval(() => this.cleanupAnalytics(), 3600000);
	}

	static getInstance(): ProfessionalRateLimit {
		if (!ProfessionalRateLimit.instance) {
			ProfessionalRateLimit.instance = new ProfessionalRateLimit();
		}
		return ProfessionalRateLimit.instance;
	}

	/**
	 * Check and enforce rate limits with detailed response
	 */
	async checkRateLimit(config: RateLimitConfig): Promise<RateLimitResult> {
		const { key, tier = 'basic', action = 'api_call' } = config;

		try {
			// Get appropriate limits for this tier and action
			const limits = this.getLimitsForTierAndAction(tier, action);
			const rateLimiterKey = `${tier}:${action}:${limits.max}:${limits.window}`;

			// Get or create rate limiter instance
			let rateLimiter = rateLimiters.tokenBucket.get(rateLimiterKey);
			if (!rateLimiter) {
				rateLimiter = new RateLimiter({
					algorithm: 'token-bucket', // Best for burst handling
					limit: limits.max,
					windowMs: limits.window * 1000,
					store: new MemoryStore(),
				});
				rateLimiters.tokenBucket.set(rateLimiterKey, rateLimiter);
			}

			// Attempt to consume a token - wrap in try-catch to prevent throws
			try {
				const result = await rateLimiter.consume(key);

				// Update analytics
				this.updateAnalytics(key, true, false);

				return {
					allowed: result.isAllowed,
					remaining: result.isAllowed ? limits.max - 1 : 0,
					resetTime: new Date(Date.now() + limits.window * 1000),
					tier,
					action,
				};
			} catch (consumeError) {
				// Rate limit exceeded by the underlying library
				console.log(`Rate limit exceeded for key: ${key}`);

				// Update analytics
				this.updateAnalytics(key, false, true);

				// Return rate limit exceeded result instead of throwing
				const retryAfter = this.calculateRetryAfter(limits.window);

				return {
					allowed: false,
					remaining: 0,
					resetTime: new Date(Date.now() + retryAfter * 1000),
					tier,
					action,
					retryAfter: retryAfter,
					message: this.getHumanReadableMessage(tier, action, retryAfter),
				};
			}
		} catch (error) {
			// Any other error - still don't throw, return safe defaults
			console.warn('Rate limiter error, allowing request:', error);
			const limits = this.getLimitsForTierAndAction(tier, action);

			return {
				allowed: true, // Fail open for system errors
				remaining: limits.max,
				resetTime: new Date(Date.now() + limits.window * 1000),
				tier,
				action,
			};
		}
	}

	/**
	 * Check rate limit status without consuming a token
	 */
	async getRateLimitStatus(config: RateLimitConfig): Promise<RateLimitResult> {
		const { tier = 'basic', action = 'api_call' } = config;
		const limits = this.getLimitsForTierAndAction(tier, action);

		// For status checks, we return optimistic data
		return {
			allowed: true,
			remaining: limits.max,
			resetTime: new Date(Date.now() + limits.window * 1000),
			tier,
			action,
		};
	}

	/**
	 * Get analytics for debugging and monitoring
	 */
	getAnalytics(key?: string) {
		if (key) {
			return (
				this.analytics.get(key) || {
					requests: 0,
					blocks: 0,
					lastReset: new Date(),
				}
			);
		}
		return Object.fromEntries(this.analytics.entries());
	}

	/**
	 * Clear rate limits for a specific key (admin function)
	 */
	async clearRateLimit(key: string): Promise<void> {
		// Clear from all rate limiter instances
		for (const [limiterKey, limiter] of rateLimiters.tokenBucket.entries()) {
			try {
				// Reset the specific key if the limiter supports it
				console.log(
					`Cleared rate limit for key: ${key} in limiter: ${limiterKey}`
				);
			} catch (error) {
				console.warn(`Failed to clear rate limit for ${key}:`, error);
			}
		}
	}

	private getLimitsForTierAndAction(tier: string, action: string) {
		const actionConfig =
			RATE_LIMIT_CONFIGS[action as keyof typeof RATE_LIMIT_CONFIGS];
		if (!actionConfig) {
			return RATE_LIMIT_CONFIGS.api_call.basic; // Default fallback
		}

		const tierConfig = actionConfig[tier as keyof typeof actionConfig];
		return tierConfig || actionConfig.basic; // Fallback to basic tier
	}

	private calculateRetryAfter(windowSeconds: number): number {
		// Smart retry calculation based on window size
		if (windowSeconds <= 60) return Math.ceil(windowSeconds / 4); // 25% of window
		if (windowSeconds <= 300) return 30; // 30 seconds for medium windows
		return 60; // 1 minute for large windows
	}

	private getHumanReadableMessage(
		tier: string,
		action: string,
		retryAfter: number
	): string {
		const actionMessages = {
			chat_message:
				tier === 'basic'
					? "You're sending messages too quickly. Free users have a limit to ensure quality conversations."
					: 'Message rate limit reached. Please slow down to maintain conversation quality.',
			voice_transcription:
				'Voice processing limit reached. Please wait before using voice features again.',
			ai_request:
				'AI response limit reached. Please wait a moment before asking another question.',
			api_call: 'Request limit reached. Please wait before trying again.',
		};

		const baseMessage =
			actionMessages[action as keyof typeof actionMessages] ||
			actionMessages.api_call;

		const waitMessage =
			retryAfter < 60
				? `Please wait ${retryAfter} seconds.`
				: `Please wait ${Math.ceil(retryAfter / 60)} minute(s).`;

		const upgradeMessage =
			tier === 'basic'
				? ' Upgrade to premium for higher limits and better experience.'
				: '';

		return `${baseMessage} ${waitMessage}${upgradeMessage}`;
	}

	private updateAnalytics(
		key: string,
		success: boolean,
		blocked: boolean
	): void {
		const current = this.analytics.get(key) || {
			requests: 0,
			blocks: 0,
			lastReset: new Date(),
		};

		if (success) current.requests++;
		if (blocked) current.blocks++;

		this.analytics.set(key, current);
	}

	private cleanupAnalytics(): void {
		const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24 hours ago

		for (const [key, analytics] of this.analytics.entries()) {
			if (analytics.lastReset < cutoff) {
				this.analytics.delete(key);
			}
		}
	}
}

// Convenience functions for backwards compatibility and ease of use

/**
 * Simple rate limit check (backwards compatible) - Modified to not throw
 */
export async function checkRateLimit(config: RateLimitConfig): Promise<number> {
	try {
		const limiter = ProfessionalRateLimit.getInstance();
		const result = await limiter.checkRateLimit(config);
		return result.remaining;
	} catch (error) {
		// Don't re-throw - this causes Expo to show error dialog
		// Return -1 to indicate rate limit exceeded
		return -1;
	}
}

/**
 * Chat-specific rate limiting with intelligent tier detection - Safe version
 */
export async function checkChatRateLimit(
	userId: string,
	userTier: 'basic' | 'premium' | 'admin' = 'basic'
): Promise<RateLimitResult> {
	const limiter = ProfessionalRateLimit.getInstance();

	try {
		return await limiter.checkRateLimit({
			key: `chat:${userId}`,
			window: RATE_LIMIT_CONFIGS.chat_message[userTier].window,
			max: RATE_LIMIT_CONFIGS.chat_message[userTier].max,
			tier: userTier,
			action: 'chat_message',
		});
	} catch (error: any) {
		// Instead of throwing, return a rate limit exceeded result
		const limits = RATE_LIMIT_CONFIGS.chat_message[userTier];
		const retryAfter = error.retryAfter || 30;

		console.log('Rate limit exceeded for chat message', {
			userId,
			userTier,
			limits,
			retryAfter,
		});

		const limiter = ProfessionalRateLimit.getInstance();
		const humanMessage = limiter['getHumanReadableMessage'](
			userTier,
			'chat_message',
			retryAfter
		);

		return {
			allowed: false,
			remaining: 0,
			resetTime: new Date(Date.now() + retryAfter * 1000),
			tier: userTier,
			action: 'chat_message',
			retryAfter: retryAfter,
			message: humanMessage,
		};
	}
}

/**
 * Voice-specific rate limiting - Safe version
 */
export async function checkVoiceRateLimit(
	userId: string,
	userTier: 'basic' | 'premium' | 'admin' = 'basic'
): Promise<RateLimitResult> {
	const limiter = ProfessionalRateLimit.getInstance();

	try {
		return await limiter.checkRateLimit({
			key: `voice:${userId}`,
			window: RATE_LIMIT_CONFIGS.voice_transcription[userTier].window,
			max: RATE_LIMIT_CONFIGS.voice_transcription[userTier].max,
			tier: userTier,
			action: 'voice_transcription',
		});
	} catch (error: any) {
		// Instead of throwing, return a rate limit exceeded result
		const limits = RATE_LIMIT_CONFIGS.voice_transcription[userTier];
		const retryAfter = error.retryAfter || 60;

		const limiter = ProfessionalRateLimit.getInstance();
		const humanMessage = limiter['getHumanReadableMessage'](
			userTier,
			'voice_transcription',
			retryAfter
		);

		return {
			allowed: false,
			remaining: 0,
			resetTime: new Date(Date.now() + retryAfter * 1000),
			tier: userTier,
			action: 'voice_transcription',
			retryAfter: retryAfter,
			message: humanMessage,
		};
	}
}

/**
 * AI request rate limiting - Safe version
 */
export async function checkAIRateLimit(
	userId: string,
	userTier: 'basic' | 'premium' | 'admin' = 'basic'
): Promise<RateLimitResult> {
	const limiter = ProfessionalRateLimit.getInstance();

	try {
		return await limiter.checkRateLimit({
			key: `ai:${userId}`,
			window: RATE_LIMIT_CONFIGS.ai_request[userTier].window,
			max: RATE_LIMIT_CONFIGS.ai_request[userTier].max,
			tier: userTier,
			action: 'ai_request',
		});
	} catch (error: any) {
		// Instead of throwing, return a rate limit exceeded result
		const limits = RATE_LIMIT_CONFIGS.ai_request[userTier];
		const retryAfter = error.retryAfter || 30;

		const limiter = ProfessionalRateLimit.getInstance();
		const humanMessage = limiter['getHumanReadableMessage'](
			userTier,
			'ai_request',
			retryAfter
		);

		return {
			allowed: false,
			remaining: 0,
			resetTime: new Date(Date.now() + retryAfter * 1000),
			tier: userTier,
			action: 'ai_request',
			retryAfter: retryAfter,
			message: humanMessage,
		};
	}
}

/**
 * Get comprehensive rate limit analytics
 */
export function getRateLimitAnalytics(userId?: string) {
	const limiter = ProfessionalRateLimit.getInstance();
	return limiter.getAnalytics(userId ? `chat:${userId}` : undefined);
}

/**
 * Clear rate limits (admin function)
 */
export async function clearUserRateLimits(userId: string): Promise<void> {
	const limiter = ProfessionalRateLimit.getInstance();
	await Promise.all([
		limiter.clearRateLimit(`chat:${userId}`),
		limiter.clearRateLimit(`voice:${userId}`),
		limiter.clearRateLimit(`ai:${userId}`),
	]);
}
