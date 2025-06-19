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
			.select('*, books(title, cover_url)')
			.eq('user_id', userId)
			.order('updated_at', { ascending: false });

		if (error) throw error;
		return data || [];
	} catch (error) {
		console.error('Error in getUserChats:', error);
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

export async function getAIResponse(
	sessionId: string,
	userMessage: string
): Promise<string> {
	try {
		// Get all previous messages for context
		const messages = await getChatMessages(sessionId);

		// Prepare messages for AI
		const messagesForAI = [
			{
				role: 'system',
				content: `You are a wise, knowledgeable, and empathetic book. 
You only talk about books, literature, and reading. 
Never discuss anything else. 
Answer as if you are the book itself, 
guiding the user on a literary journey.`,
			},
			...messages.map(msg => ({
				role: msg.role,
				content: msg.content,
			})),
			{
				role: 'user',
				content: userMessage,
			},
		];

		// Call your AI service here
		// For now, we'll use a simple response
		// You can integrate with OpenAI, Claude, or your preferred AI service
		const aiResponse = await callAIService(messagesForAI);

		return aiResponse;
	} catch (error) {
		console.error('Error in getAIResponse:', error);
		throw error;
	}
}

async function callAIService(messages: any[]): Promise<string> {
	// This is a placeholder for AI service integration
	// You can replace this with actual AI service calls
	const lastUserMessage = messages[messages.length - 1]?.content || '';

	// Simple response logic - replace with actual AI service
	if (
		lastUserMessage.toLowerCase().includes('hello') ||
		lastUserMessage.toLowerCase().includes('hi')
	) {
		return "Hello! I'm here to guide you through the wonderful world of literature. What would you like to explore today?";
	}

	if (lastUserMessage.toLowerCase().includes('recommend')) {
		return "I'd be happy to recommend some books! What genres or themes interest you most? Are you looking for something uplifting, thought-provoking, or perhaps a classic that has stood the test of time?";
	}

	if (
		lastUserMessage.toLowerCase().includes('meaning') ||
		lastUserMessage.toLowerCase().includes('theme')
	) {
		return 'Literature is full of rich themes and meanings that speak to the human experience. Every book offers layers of interpretation - from surface-level plot to deeper philosophical questions. What specific aspect would you like to explore?';
	}

	return "That's a fascinating question about literature! Books have the power to transport us to different worlds, challenge our perspectives, and connect us with characters and ideas that resonate across time and culture. What draws you to reading?";
}

export async function deleteChatSession(sessionId: string): Promise<void> {
	try {
		// Delete all messages first
		await supabase.from('messages').delete().eq('session_id', sessionId);

		// Then delete the session
		const { error } = await supabase
			.from('chat_sessions')
			.delete()
			.eq('id', sessionId);

		if (error) throw error;
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
