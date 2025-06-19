import { supabase } from '../lib/supabase';
import { Database } from '../lib/supabase';

type ChatSession = Database['public']['Tables']['chat_sessions']['Row'] & {
	books?: {
		title: string;
		cover_url: string | null;
	};
};

type Message = Database['public']['Tables']['messages']['Row'];

export async function getOrCreateChatSession(
	userId: string,
	bookId: string
): Promise<ChatSession> {
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

export async function getUserChats(userId: string): Promise<ChatSession[]> {
	const { data, error } = await supabase
		.from('chat_sessions')
		.select('*, books(title, cover_url)')
		.eq('user_id', userId)
		.order('updated_at', { ascending: false });

	if (error) throw error;
	return data || [];
}

export async function getChatMessages(sessionId: string): Promise<Message[]> {
	const { data, error } = await supabase
		.from('messages')
		.select('*')
		.eq('session_id', sessionId)
		.order('created_at', { ascending: true });

	if (error) throw error;
	return data || [];
}

export async function sendMessage(
	sessionId: string,
	content: string,
	role: 'user' | 'assistant'
): Promise<Message> {
	const { data, error } = await supabase
		.from('messages')
		.insert([
			{
				session_id: sessionId,
				content,
				role,
				metadata: {},
			},
		])
		.select()
		.single();

	if (error) throw error;
	return data;
}

export async function deleteChatSession(sessionId: string): Promise<void> {
	const { error } = await supabase
		.from('chat_sessions')
		.delete()
		.eq('id', sessionId);

	if (error) throw error;
}
