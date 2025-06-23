import { supabase } from '../lib/supabase';

export type Category = {
	name: string;
	count: number;
	icon: string;
	description: string;
	color: string;
};

export const getCategoriesWithCounts = async (): Promise<Category[]> => {
	try {
		// Query to get all categories with their book counts
		const { data: books, error } = await supabase
			.from('books')
			.select('categories');

		if (error) {
			console.error('Error fetching categories:', error);
			throw error;
		}

		// Count occurrences of each category
		const categoryCounts: { [key: string]: number } = {};

		books?.forEach(book => {
			if (book.categories && Array.isArray(book.categories)) {
				book.categories.forEach((category: string) => {
					categoryCounts[category] = (categoryCounts[category] || 0) + 1;
				});
			}
		});

		// Define category metadata with popularity-based ordering
		const categoryMetadata: {
			[key: string]: {
				icon: string;
				description: string;
				color: string;
				priority: number;
			};
		} = {
			Romance: {
				icon: 'heart',
				description: 'Love stories and relationships from classic authors',
				color: '#FF6B6B',
				priority: 1,
			},
			'Classic Literature': {
				icon: 'library',
				description: 'Timeless works from renowned authors',
				color: '#4ECDC4',
				priority: 2,
			},
			'Mystery & Detective': {
				icon: 'search',
				description: 'Puzzles, crimes, and suspenseful investigations',
				color: '#45B7D1',
				priority: 3,
			},
			Adventure: {
				icon: 'map',
				description: 'Thrilling journeys and exciting escapades',
				color: '#96CEB4',
				priority: 4,
			},
			'Science Fiction': {
				icon: 'rocket',
				description: 'Futuristic and speculative stories',
				color: '#A8E6CF',
				priority: 5,
			},
			'Gothic & Horror': {
				icon: 'skull',
				description: 'Dark tales of suspense and supernatural',
				color: '#FF8B94',
				priority: 6,
			},
			'Historical Fiction': {
				icon: 'time',
				description: 'Stories set in past eras and civilizations',
				color: '#F4A261',
				priority: 7,
			},
			Philosophy: {
				icon: 'bulb',
				description: 'Wisdom and deep thinking from great minds',
				color: '#E76F51',
				priority: 8,
			},
			"Children's Literature": {
				icon: 'happy',
				description: 'Delightful stories for young readers',
				color: '#FFEAA7',
				priority: 9,
			},
			Fantasy: {
				icon: 'sparkles',
				description: 'Magical and mythical worlds',
				color: '#DDA0DD',
				priority: 10,
			},
			'Drama & Theater': {
				icon: 'videocam',
				description: 'Classic plays and theatrical works',
				color: '#87CEEB',
				priority: 11,
			},
			'Religious & Spiritual': {
				icon: 'star',
				description: 'Sacred texts and spiritual guidance',
				color: '#D4AF37',
				priority: 12,
			},
			'Self-Help': {
				icon: 'trending-up',
				description: 'Personal development and growth',
				color: '#2A9D8F',
				priority: 13,
			},
			'Political Science': {
				icon: 'flag',
				description: 'Political theory and governance',
				color: '#B19CD9',
				priority: 14,
			},
			'Military Strategy': {
				icon: 'shield',
				description: 'Strategic thinking and warfare',
				color: '#8B4513',
				priority: 15,
			},
			'Social Fiction': {
				icon: 'people',
				description: 'Stories exploring social issues',
				color: '#20B2AA',
				priority: 16,
			},
			'Psychological Fiction': {
				icon: 'brain',
				description: 'Deep psychological character studies',
				color: '#9370DB',
				priority: 17,
			},
			Satire: {
				icon: 'happy-outline',
				description: 'Witty criticism through humor',
				color: '#FFD700',
				priority: 18,
			},
			'Family Saga': {
				icon: 'home',
				description: 'Multi-generational family stories',
				color: '#CD853F',
				priority: 19,
			},
			Nature: {
				icon: 'leaf',
				description: 'Stories celebrating the natural world',
				color: '#228B22',
				priority: 20,
			},
		};

		// Convert to array and sort by popularity priority, then by book count
		const categories: Category[] = Object.entries(categoryCounts)
			.map(([name, count]) => ({
				name,
				count,
				icon: categoryMetadata[name]?.icon || 'book',
				description:
					categoryMetadata[name]?.description || 'Classic literature',
				color: categoryMetadata[name]?.color || '#6C757D',
				priority: categoryMetadata[name]?.priority || 999,
			}))
			.sort((a, b) => {
				// First sort by priority (popularity), then by count for ties
				if (a.priority !== b.priority) {
					return a.priority - b.priority;
				}
				return b.count - a.count;
			});

		return categories;
	} catch (error) {
		console.error('Error in getCategoriesWithCounts:', error);
		throw error;
	}
};

export const searchBooksByCategory = async (category: string) => {
	try {
		const { data, error } = await supabase
			.from('books')
			.select('*')
			.contains('categories', [category]);

		if (error) {
			console.error('Error searching books by category:', error);
			throw error;
		}

		return data || [];
	} catch (error) {
		console.error('Error in searchBooksByCategory:', error);
		throw error;
	}
};
