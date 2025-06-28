export type Json =
	| string
	| number
	| boolean
	| null
	| { [key: string]: Json | undefined }
	| Json[];

export type Author = {
	id: string;
	name: string;
	bio?: string | null;
	image_url?: string | null;
	writing_style?: string | null;
	personality_traits?: string[] | null;
	expertise?: string[] | null;
	created_at: string;
	updated_at: string;
};

export type BookMetadata = {
	rating?: number | null;
	genres?: string[] | null;
	language?: string | null;
	pages?: number | null;
};

export type Book = {
	id: string;
	title: string;
	description?: string | null;
	cover_url?: string | null;
	content_vector?: number[] | null;
	metadata?: BookMetadata | null;
	created_at: string;
	updated_at: string;
	author: string;
	slug?: string | null;
	book_authors?: { author: Author }[];
	year?: number | null;
};

export type ChatMessage = {
	id: string;
	session_id: string;
	content: string;
	role: 'user' | 'assistant';
	metadata?: Json | null;
	created_at: string;
};

export type ChatSession = {
	id: string;
	user_id: string;
	book_id: string;
	title?: string | null;
	context?: string | null;
	created_at: string;
	updated_at: string;
};

export type UserProfile = {
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
	// Subscription fields
	subscription_plan: 'free' | 'premium' | 'trial';
	subscription_status: 'active' | 'inactive' | 'cancelled';
	subscription_expires_at: string | null;
	message_count: number;
	message_limit: number;
	last_message_reset_date: string;
	created_at: string;
	updated_at: string;
};
