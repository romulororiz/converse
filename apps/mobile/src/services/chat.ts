import { supabase } from '../lib/supabase';
import type { Database } from '../lib/supabase';
import { secureApiRequest, apiKeyManager } from '../utils/apiSecurity';
import { validateChatMessage, sanitizeInput } from '../utils/validation';
import { getCurrentUserProfile, getUserContextForAI } from './profile';
import { canSendMessage, incrementMessageCount } from './subscription';

type ChatSession = Database['public']['Tables']['chat_sessions']['Row'] & {
	books?: {
		title: string;
		cover_url: string | null;
		author?: string;
		year?: number | null;
		metadata?: {
			rating?: number | null;
		} | null;
	};
};

type Message = Database['public']['Tables']['messages']['Row'];

export async function getOrCreateChatSession(
	userId: string,
	bookId: string
): Promise<ChatSession> {
	try {
		// First, try to find an existing session
		const { data: existingSession, error: findError } = await supabase
			.from('chat_sessions')
			.select('*, books(title, cover_url, year, metadata)')
			.eq('user_id', userId)
			.eq('book_id', bookId)
			.single();

		if (existingSession) {
			return existingSession;
		}

		// If no existing session, create a new one
		const { data: newSession, error: createError } = await supabase
			.from('chat_sessions')
			.insert([
				{
					user_id: userId,
					book_id: bookId,
				},
			])
			.select('*, books(title, cover_url, year, metadata)')
			.single();

		if (createError) throw createError;
		return newSession;
	} catch (error) {
		console.log('Error in getOrCreateChatSession:', error);
		throw error;
	}
}

export async function getUserChats(userId: string): Promise<ChatSession[]> {
	try {
		const { data, error } = await supabase
			.from('chat_sessions')
			.select('*, books(title, author, cover_url, year, metadata)')
			.eq('user_id', userId)
			.order('updated_at', { ascending: false });

		if (error) throw error;
		return data || [];
	} catch (error) {
		console.log('Error in getUserChats:', error);
		throw error;
	}
}

export async function getRecentChats(
	userId: string,
	limit: number = 3
): Promise<any[]> {
	try {
		const { data, error } = await supabase
			.from('chat_sessions')
			.select(
				`
				id,
				book_id,
				updated_at,
				books (
					title,
					author,
					cover_url,
					year,
					metadata
				)
			`
			)
			.eq('user_id', userId)
			.order('updated_at', { ascending: false })
			.limit(limit);

		if (error) throw error;

		// Get the last message for each chat
		const chatsWithLastMessage = await Promise.all(
			(data || []).map(async chat => {
				const { data: messages } = await supabase
					.from('messages')
					.select('content, role')
					.eq('session_id', chat.id)
					.order('created_at', { ascending: false })
					.limit(1);

				return {
					...chat,
					lastMessage: messages?.[0]?.content || '',
					lastMessageRole: messages?.[0]?.role || 'user',
				};
			})
		);

		return chatsWithLastMessage;
	} catch (error) {
		console.log('Error in getRecentChats:', error);
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
		console.log('Error in getChatMessages:', error);
		throw error;
	}
}

export async function sendMessage(
	sessionId: string,
	content: string,
	role: 'user' | 'assistant' = 'user'
): Promise<Message> {
	try {
		// Validate message content if it's a user message
		if (role === 'user') {
			try {
				// For user messages, we need a bookId to validate properly
				// Since we don't have it here, we'll do basic validation
				if (!content || content.trim().length === 0) {
					throw new Error('Message cannot be empty');
				}
				if (content.length > 2000) {
					throw new Error('Message too long (max 2000 characters)');
				}
			} catch (error) {
				throw new Error(
					error instanceof Error ? error.message : 'Message validation failed'
				);
			}
		}

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
		console.log('Error in sendMessage:', error);
		throw error;
	}
}

