import { Redis } from '@upstash/redis';

const redis = new Redis({
	url: process.env.UPSTASH_REDIS_REST_URL!,
	token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

export interface RateLimitOptions {
	key: string; // e.g., user id or user:action
	window: number; // seconds
	max: number; // max allowed in window
}

/**
 * Throws an error if the rate limit is exceeded.
 */
export async function checkRateLimit({ key, window, max }: RateLimitOptions) {
	const redisKey = `ratelimit:${key}`;
	// Use INCR and EXPIRE for atomic rate limiting
	const count = await redis.incr(redisKey);
	if (count === 1) {
		await redis.expire(redisKey, window);
	}
	if (count > max) {
		throw new Error('You are doing that too much. Please try again later.');
	}
	return count;
}
