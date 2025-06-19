import { supabase } from '../lib/supabase';
import { API_CONFIG } from '../config/api';

export async function getChatMessages(bookId: string): Promise<any[]> {
	try {
		const {
			data: { user },
		} = await supabase.auth.getUser();
		if (!user) throw new Error('Not authenticated');

		const response = await fetch(
			`${API_CONFIG.BASE_URL}/chats/${bookId}/messages?userId=${user.id}`
		);

		if (!response.ok) {
			throw new Error('Failed to fetch messages');
		}

		return await response.json();
	} catch (error) {
		console.error('Error fetching chat messages:', error);
		throw error;
	}
}

export async function sendChatMessage(
	bookId: string,
	content: string
): Promise<any[]> {
	try {
		const {
			data: { user },
		} = await supabase.auth.getUser();
		if (!user) throw new Error('Not authenticated');

		const response = await fetch(
			`${API_CONFIG.BASE_URL}/chats/${bookId}/messages?userId=${user.id}`,
			{
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({ content }),
			}
		);

		if (!response.ok) {
			throw new Error('Failed to send message');
		}

		return await response.json();
	} catch (error) {
		console.error('Error sending chat message:', error);
		throw error;
	}
}

export async function getChatSessions(): Promise<any[]> {
	try {
		const {
			data: { user },
		} = await supabase.auth.getUser();
		if (!user) throw new Error('Not authenticated');

		const response = await fetch(
			`${API_CONFIG.BASE_URL}/chats?userId=${user.id}`
		);

		if (!response.ok) {
			throw new Error('Failed to fetch chat sessions');
		}

		return await response.json();
	} catch (error) {
		console.error('Error fetching chat sessions:', error);
		throw error;
	}
}
