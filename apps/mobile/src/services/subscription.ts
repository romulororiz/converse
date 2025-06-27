import { supabase } from '../lib/supabase';
import { UserProfile } from '../types/supabase';

export interface SubscriptionPlan {
	id: string;
	name: string;
	price: number;
	message_limit: number;
	features: {
		voice_chat: boolean;
		priority_support: boolean;
		unlimited_messages: boolean;
	};
}

export interface MessageUsage {
	id: string;
	user_id: string;
	session_id: string;
	message_count: number;
	created_at: string;
}

// Default subscription plans
export const SUBSCRIPTION_PLANS: Record<string, SubscriptionPlan> = {
	free: {
		id: 'free',
		name: 'Free',
		price: 0,
		message_limit: 10,
		features: {
			voice_chat: false,
			priority_support: false,
			unlimited_messages: false,
		},
	},
	premium: {
		id: 'premium',
		name: 'Premium',
		price: 4.99,
		message_limit: -1, // -1 means unlimited
		features: {
			voice_chat: true,
			priority_support: true,
			unlimited_messages: true,
		},
	},
};

/**
 * Get current user's subscription status and message usage
 */
export async function getUserSubscription(): Promise<UserProfile | null> {
	try {
		const {
			data: { user },
		} = await supabase.auth.getUser();

		if (!user) return null;

		const { data: profile, error } = await supabase
			.from('profiles')
			.select('*')
			.eq('id', user.id)
			.single();

		if (error) throw error;

		// Ensure default values for new users
		if (!profile.subscription_plan) {
			await initializeUserSubscription(user.id);
			return getUserSubscription();
		}

		return profile;
	} catch (error) {
		console.error('Error fetching user subscription:', error);
		return null;
	}
}

/**
 * Initialize subscription data for new users
 */
export async function initializeUserSubscription(
	userId: string
): Promise<void> {
	try {
		const { error } = await supabase
			.from('profiles')
			.update({
				subscription_plan: 'free',
				subscription_status: 'active',
				message_count: 0,
				message_limit: SUBSCRIPTION_PLANS.free.message_limit,
				last_message_reset_date: new Date().toISOString().split('T')[0],
			})
			.eq('id', userId);

		if (error) throw error;
	} catch (error) {
		console.error('Error initializing user subscription:', error);
		throw error;
	}
}

/**
 * Check if user can send a message (has remaining messages)
 */
export async function canSendMessage(userId: string): Promise<{
	canSend: boolean;
	remainingMessages: number;
	limit: number;
	plan: string;
}> {
	try {
		const profile = await getUserSubscription();
		if (!profile) {
			return { canSend: false, remainingMessages: 0, limit: 0, plan: 'free' };
		}

		// Check if we need to reset daily message count
		await checkAndResetDailyLimit(profile);

		const plan =
			SUBSCRIPTION_PLANS[profile.subscription_plan] || SUBSCRIPTION_PLANS.free;
		const remainingMessages =
			plan.message_limit === -1
				? -1
				: plan.message_limit - profile.message_count;

		return {
			canSend:
				plan.message_limit === -1 || profile.message_count < plan.message_limit,
			remainingMessages: remainingMessages,
			limit: plan.message_limit,
			plan: profile.subscription_plan,
		};
	} catch (error) {
		console.error('Error checking message limit:', error);
		return { canSend: false, remainingMessages: 0, limit: 10, plan: 'free' };
	}
}

/**
 * Increment message count for user
 */
export async function incrementMessageCount(
	userId: string,
	sessionId: string
): Promise<void> {
	try {
		// Start a transaction
		const { data: profile, error: profileError } = await supabase
			.from('profiles')
			.select('message_count, subscription_plan')
			.eq('id', userId)
			.single();

		if (profileError) throw profileError;

		// Check if user has unlimited messages
		const plan =
			SUBSCRIPTION_PLANS[profile.subscription_plan] || SUBSCRIPTION_PLANS.free;
		if (plan.message_limit === -1) {
			// Unlimited plan - just track usage for analytics
			await trackMessageUsage(userId, sessionId);
			return;
		}

		// Increment message count
		const { error: updateError } = await supabase
			.from('profiles')
			.update({ message_count: profile.message_count + 1 })
			.eq('id', userId);

		if (updateError) throw updateError;

		// Track usage for analytics
		await trackMessageUsage(userId, sessionId);
	} catch (error) {
		console.error('Error incrementing message count:', error);
		throw error;
	}
}

/**
 * Track message usage for analytics
 */
async function trackMessageUsage(
	userId: string,
	sessionId: string
): Promise<void> {
	try {
		const { error } = await supabase.from('message_usage').insert({
			user_id: userId,
			session_id: sessionId,
			message_count: 1,
		});

		if (error) throw error;
	} catch (error) {
		console.error('Error tracking message usage:', error);
		// Don't throw here as this is just analytics
	}
}

/**
 * Check and reset daily message limit for free users
 */
async function checkAndResetDailyLimit(profile: UserProfile): Promise<void> {
	try {
		const today = new Date().toISOString().split('T')[0];
		const lastReset = profile.last_message_reset_date;

		// If it's a new day, reset the message count
		if (lastReset !== today && profile.subscription_plan === 'free') {
			const { error } = await supabase
				.from('profiles')
				.update({
					message_count: 0,
					last_message_reset_date: today,
				})
				.eq('id', profile.id);

			if (error) throw error;
		}
	} catch (error) {
		console.error('Error resetting daily limit:', error);
	}
}

/**
 * Upgrade user to premium subscription
 */
export async function upgradeToPremium(
	userId: string,
	planType: 'monthly' | 'yearly'
): Promise<void> {
	try {
		const expiresAt = new Date();
		if (planType === 'monthly') {
			expiresAt.setMonth(expiresAt.getMonth() + 1);
		} else {
			expiresAt.setFullYear(expiresAt.getFullYear() + 1);
		}

		const { error } = await supabase
			.from('profiles')
			.update({
				subscription_plan: 'premium',
				subscription_status: 'active',
				subscription_expires_at: expiresAt.toISOString(),
				message_limit: SUBSCRIPTION_PLANS.premium.message_limit,
			})
			.eq('id', userId);

		if (error) throw error;
	} catch (error) {
		console.error('Error upgrading to premium:', error);
		throw error;
	}
}

/**
 * Downgrade user to free plan
 */
export async function downgradeToFree(userId: string): Promise<void> {
	try {
		const { error } = await supabase
			.from('profiles')
			.update({
				subscription_plan: 'free',
				subscription_status: 'active',
				subscription_expires_at: null,
				message_limit: SUBSCRIPTION_PLANS.free.message_limit,
				message_count: 0,
				last_message_reset_date: new Date().toISOString().split('T')[0],
			})
			.eq('id', userId);

		if (error) throw error;
	} catch (error) {
		console.error('Error downgrading to free:', error);
		throw error;
	}
}

/**
 * Get subscription plan details
 */
export function getSubscriptionPlan(planName: string): SubscriptionPlan {
	return SUBSCRIPTION_PLANS[planName] || SUBSCRIPTION_PLANS.free;
}

/**
 * Check if subscription is expired
 */
export function isSubscriptionExpired(profile: UserProfile): boolean {
	if (profile.subscription_plan === 'free') return false;
	if (!profile.subscription_expires_at) return true;

	return new Date(profile.subscription_expires_at) < new Date();
}
