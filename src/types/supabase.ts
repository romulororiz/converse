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
					role: 'user' | 'admin';
					preferences: Json;
					created_at: string;
					updated_at: string;
				};
				Insert: {
					id: string;
					email: string;
					full_name?: string | null;
					avatar_url?: string | null;
					role?: 'user' | 'admin';
					preferences?: Json;
					created_at?: string;
					updated_at?: string;
				};
				Update: {
					id?: string;
					email?: string;
					full_name?: string | null;
					avatar_url?: string | null;
					role?: 'user' | 'admin';
					preferences?: Json;
					created_at?: string;
					updated_at?: string;
				};
			};
			books: {
				Row: {
					id: string;
					title: string;
					author: string;
					description: string | null;
					cover_url: string | null;
					content_vector: number[] | null;
					metadata: Json;
					created_at: string;
					updated_at: string;
				};
				Insert: {
					id?: string;
					title: string;
					author: string;
					description?: string | null;
					cover_url?: string | null;
					content_vector?: number[] | null;
					metadata?: Json;
					created_at?: string;
					updated_at?: string;
				};
				Update: {
					id?: string;
					title?: string;
					author?: string;
					description?: string | null;
					cover_url?: string | null;
					content_vector?: number[] | null;
					metadata?: Json;
					created_at?: string;
					updated_at?: string;
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
			chat_sessions: {
				Row: {
					id: string;
					user_id: string;
					book_id: string | null;
					author_id: string | null;
					title: string | null;
					context: Json;
					created_at: string;
					updated_at: string;
				};
				Insert: {
					id?: string;
					user_id: string;
					book_id?: string | null;
					author_id?: string | null;
					title?: string | null;
					context?: Json;
					created_at?: string;
					updated_at?: string;
				};
				Update: {
					id?: string;
					user_id?: string;
					book_id?: string | null;
					author_id?: string | null;
					title?: string | null;
					context?: Json;
					created_at?: string;
					updated_at?: string;
				};
			};
			messages: {
				Row: {
					id: string;
					session_id: string;
					content: string;
					role: 'user' | 'assistant' | 'system';
					metadata: Json;
					created_at: string;
				};
				Insert: {
					id?: string;
					session_id: string;
					content: string;
					role: 'user' | 'assistant' | 'system';
					metadata?: Json;
					created_at?: string;
				};
				Update: {
					id?: string;
					session_id?: string;
					content?: string;
					role?: 'user' | 'assistant' | 'system';
					metadata?: Json;
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
					metadata: Json;
					created_at: string;
					updated_at: string;
				};
				Insert: {
					id?: string;
					user_id: string;
					book_id?: string | null;
					content: string;
					tags?: string[] | null;
					metadata?: Json;
					created_at?: string;
					updated_at?: string;
				};
				Update: {
					id?: string;
					user_id?: string;
					book_id?: string | null;
					content?: string;
					tags?: string[] | null;
					metadata?: Json;
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
		Enums: {
			user_role: 'user' | 'admin';
			message_role: 'user' | 'assistant' | 'system';
		};
	};
}
