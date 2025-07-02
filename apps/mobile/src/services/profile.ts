import { supabase } from '../lib/supabase';

export interface UserProfile {
	id: string;
	email: string;
	full_name: string | null;
	avatar_url: string | null;
	bio: string | null;
	reading_preferences: string | null;
	favorite_genres: string | null;
	reading_goals: string | null;
	preferences: {
		notifications: boolean;
		darkMode: boolean;
		emailUpdates: boolean;
		readingGoals: boolean;
	} | null;
	created_at: string;
	updated_at: string;
}

export async function getCurrentUserProfile(): Promise<UserProfile | null> {
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

		return profile;
	} catch (error) {
		console.error('Error fetching user profile:', error);
		return null;
	}
}

export async function updateUserProfile(
	updates: Partial<UserProfile>
): Promise<UserProfile | null> {
	try {
		const {
			data: { user },
		} = await supabase.auth.getUser();

		if (!user) return null;

		const { data: profile, error } = await supabase
			.from('profiles')
			.update({
				...updates,
				updated_at: new Date().toISOString(),
			})
			.eq('id', user.id)
			.select()
			.single();

		if (error) throw error;

		return profile;
	} catch (error) {
		console.error('Error updating user profile:', error);
		return null;
	}
}

export async function updateUserPreferences(
	preferences: any
): Promise<boolean> {
	try {
		const {
			data: { user },
		} = await supabase.auth.getUser();

		if (!user) return false;

		const { error } = await supabase
			.from('profiles')
			.update({ preferences })
			.eq('id', user.id);

		if (error) throw error;

		return true;
	} catch (error) {
		console.error('Error updating user preferences:', error);
		return false;
	}
}

/**
 * Get user context for AI prompts
 * This function formats user preferences and reading information for use in AI conversations
 */
export function getUserContextForAI(profile: UserProfile): string {
	const contextParts = [];

	// Basic user info
	if (profile.full_name) {
		contextParts.push(`User's name: ${profile.full_name}`);
	}

	// Reading preferences
	if (profile.reading_preferences) {
		contextParts.push(`Reading preferences: ${profile.reading_preferences}`);
	}

	// Favorite genres
	if (profile.favorite_genres) {
		contextParts.push(`Favorite genres: ${profile.favorite_genres}`);
	}

	// Reading goals
	if (profile.reading_goals) {
		contextParts.push(`Reading goals: ${profile.reading_goals}`);
	}

	// Bio
	if (profile.bio) {
		contextParts.push(`User bio: ${profile.bio}`);
	}

	if (contextParts.length === 0) {
		return "This is a new user who hasn't set up their reading preferences yet. Be welcoming and help them discover books.";
	}

	return `User context: ${contextParts.join(
		'. '
	)}. Use this information to personalize your responses and book recommendations.`;
}

/**
 * Get a personalized greeting based on user profile
 */
export function getPersonalizedGreeting(profile: UserProfile): string {
	if (profile.full_name) {
		return `Hello ${profile.full_name}!`;
	}
	return 'Hello!';
}

/**
 * Get reading preferences summary for display
 */
export function getReadingPreferencesSummary(profile: UserProfile): string {
	const parts = [];

	if (profile.favorite_genres) {
		parts.push(`loves ${profile.favorite_genres}`);
	}

	if (profile.reading_goals) {
		parts.push(`aims to ${profile.reading_goals.toLowerCase()}`);
	}

	if (parts.length === 0) {
		return 'New reader exploring books';
	}

	return parts.join(' and ');
}
