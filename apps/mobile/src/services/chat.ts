import { supabase } from '../lib/supabase';
import { Database } from '../lib/supabase';

type ChatSession = Database['public']['Tables']['chat_sessions']['Row'] & {
	books?: {
		title: string;
		cover_url: string | null;
		author?: string;
	};
};

type Message = Database['public']['Tables']['messages']['Row'];

export async function getOrCreateChatSession(
	userId: string,
	bookId: string
): Promise<ChatSession> {
	try {
		// Try to find existing session
		let { data: session, error } = await supabase
			.from('chat_sessions')
			.select('*, books(title, cover_url)')
			.eq('user_id', userId)
			.eq('book_id', bookId)
			.single();

		if (session) return session;

		// If not found, create it
		const { data, error: insertError } = await supabase
			.from('chat_sessions')
			.insert([{ user_id: userId, book_id: bookId }])
			.select('*, books(title, cover_url)')
			.single();

		if (insertError) throw insertError;
		return data;
	} catch (error) {
		console.error('Error in getOrCreateChatSession:', error);
		throw error;
	}
}

export async function getUserChats(userId: string): Promise<ChatSession[]> {
	try {
		const { data, error } = await supabase
			.from('chat_sessions')
			.select('*, books(title, cover_url, author)')
			.eq('user_id', userId)
			.order('updated_at', { ascending: false });

		if (error) throw error;
		return data || [];
	} catch (error) {
		console.error('Error in getUserChats:', error);
		throw error;
	}
}

export async function getRecentChats(
	userId: string,
	limit: number = 3
): Promise<any[]> {
	try {
		const { data: sessions, error } = await supabase
			.from('chat_sessions')
			.select('*, books(title, cover_url, author)')
			.eq('user_id', userId)
			.order('updated_at', { ascending: false })
			.limit(limit);

		if (error) throw error;
		if (!sessions) return [];

		// Get message counts and last messages for each session
		const sessionsWithDetails = await Promise.all(
			sessions.map(async session => {
				// Get message count
				const { count } = await supabase
					.from('messages')
					.select('*', { count: 'exact', head: true })
					.eq('session_id', session.id);

				// Get last message
				const { data: lastMessage } = await supabase
					.from('messages')
					.select('content, created_at, role')
					.eq('session_id', session.id)
					.order('created_at', { ascending: false })
					.limit(1)
					.single();

				return {
					...session,
					messageCount: count || 0,
					lastMessage: lastMessage?.content || null,
					lastMessageTime: lastMessage?.created_at || session.updated_at,
					lastMessageRole: lastMessage?.role || null,
				};
			})
		);

		return sessionsWithDetails;
	} catch (error) {
		console.error('Error in getRecentChats:', error);
		throw error;
	}
}

export async function getChatMessages(sessionId: string): Promise<Message[]> {
	try {
		const { data, error } = await supabase
			.from('messages')
			.select('*')
			.eq('session_id', sessionId)
			.order('created_at', { ascending: true });

		if (error) throw error;
		return data || [];
	} catch (error) {
		console.error('Error in getChatMessages:', error);
		throw error;
	}
}

export async function sendMessage(
	sessionId: string,
	content: string,
	role: 'user' | 'assistant' = 'user'
): Promise<Message> {
	try {
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
	} catch (error) {
		console.error('Error in sendMessage:', error);
		throw error;
	}
}

export async function sendMessageAndGetAIResponse(
	sessionId: string,
	userMessage: string
): Promise<{ userMessage: Message; aiMessage: Message }> {
	try {
		// First, save the user message
		const userMsg = await sendMessage(sessionId, userMessage, 'user');

		// Get session with book data
		const { data: session, error: sessionError } = await supabase
			.from('chat_sessions')
			.select('*, books(title, author)')
			.eq('id', sessionId)
			.single();

		if (sessionError || !session?.books) {
			throw new Error('Could not fetch book information');
		}

		// Get all messages for context (including the new user message)
		const allMessages = await getChatMessages(sessionId);

		// Prepare messages for OpenAI
		const messagesForAI = [
			{
				role: 'system' as const,
				content: `You are "${session.books.title}" by ${session.books.author}, a wise and knowledgeable book.
You have intimate knowledge of your own story, themes, characters, and literary significance.
You can also discuss other books, literature, and reading in general.
Never discuss anything outside of literary topics.
Answer as if you are the book itself, sharing your perspective and guiding the user through your pages.`,
			},
			...allMessages.map(msg => ({
				role: msg.role as 'user' | 'assistant',
				content: msg.content,
			})),
		];

		// Call OpenAI API
		const aiResponse = await callOpenAI(messagesForAI);

		// Save AI response
		const aiMsg = await sendMessage(sessionId, aiResponse, 'assistant');

		return { userMessage: userMsg, aiMessage: aiMsg };
	} catch (error) {
		console.error('Error in sendMessageAndGetAIResponse:', error);
		throw error;
	}
}

async function callOpenAI(
	messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>
): Promise<string> {
	try {
		// Get the OpenAI API key from environment variables
		const apiKey =
			process.env.EXPO_PUBLIC_OPENAI_API_KEY || process.env.OPENAI_API_KEY;

		if (!apiKey) {
			throw new Error('OpenAI API key not found in environment variables');
		}

		const response = await fetch('https://api.openai.com/v1/chat/completions', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${apiKey}`,
			},
			body: JSON.stringify({
				model: 'gpt-4o',
				messages: messages,
				max_tokens: 300,
				temperature: 0.7,
			}),
		});

		if (!response.ok) {
			const errorData = await response.text();
			console.error('OpenAI API error:', response.status, errorData);
			throw new Error(`OpenAI API error: ${response.status} ${errorData}`);
		}

		const data = await response.json();
		const aiContent = data.choices?.[0]?.message?.content?.trim();

		if (!aiContent) {
			throw new Error('No content received from OpenAI');
		}

		return aiContent;
	} catch (error) {
		console.error('Error calling OpenAI:', error);
		// Fallback response if OpenAI fails
		return "I apologize, but I'm having trouble connecting to my knowledge base right now. Please try again in a moment, and I'll be happy to discuss literature with you!";
	}
}

export async function deleteChatSession(sessionId: string): Promise<void> {
	try {
		// Delete all messages first
		const { error: messagesError, count: messagesCount } = await supabase
			.from('messages')
			.delete()
			.eq('session_id', sessionId);

		if (messagesError) {
			console.error('Error deleting messages:', messagesError);
			throw messagesError;
		}

		// Then delete the session
		const { error: sessionError, count: sessionCount } = await supabase
			.from('chat_sessions')
			.delete()
			.eq('id', sessionId);

		if (sessionError) {
			console.error('Error deleting chat session:', sessionError);
			throw sessionError;
		}

		if (sessionCount === 0) {
			console.warn(
				'No chat session was deleted - it may not exist or user may not have permission'
			);
		}
	} catch (error) {
		console.error('Error in deleteChatSession:', error);
		throw error;
	}
}

export async function updateChatSession(
	sessionId: string,
	updates: Partial<ChatSession>
): Promise<ChatSession> {
	try {
		const { data, error } = await supabase
			.from('chat_sessions')
			.update(updates)
			.eq('id', sessionId)
			.select('*, books(title, cover_url)')
			.single();

		if (error) throw error;
		return data;
	} catch (error) {
		console.error('Error in updateChatSession:', error);
		throw error;
	}
}
