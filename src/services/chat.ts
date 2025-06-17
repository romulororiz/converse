import { supabase } from '@/lib/supabase';
import type { Database } from '@/types/supabase';

export async function getOrCreateChatSession(userId: string, bookId: string) {
	// Try to find existing session
	let { data: session, error } = await supabase
		.from('chat_sessions')
		.select('*')
		.eq('user_id', userId)
		.eq('book_id', bookId)
		.single();

	if (session) return session;

	// If not found, create it
	const { data, error: insertError } = await supabase
		.from('chat_sessions')
		.insert([{ user_id: userId, book_id: bookId }])
		.select()
		.single();

	if (insertError) throw insertError;
	return data;
}

export async function getUserChats(userId: string) {
	const { data, error } = await supabase
		.from('chat_sessions')
		.select('*, books(title, cover_url)')
		.eq('user_id', userId)
		.order('updated_at', { ascending: false });

	if (error) throw error;
	return data;
}

export async function getChatMessages(sessionId: string) {
	const { data, error } = await supabase
		.from('messages')
		.select('*')
		.eq('session_id', sessionId)
		.order('created_at', { ascending: true });

	if (error) throw error;
	return data;
}
