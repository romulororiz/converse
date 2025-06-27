import { Redis } from '@upstash/redis';

// Check if Upstash Redis is configured
const hasUpstashConfig =
	process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN;

let redis: Redis | null = null;

if (hasUpstashConfig) {
	try {
		redis = new Redis({
			url: process.env.UPSTASH_REDIS_REST_URL!,
			token: process.env.UPSTASH_REDIS_REST_TOKEN!,
		});
		console.log('✅ Upstash Redis configured successfully');
	} catch (error) {
		if (__DEV__) {
			console.log(
				'ℹ️ Upstash Redis failed to initialize (dev mode). Using in-memory rate limiting.'
			);
		} else {
			console.warn('⚠️ Failed to initialize Upstash Redis:', error);
		}
		redis = null;
	}
} else {
	if (__DEV__) {
		console.log(
			'ℹ️ Upstash Redis not configured (dev mode). Using in-memory rate limiting.'
		);
	} else {
		console.warn(
			'⚠️ Upstash Redis not configured. Rate limiting will use in-memory fallback.'
		);
	}
}

// In-memory rate limiting fallback
const memoryStore = new Map<string, { count: number; resetTime: number }>();

export interface RateLimitOptions {
	key: string; // e.g., user id or user:action
	window: number; // seconds
	max: number; // max allowed in window
}

/**
 * Throws an error if the rate limit is exceeded.
 * Falls back to in-memory rate limiting if Upstash Redis is not configured.
 */
export async function checkRateLimit({ key, window, max }: RateLimitOptions) {
	const redisKey = `ratelimit:${key}`;

	// Use Upstash Redis if available
	if (redis) {
		try {
			const count = await redis.incr(redisKey);
			if (count === 1) {
				await redis.expire(redisKey, window);
			}
			if (count > max) {
				throw new Error('You are doing that too much. Please try again later.');
			}
			return count;
		} catch (error) {
			if (__DEV__) {
				console.log(
					'ℹ️ Upstash Redis error (dev mode). Using in-memory rate limiting.'
				);
			} else {
				console.warn(
					'⚠️ Upstash Redis error, falling back to in-memory rate limiting:',
					error
				);
			}
		}
	}

	// Fallback to in-memory rate limiting
	const now = Date.now();
	const resetTime = now + window * 1000;
	const record = memoryStore.get(redisKey);

	if (!record || now >= record.resetTime) {
		// Reset window
		memoryStore.set(redisKey, {
			count: 1,
			resetTime,
		});
		return 1;
	}

	if (record.count >= max) {
		throw new Error('You are doing that too much. Please try again later.');
	}

	record.count++;
	return record.count;
}

/**
 * Clean up expired entries from memory store
 */
export function cleanupMemoryStore() {
	const now = Date.now();
	for (const [key, record] of memoryStore.entries()) {
		if (now >= record.resetTime) {
			memoryStore.delete(key);
		}
	}
}

// Clean up memory store every 5 minutes
setInterval(cleanupMemoryStore, 5 * 60 * 1000);
