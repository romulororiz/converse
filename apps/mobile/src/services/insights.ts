import { supabase } from '../lib/supabase';

export type InsightCard = {
	id: string;
	title: string;
	value: string | number;
	change?: string;
	trend?: 'up' | 'down' | 'neutral';
	icon: string;
	description: string;
};

export type ChatGoal = {
	id: string;
	title: string;
	target: number;
	current: number;
	period: 'weekly' | 'monthly' | 'yearly';
	unit: 'books' | 'conversations' | 'messages';
};

export type UserInsights = {
	insights: InsightCard[];
	goals: ChatGoal[];
	period: 'week' | 'month' | 'year';
};

export async function getUserInsights(
	userId: string,
	period: 'week' | 'month' | 'year' = 'month'
): Promise<UserInsights> {
	try {
		// Get current period stats
		const currentStats = await getPeriodStats(userId, period);

		// Calculate insights
		const insights = await calculateInsights(currentStats, period);

		// Get goals
		const goals = await getUserGoals(userId, period);

		return { insights, goals, period };
	} catch (error) {
		console.error('Error fetching user insights:', error);
		throw error;
	}
}

async function getPeriodStats(
	userId: string,
	period: 'week' | 'month' | 'year'
) {
	const now = new Date();
	const start = new Date();

	switch (period) {
		case 'week':
			start.setDate(now.getDate() - 7);
			break;
		case 'month':
			start.setMonth(now.getMonth() - 1);
			break;
		case 'year':
			start.setFullYear(now.getFullYear() - 1);
			break;
	}

	// Get distinct books chatted with
	const { data: booksData, error: booksError } = await supabase
		.from('chat_sessions')
		.select('book_id, books(title, author, categories)')
		.eq('user_id', userId)
		.gte('created_at', start.toISOString())
		.lte('created_at', now.toISOString());

	if (booksError) throw booksError;

	// Get total messages
	const { data: messagesData, error: messagesError } = await supabase
		.from('messages')
		.select('id, role, created_at, session_id')
		.eq('role', 'user')
		.gte('created_at', start.toISOString())
		.lte('created_at', now.toISOString());

	if (messagesError) throw messagesError;

	// Get most active books
	const bookActivity =
		booksData?.reduce((acc, session) => {
			const bookId = session.book_id;
			if (bookId) {
				acc[bookId] = (acc[bookId] || 0) + 1;
			}
			return acc;
		}, {} as Record<string, number>) || {};

	const mostActiveBook = Object.entries(bookActivity).sort(
		([, a], [, b]) => b - a
	)[0];

	// Get favorite genre
	const allCategories =
		booksData
			?.flatMap(session => (session.books as any)?.categories || [])
			.filter(Boolean) || [];

	const categoryCounts = allCategories.reduce((acc, category) => {
		acc[category] = (acc[category] || 0) + 1;
		return acc;
	}, {} as Record<string, number>);

	const favoriteGenre = Object.entries(categoryCounts).sort(
		([, a], [, b]) => (b as number) - (a as number)
	)[0];

	return {
		distinctBooks: booksData?.length || 0,
		totalMessages: messagesData?.length || 0,
		mostActiveBook: mostActiveBook
			? {
					id: mostActiveBook[0],
					count: mostActiveBook[1],
					title:
						(
							booksData?.find(s => s.book_id === mostActiveBook[0])
								?.books as any
						)?.title || 'Unknown',
			  }
			: null,
		favoriteGenre: favoriteGenre
			? {
					name: favoriteGenre[0],
					count: favoriteGenre[1],
					percentage: Math.round(
						((favoriteGenre[1] as number) / allCategories.length) * 100
					),
			  }
			: null,
	};
}

async function calculateInsights(
	stats: any,
	period: 'week' | 'month' | 'year'
): Promise<InsightCard[]> {
	const insights: InsightCard[] = [];

	// Books Chatted With
	insights.push({
		id: '1',
		title: 'Books Chatted With',
		value: stats.distinctBooks,
		change: `this ${period}`,
		trend: 'up',
		icon: 'book-outline',
		description: "Total books you've had conversations with",
	});

	// Messages Sent
	insights.push({
		id: '2',
		title: 'Messages Sent',
		value: stats.totalMessages,
		change: `this ${period}`,
		trend: 'up',
		icon: 'chatbubbles-outline',
		description: "Total messages you've sent to books",
	});

	// Most Active Book
	if (stats.mostActiveBook) {
		insights.push({
			id: '3',
			title: 'Most Active Book',
			value: stats.mostActiveBook.title,
			change: `${stats.mostActiveBook.count} conversations`,
			trend: 'neutral',
			icon: 'library-outline',
			description: "Book you've chatted with the most",
		});
	}

	// Favorite Genre
	if (stats.favoriteGenre) {
		insights.push({
			id: '4',
			title: 'Favorite Genre',
			value: stats.favoriteGenre.name,
			change: `${stats.favoriteGenre.percentage}% of chats`,
			trend: 'neutral',
			icon: 'library-outline',
			description: 'Genre you explore the most',
		});
	}

	// Chat Streak
	insights.push({
		id: '5',
		title: 'Chat Streak',
		value: '5 days',
		change: 'Keep it up!',
		trend: 'up',
		icon: 'flame-outline',
		description: 'Consecutive days with chat activity',
	});

	// Average Messages per Book
	const avgMessages =
		stats.distinctBooks > 0
			? Math.round(stats.totalMessages / stats.distinctBooks)
			: 0;
	insights.push({
		id: '6',
		title: 'Avg Messages/Book',
		value: avgMessages,
		change: 'per book conversation',
		trend: 'neutral',
		icon: 'analytics-outline',
		description: 'Average messages per book conversation',
	});

	return insights;
}

async function getUserGoals(
	userId: string,
	period: 'week' | 'month' | 'year'
): Promise<ChatGoal[]> {
	// For now, return default goals. In the future, these could be stored in the database
	const goals: ChatGoal[] = [
		{
			id: '1',
			title: `Monthly Chat Goal`,
			target: 5,
			current: 3,
			period: 'monthly',
			unit: 'books',
		},
		{
			id: '2',
			title: `Weekly Conversations`,
			target: 10,
			current: 7,
			period: 'weekly',
			unit: 'conversations',
		},
	];

	return goals;
}

// Get insights for a specific book
export async function getBookInsights(userId: string, bookId: string) {
	try {
		const { data: sessions, error: sessionsError } = await supabase
			.from('chat_sessions')
			.select('id, created_at')
			.eq('user_id', userId)
			.eq('book_id', bookId);

		if (sessionsError) throw sessionsError;

		const sessionIds = sessions?.map(s => s.id) || [];

		const { data: messages, error: messagesError } = await supabase
			.from('messages')
			.select('*')
			.in('session_id', sessionIds)
			.order('created_at', { ascending: true });

		if (messagesError) throw messagesError;

		return {
			totalSessions: sessions?.length || 0,
			totalMessages: messages?.length || 0,
			userMessages: messages?.filter(m => m.role === 'user').length || 0,
			firstChat: sessions?.[0]?.created_at,
			lastChat: sessions?.[sessions.length - 1]?.created_at,
		};
	} catch (error) {
		console.error('Error fetching book insights:', error);
		throw error;
	}
}
