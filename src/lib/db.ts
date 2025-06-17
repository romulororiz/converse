import { supabase } from './supabase';
import { Database } from '@/types/supabase';

type Tables = Database['public']['Tables'];

// Books
export async function getBooks() {
	const { data, error } = await supabase
		.from('books')
		.select('*')
		.order('created_at', { ascending: false });

	if (error) throw error;
	return data;
}

export async function getBookById(id: string) {
	const { data, error } = await supabase
		.from('books')
		.select('*')
		.eq('id', id)
		.single();

	if (error) throw error;
	return data;
}

// Authors
export async function getAuthors() {
	const { data, error } = await supabase
		.from('authors')
		.select('*')
		.order('name', { ascending: true });

	if (error) throw error;
	return data;
}

export async function getAuthorById(id: string) {
	const { data, error } = await supabase
		.from('authors')
		.select('*')
		.eq('id', id)
		.single();

	if (error) throw error;
	return data;
}

// Chat Sessions
export async function getChatSessions(userId: string) {
	const { data, error } = await supabase
		.from('chat_sessions')
		.select(
			`
      *,
      books (*),
      authors (*)
    `
		)
		.eq('user_id', userId)
		.order('updated_at', { ascending: false });

	if (error) throw error;
	return data;
}

export async function getChatSessionById(id: string) {
	const { data, error } = await supabase
		.from('chat_sessions')
		.select(
			`
      *,
      books (*),
      authors (*)
    `
		)
		.eq('id', id)
		.single();

	if (error) throw error;
	return data;
}

export async function createChatSession(
	session: Tables['chat_sessions']['Insert']
) {
	const { data, error } = await supabase
		.from('chat_sessions')
		.insert(session)
		.select()
		.single();

	if (error) throw error;
	return data;
}

// Messages
export async function getMessages(sessionId: string) {
	const { data, error } = await supabase
		.from('messages')
		.select('*')
		.eq('session_id', sessionId)
		.order('created_at', { ascending: true });

	if (error) throw error;
	return data;
}

export async function createMessage(message: Tables['messages']['Insert']) {
	const { data, error } = await supabase
		.from('messages')
		.insert(message)
		.select()
		.single();

	if (error) throw error;
	return data;
}

// Insights
export async function getInsights(userId: string) {
	const { data, error } = await supabase
		.from('insights')
		.select(
			`
      *,
      books (*)
    `
		)
		.eq('user_id', userId)
		.order('created_at', { ascending: false });

	if (error) throw error;
	return data;
}

export async function createInsight(insight: Tables['insights']['Insert']) {
	const { data, error } = await supabase
		.from('insights')
		.insert(insight)
		.select()
		.single();

	if (error) throw error;
	return data;
}

export async function updateInsight(
	id: string,
	updates: Tables['insights']['Update']
) {
	const { data, error } = await supabase
		.from('insights')
		.update(updates)
		.eq('id', id)
		.select()
		.single();

	if (error) throw error;
	return data;
}

export async function deleteInsight(id: string) {
	const { error } = await supabase.from('insights').delete().eq('id', id);

	if (error) throw error;
}
