import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'your-supabase-url';
const supabaseAnonKey =
	process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'your-supabase-anon-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
	auth: {
		storage: AsyncStorage,
		autoRefreshToken: true,
		persistSession: true,
		detectSessionInUrl: false,
	},
});

// Helper function to get user session
export async function getSession() {
	const {
		data: { session },
		error,
	} = await supabase.auth.getSession();
	if (error) {
		throw error;
	}
	return session;
}

// Helper function to get current user
export async function getCurrentUser() {
	const {
		data: { user },
		error,
	} = await supabase.auth.getUser();
	if (error) {
		throw error;
	}
	return user;
}

export type Json =
	| string
	| number
	| boolean
	| null
	| { [key: string]: Json | undefined }
	| Json[];

export interface Database {
	public: {
		Tables: {
			profiles: {
				Row: {
					id: string;
					email: string;
					full_name: string | null;
					avatar_url: string | null;
					bio: string | null;
					reading_preferences: string | null;
					favorite_genres: string | null;
					reading_goals: string | null;
					role: string | null;
					preferences: Json | null;
					created_at: string;
					updated_at: string;
				};
				Insert: {
					id: string;
					email: string;
					full_name?: string | null;
					avatar_url?: string | null;
					bio?: string | null;
					reading_preferences?: string | null;
					favorite_genres?: string | null;
					reading_goals?: string | null;
					role?: string | null;
					preferences?: Json | null;
					created_at?: string;
					updated_at?: string;
				};
				Update: {
					id?: string;
					email?: string;
					full_name?: string | null;
					avatar_url?: string | null;
					bio?: string | null;
					reading_preferences?: string | null;
					favorite_genres?: string | null;
					reading_goals?: string | null;
					role?: string | null;
					preferences?: Json | null;
					created_at?: string;
					updated_at?: string;
				};
			};
			books: {
				Row: {
					id: string;
					title: string;
					author: string | null;
					description: string | null;
					cover_url: string | null;
					content_vector: number[] | null;
					metadata: Json | null;
					created_at: string;
					updated_at: string;
					slug: string | null;
				};
				Insert: {
					id?: string;
					title: string;
					description?: string | null;
					cover_url?: string | null;
					content_vector?: number[] | null;
					metadata?: Json | null;
					created_at?: string;
					updated_at?: string;
					slug?: string | null;
				};
				Update: {
					id?: string;
					title?: string;
					description?: string | null;
					cover_url?: string | null;
					content_vector?: number[] | null;
					metadata?: Json | null;
					created_at?: string;
					updated_at?: string;
					slug?: string | null;
				};
			};
			authors: {
				Row: {
					id: string;
					name: string;
					bio: string | null;
					image_url: string | null;
					writing_style: string | null;
					personality_traits: string[] | null;
					expertise: string[] | null;
					created_at: string;
					updated_at: string;
				};
				Insert: {
					id?: string;
					name: string;
					bio?: string | null;
					image_url?: string | null;
					writing_style?: string | null;
					personality_traits?: string[] | null;
					expertise?: string[] | null;
					created_at?: string;
					updated_at?: string;
				};
				Update: {
					id?: string;
					name?: string;
					bio?: string | null;
					image_url?: string | null;
					writing_style?: string | null;
					personality_traits?: string[] | null;
					expertise?: string[] | null;
					created_at?: string;
					updated_at?: string;
				};
			};
			book_authors: {
				Row: {
					book_id: string;
					author_id: string;
				};
				Insert: {
					book_id: string;
					author_id: string;
				};
				Update: {
					book_id?: string;
					author_id?: string;
				};
			};
			chat_sessions: {
				Row: {
					id: string;
					user_id: string;
					book_id: string | null;
					author_id: string | null;
					title: string | null;
					content: string | null;
					created_at: string;
					updated_at: string;
				};
				Insert: {
					id?: string;
					user_id: string;
					book_id?: string | null;
					author_id?: string | null;
					title?: string | null;
					content?: string | null;
					created_at?: string;
					updated_at?: string;
				};
				Update: {
					id?: string;
					user_id?: string;
					book_id?: string | null;
					author_id?: string | null;
					title?: string | null;
					content?: string | null;
					created_at?: string;
					updated_at?: string;
				};
			};
			messages: {
				Row: {
					id: string;
					session_id: string;
					content: string;
					role: string;
					metadata: Json | null;
					created_at: string;
				};
				Insert: {
					id?: string;
					session_id: string;
					content: string;
					role: string;
					metadata?: Json | null;
					created_at?: string;
				};
				Update: {
					id?: string;
					session_id?: string;
					content?: string;
					role?: string;
					metadata?: Json | null;
					created_at?: string;
				};
			};
			insights: {
				Row: {
					id: string;
					user_id: string;
					book_id: string | null;
					content: string;
					tags: string[] | null;
					metadata: Json | null;
					created_at: string;
					updated_at: string;
				};
				Insert: {
					id?: string;
					user_id: string;
					book_id?: string | null;
					content: string;
					tags?: string[] | null;
					metadata?: Json | null;
					created_at?: string;
					updated_at?: string;
				};
				Update: {
					id?: string;
					user_id?: string;
					book_id?: string | null;
					content?: string;
					tags?: string[] | null;
					metadata?: Json | null;
					created_at?: string;
					updated_at?: string;
				};
			};
		};
		Views: {
			[_ in never]: never;
		};
		Functions: {
			[_ in never]: never;
		};
		Enums: {};
	};
}