export async function sendMessageAndGetAIResponse(
	sessionId: string,
	userMessage: string
): Promise<{ userMessage: Message; aiMessage: Message }> {
	try {
		// Get current user
		const {
			data: { user },
		} = await supabase.auth.getUser();

		if (!user) {
			throw new Error('User not authenticated');
		}

		// Check message limit before sending
		const messageLimit = await canSendMessage(user.id);
		if (!messageLimit.canSend) {
			// Return a special error object instead of throwing
			return {
				error: true,
				isRateLimit: true,
				plan: messageLimit.plan,
				message:
					messageLimit.plan === 'free'
						? `You've reached your daily message limit of ${messageLimit.limit} messages. Upgrade to premium for unlimited messages!`
						: 'Unable to send message. Please try again.',
			} as any;
		}

		// First, save the user message
		const userMsg = await sendMessage(sessionId, userMessage, 'user');

		// Increment message count for free users
		await incrementMessageCount(user.id, sessionId);

		// Get session with book data
		const { data: session, error: sessionError } = await supabase
			.from('chat_sessions')
			.select('*, books(title, author)')
			.eq('id', sessionId)
			.single();

		if (sessionError || !session?.books) {
			throw new Error('Could not fetch book information');
		}

		// Get user profile for personalized responses
		const userProfile = await getCurrentUserProfile();
		const userContext = userProfile ? getUserContextForAI(userProfile) : '';

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
Answer as if you are the book itself, sharing your perspective and guiding the user through your pages.

CRITICAL LANGUAGE INSTRUCTION: 
- ALWAYS detect the language of the user's message and respond in the EXACT same language
- If the user speaks in English, respond in English
- If the user speaks in Spanish, respond in Spanish  
- If the user speaks in French, respond in French
- If the user speaks in German, respond in German
- If the user speaks in Italian, respond in Italian
- If the user speaks in Portuguese, respond in Portuguese
- If the user speaks in any other language, respond in that same language
- Never mix languages in your response
- Maintain the same level of formality and tone as the user's message.;
${
	userContext
		? `\nUser Information: ${userContext}\nUse this information to personalize your responses. Use the ${userContext} to make your responses 
 more personal to the user. Talk to the user as if you are a friend on first name basis.
 `
		: ''
}`,
			},
			...allMessages.map(msg => ({
				role: msg.role as 'user' | 'assistant',
				content: msg.content,
			})),
		];

		// Call OpenAI API
		const aiResponse = await callOpenAI(messagesForAI);

		// Check if OpenAI call failed
		if (typeof aiResponse === 'object' && aiResponse.error) {
			return {
				error: true,
				isRateLimit: aiResponse.isApiRateLimit,
				isApiRateLimit: aiResponse.isApiRateLimit,
				message: aiResponse.isApiRateLimit
					? `API rate limit reached. Please wait ${aiResponse.waitTime || 60} seconds before trying again.`
					: aiResponse.message,
				waitTime: aiResponse.waitTime,
			} as any;
		}

		// Save AI response
		const aiMsg = await sendMessage(
			sessionId,
			aiResponse as string,
			'assistant'
		);

		return { userMessage: userMsg, aiMessage: aiMsg };
	} catch (error) {
		console.log('🔥 Error in sendMessageAndGetAIResponse:', error);
		console.log('🔥 Error type:', typeof error);
		console.log('🔥 Error constructor:', error?.constructor?.name);
		console.log(
			'🔥 Error message:',
			error instanceof Error ? error.message : String(error)
		);

		// Return error object instead of throwing
		let errorMessage = 'Unable to send message. Please try again.';

		// Check if it's a rate limit related error
		if (error instanceof Error) {
			const errorMsg = error.message.toLowerCase();
			if (
				errorMsg.includes('rate limit') ||
				errorMsg.includes('too many requests') ||
				errorMsg.includes('429')
			) {
				errorMessage =
					'You are sending messages too quickly. Please wait a moment before trying again.';
			} else if (errorMsg.includes('openai') || errorMsg.includes('api')) {
				errorMessage =
					'AI service is temporarily busy. Please try again in a moment.';
			} else if (
				errorMsg.includes('network') ||
				errorMsg.includes('fetch') ||
				errorMsg.includes('connection')
			) {
				errorMessage =
					'Connection issue detected. Please check your internet and try again.';
			} else if (errorMsg.includes('quota') || errorMsg.includes('billing')) {
				errorMessage =
					'AI service temporarily unavailable. Please try again later.';
			}
		}

		return {
			error: true,
			isRateLimit: false,
			message: errorMessage,
		} as any;
	}
}

async function callOpenAI(
	messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>
): Promise<
	| string
	| { error: true; isApiRateLimit: boolean; message: string; waitTime?: number }
> {
	const result = await secureApiRequest('openai', async () => {
		try {
			// Get the OpenAI API key securely
			const apiKey = apiKeyManager.getOpenAIKey();

			const response = await fetch(
				'https://api.openai.com/v1/chat/completions',
				{
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
				}
			);

			if (!response.ok) {
				const errorData = await response.text();
				console.log('OpenAI API error:', response.status, errorData);
				throw new Error(`OpenAI API error: ${response.status} ${errorData}`);
			}

			const data = await response.json();
			const aiContent = data.choices?.[0]?.message?.content?.trim();

			if (!aiContent) {
				throw new Error('No content received from OpenAI');
			}

			return sanitizeInput(aiContent);
		} catch (error) {
			console.log('Error calling OpenAI:', error);
			// Re-throw the error to let secureApiRequest handle it
			throw error;
		}
	});

	// Check if secureApiRequest returned an error
	if (result && typeof result === 'object' && result.error) {
		console.log('🚨 API call returned error:', result);
		return result;
	}

	return result;
}

export async function deleteChatSession(sessionId: string): Promise<void> {
	try {
		// Delete all messages first
		const { error: messagesError, count: messagesCount } = await supabase
			.from('messages')
			.delete()
			.eq('session_id', sessionId);

		if (messagesError) {
			console.log('Error deleting messages:', messagesError);
			throw messagesError;
		}

		// Then delete the session
		const { error: sessionError, count: sessionCount } = await supabase
			.from('chat_sessions')
			.delete()
			.eq('id', sessionId);

		if (sessionError) {
			console.log('Error deleting chat session:', sessionError);
			throw sessionError;
		}

		if (sessionCount === 0) {
			console.warn(
				'No chat session was deleted - it may not exist or user may not have permission'
			);
		}
	} catch (error) {
		console.log('Error in deleteChatSession:', error);
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
		console.log('Error in updateChatSession:', error);
		throw error;
	}
}
