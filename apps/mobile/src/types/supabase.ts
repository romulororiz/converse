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

export type Book = {
	id: string;
	title: string;
	description?: string | null;
	cover_url?: string | null;
	content_vector?: number[] | null;
	metadata?: Json | null;
	created_at: string;
	updated_at: string;
	author: string;
	slug?: string | null;
	book_authors?: { author: Author }[];
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
 